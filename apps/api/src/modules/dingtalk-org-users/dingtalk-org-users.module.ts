import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { DingtalkOrgUser } from './entities/dingtalk-org-user.entity';
import { DingtalkOrgUsersRepository } from './dingtalk-org-users.repository';
import { DingtalkOrgUsersClient } from './dingtalk-org-users.client';
import { DingtalkOrgUsersService } from './dingtalk-org-users.service';
import { DingtalkOrgUsersController } from './dingtalk-org-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DingtalkOrgUser]), UsersModule],
  controllers: [DingtalkOrgUsersController],
  providers: [DingtalkOrgUsersRepository, DingtalkOrgUsersClient, DingtalkOrgUsersService],
})
export class DingtalkOrgUsersModule {}
