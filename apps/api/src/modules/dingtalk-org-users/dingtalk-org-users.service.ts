import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DingtalkOrgUserStatus, UserStatus } from '@infitek/shared';
import { DingtalkOrgUsersRepository } from './dingtalk-org-users.repository';
import { DingtalkOrgUsersClient } from './dingtalk-org-users.client';
import { UsersService } from '../users/users.service';
import type { User } from '../users/entities/user.entity';
import { QueryDingtalkOrgUsersDto } from './dto/query-dingtalk-org-users.dto';
import type { DingtalkOrgUser } from './entities/dingtalk-org-user.entity';

@Injectable()
export class DingtalkOrgUsersService {
  private readonly logger = new Logger(DingtalkOrgUsersService.name);

  constructor(
    private readonly repository: DingtalkOrgUsersRepository,
    private readonly client: DingtalkOrgUsersClient,
    private readonly usersService: UsersService,
  ) {}

  findAll(query: QueryDingtalkOrgUsersDto) {
    return this.repository.findAll(query).then(async (result) => {
      const suggestedUserIds = result.list
        .map((item) => item.suggestedUserId)
        .filter((value): value is number => typeof value === 'number');
      const users = await this.usersService.findByIds(suggestedUserIds);
      const userMap = new Map(users.map((user) => [user.id, user]));

      return {
        ...result,
        list: result.list.map((item) => ({
          ...item,
          suggestedUsername: item.suggestedUserId ? userMap.get(item.suggestedUserId)?.username ?? null : null,
          suggestedUserName: item.suggestedUserId ? userMap.get(item.suggestedUserId)?.name ?? null : null,
        })),
      };
    });
  }

