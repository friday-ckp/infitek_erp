import { UnauthorizedException } from '@nestjs/common';
import { DingtalkLoginSessionStore } from '../dingtalk-login-session.store';

describe('DingtalkLoginSessionStore', () => {
  let store: DingtalkLoginSessionStore;

  beforeEach(() => {
    store = new DingtalkLoginSessionStore();
  });

  it('state 只能成功消费一次', () => {
    const state = store.createState();

    expect(() => store.consumeState(state)).not.toThrow();
    try {
      store.consumeState(state);
      fail('expected consumeState to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toMatchObject({ code: 'DINGTALK_STATE_INVALID' });
    }
  });

  it('ticket 只能成功消费一次', () => {
    const ticket = store.createLoginTicket({ userId: 1, username: 'admin' });

    expect(store.consumeLoginTicket(ticket)).toEqual({ userId: 1, username: 'admin' });
    try {
      store.consumeLoginTicket(ticket);
      fail('expected consumeLoginTicket to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toMatchObject({ code: 'DINGTALK_TICKET_USED' });
    }
  });

  it('过期 ticket 应抛出 DINGTALK_TICKET_EXPIRED', () => {
    const ticket = store.createLoginTicket({ userId: 1, username: 'admin' }, -1);

    try {
      store.consumeLoginTicket(ticket);
      fail('expected consumeLoginTicket to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getResponse()).toMatchObject({ code: 'DINGTALK_TICKET_EXPIRED' });
    }
  });
});
