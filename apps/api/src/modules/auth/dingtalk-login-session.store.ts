import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';

const DEFAULT_STATE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_LOGIN_TICKET_TTL_MS = 2 * 60 * 1000;

interface StateRecord {
  expiresAt: number;
}

interface LoginTicketRecord {
  userId: number;
  username: string;
  expiresAt: number;
  usedAt: number | null;
}

export interface LoginTicketPayload {
  userId: number;
  username: string;
}

@Injectable()
export class DingtalkLoginSessionStore {
  private readonly states = new Map<string, StateRecord>();
  private readonly loginTickets = new Map<string, LoginTicketRecord>();

  createState(ttlMs: number = DEFAULT_STATE_TTL_MS): string {
    this.cleanupExpiredEntries();

    const state = randomBytes(32).toString('hex');
    this.states.set(state, {
      expiresAt: Date.now() + ttlMs,
    });

    return state;
  }

  consumeState(state: string): void {
    const record = this.states.get(state);
    if (!record || record.expiresAt <= Date.now()) {
      this.states.delete(state);
      throw new UnauthorizedException({ code: 'DINGTALK_STATE_INVALID', message: '钉钉登录状态无效或已过期' });
    }

    this.states.delete(state);
  }

  createLoginTicket(payload: LoginTicketPayload, ttlMs: number = DEFAULT_LOGIN_TICKET_TTL_MS): string {
    this.cleanupExpiredEntries();

    const ticket = randomBytes(32).toString('hex');
    this.loginTickets.set(ticket, {
      userId: payload.userId,
      username: payload.username,
      expiresAt: Date.now() + ttlMs,
      usedAt: null,
    });

    return ticket;
  }

  consumeLoginTicket(ticket: string): LoginTicketPayload {
    const record = this.loginTickets.get(ticket);
    if (!record) {
      throw new UnauthorizedException({ code: 'DINGTALK_TICKET_INVALID', message: '登录 ticket 无效' });
    }

    if (record.expiresAt <= Date.now()) {
      this.loginTickets.delete(ticket);
      throw new UnauthorizedException({ code: 'DINGTALK_TICKET_EXPIRED', message: '登录 ticket 已过期' });
    }

    if (record.usedAt) {
      throw new UnauthorizedException({ code: 'DINGTALK_TICKET_USED', message: '登录 ticket 已被使用' });
    }

    record.usedAt = Date.now();
    this.loginTickets.set(ticket, record);

    return {
      userId: record.userId,
      username: record.username,
    };
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();

    for (const [state, record] of this.states.entries()) {
      if (record.expiresAt <= now) {
        this.states.delete(state);
      }
    }

    for (const [ticket, record] of this.loginTickets.entries()) {
      if (record.expiresAt <= now) {
        this.loginTickets.delete(ticket);
      }
    }
  }
}