  async sync(operatorUsername: string) {
    this.assertAdmin(operatorUsername);

    this.logger.log(`Starting DingTalk org sync; operator=${operatorUsername}`);

    try {
      const profiles = await this.client.fetchOrganizationUsers();
      this.logger.log(`Fetched DingTalk org users; operator=${operatorUsername}; total=${profiles.length}`);

      let created = 0;
      let updated = 0;
      let bound = 0;

      for (const profile of profiles) {
        const existing = await this.repository.findByUnionId(profile.unionId);
        const boundUser = await this.usersService.findByDingtalkUnionId(profile.unionId);
        const match = await this.evaluateMatch(profile, boundUser);

        if (boundUser) {
          bound += 1;
        }

        const payload: Partial<DingtalkOrgUser> = {
          unionId: profile.unionId,
          userId: profile.userId,
          openId: profile.openId,
          nick: profile.nick,
          mobile: profile.mobile,
          email: profile.email,
          jobNumber: profile.jobNumber,
          departmentNames: profile.departmentNames,
          status: match.status,
          suggestedUserId: match.suggestedUserId,
          matchReason: match.matchReason,
          lastSyncedAt: new Date(),
          updatedBy: operatorUsername,
        };

        if (existing) {
          await this.repository.update(existing.id, payload);
          updated += 1;
        } else {
          await this.repository.create({
            ...payload,
            createdBy: operatorUsername,
          });
          created += 1;
        }
      }

      const summary = {
        total: profiles.length,
        created,
        updated,
        skipped: 0,
        failed: 0,
        bound,
      };

      this.logger.log(
        `Completed DingTalk org sync; operator=${operatorUsername}; total=${summary.total}; created=${summary.created}; updated=${summary.updated}; bound=${summary.bound}`,
      );

      return summary;
    } catch (error) {
      this.logger.error(
        `DingTalk org sync failed; operator=${operatorUsername}; message=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async confirmBinding(recordId: number, operatorUsername: string) {
    this.assertAdmin(operatorUsername);
    const record = await this.getRecordOrThrow(recordId);
    if (!record.suggestedUserId) {
      throw new BadRequestException({
        code: 'DINGTALK_MATCH_CANDIDATE_MISSING',
        message: '当前记录没有可确认的唯一候选用户',
      });
    }

    return this.bindRecordToUser(record, record.suggestedUserId, operatorUsername, 'confirmed-binding');
  }

  async manualBind(recordId: number, userId: number, operatorUsername: string) {
    this.assertAdmin(operatorUsername);
    const record = await this.getRecordOrThrow(recordId);
    return this.bindRecordToUser(record, userId, operatorUsername, 'manual-binding');
  }

  async unbind(recordId: number, operatorUsername: string) {
    this.assertAdmin(operatorUsername);
    const record = await this.getRecordOrThrow(recordId);
    const boundUser = await this.usersService.findByDingtalkUnionId(record.unionId);
    if (boundUser) {
      await this.usersService.unbindDingtalkIdentity(boundUser.id, operatorUsername);
    }

    const match = await this.evaluateMatch(record, null);
    return this.repository.update(record.id, {
      status: match.status,
      suggestedUserId: match.suggestedUserId,
      matchReason: match.matchReason,
      lastProcessedAt: new Date(),
      processedBy: operatorUsername,
      updatedBy: operatorUsername,
    });
  }

  async recomputeMatch(recordId: number, operatorUsername: string) {
    this.assertAdmin(operatorUsername);
    const record = await this.getRecordOrThrow(recordId);
    const boundUser = await this.usersService.findByDingtalkUnionId(record.unionId);
    const match = await this.evaluateMatch(record, boundUser);
    return this.repository.update(record.id, {
      status: match.status,
      suggestedUserId: match.suggestedUserId,
      matchReason: match.matchReason,
      lastProcessedAt: new Date(),
      processedBy: operatorUsername,
      updatedBy: operatorUsername,
    });
  }

  private assertAdmin(operatorUsername: string) {
    if (operatorUsername !== 'admin') {
      throw new ForbiddenException('只有管理员可以执行钉钉组织同步操作');
    }
  }

  private async evaluateMatch(
    profile: {
      unionId: string;
      email: string | null;
      mobile: string | null;
      jobNumber: string | null;
      nick: string | null;
    },
    boundUser: { id: number } | null,
  ) {
    if (boundUser) {
      return {
        status: DingtalkOrgUserStatus.BOUND,
        suggestedUserId: boundUser.id,
        matchReason: 'matched-by-existing-binding',
      };
    }

    const candidates = await this.usersService.findActiveMatchCandidates({
      mobile: profile.mobile,
      email: profile.email,
      jobNumber: profile.jobNumber,
    });
    const fields = [
      { key: 'mobile', value: profile.mobile },
      { key: 'email', value: profile.email },
      { key: 'jobNumber', value: profile.jobNumber },
    ] as const;

    const uniqueMatches: Array<{
      field: 'mobile' | 'email' | 'jobNumber';
      user: User;
    }> = [];
    for (const field of fields) {
      if (!field.value) {
        continue;
      }

      const matches = candidates.filter((user) => user[field.key] === field.value);
      if (matches.length > 1) {
        return {
          status: DingtalkOrgUserStatus.CONFLICT,
          suggestedUserId: null,
          matchReason: `conflict:${field.key}:multiple-matches`,
        };
      }

      if (matches.length === 1) {
        uniqueMatches.push({ field: field.key, user: matches[0] });
      }
    }

    if (uniqueMatches.length === 0) {
      return {
        status: DingtalkOrgUserStatus.UNBOUND,
        suggestedUserId: null,
        matchReason: 'no-erp-match',
      };
    }

    const firstUserId = uniqueMatches[0].user.id;
    const conflictingUnique = uniqueMatches.some((item) => item.user.id !== firstUserId);
    if (conflictingUnique) {
      return {
        status: DingtalkOrgUserStatus.CONFLICT,
        suggestedUserId: null,
        matchReason: `conflict:cross-field:${uniqueMatches.map((item) => item.field).join('+')}`,
      };
    }

    const reasons = uniqueMatches.map((item) => item.field).join('+');
    return {
      status: DingtalkOrgUserStatus.CANDIDATE,
      suggestedUserId: firstUserId,
      matchReason: `candidate:${reasons}`,
    };
  }

  private async bindRecordToUser(
    record: DingtalkOrgUser,
    userId: number,
    operatorUsername: string,
    reason: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('目标 ERP 用户不存在');
    }

    await this.usersService.bindDingtalkIdentity(
      userId,
      {
        dingtalkUnionId: record.unionId,
        dingtalkUserId: record.userId ?? undefined,
        dingtalkOpenId: record.openId ?? undefined,
        dingtalkNick: record.nick ?? undefined,
      },
      operatorUsername,
    );

    return this.repository.update(record.id, {
      status: DingtalkOrgUserStatus.BOUND,
      suggestedUserId: userId,
      matchReason: reason,
      lastProcessedAt: new Date(),
      processedBy: operatorUsername,
      updatedBy: operatorUsername,
    });
  }

  private async getRecordOrThrow(recordId: number) {
    const record = await this.repository.findById(recordId);
    if (!record) {
      throw new NotFoundException('钉钉用户池记录不存在');
    }
    return record;
  }

  private async findSuggestedUser(profile: {
    email: string | null;
    mobile: string | null;
    jobNumber: string | null;
    nick: string | null;
  }) {
    const firstPage = await this.usersService.findAll(1, 200);
    return (
      firstPage.list.find((user) => {
        if (user.status !== UserStatus.ACTIVE) {
          return false;
        }

        return [profile.email, profile.mobile, profile.jobNumber, profile.nick]
          .filter((value): value is string => Boolean(value))
          .some((value) => user.username === value || user.name === value);
      }) ?? null
    );
  }

  private buildMatchReason(
    boundUser: { id: number } | null,
    suggestedUser: { username?: string; name?: string } | null,
  ) {
    if (boundUser) {
      return 'matched-by-existing-binding';
    }

    if (suggestedUser?.username) {
      return `matched-by-local-user:${suggestedUser.username}`;
    }

    if (suggestedUser?.name) {
      return `matched-by-local-name:${suggestedUser.name}`;
    }

    return null;
  }
}
