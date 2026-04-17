import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenExpiredError } from 'jsonwebtoken';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('handleRequest', () => {
    it('应返回 user（有效 Token）', () => {
      const user = { id: 1, username: 'admin' };
      const result = guard.handleRequest(null, user, null);
      expect(result).toEqual(user);
    });

    it('Token 过期时应抛出 TOKEN_EXPIRED', () => {
      const expiredError = new TokenExpiredError('jwt expired', new Date());
      expect(() => guard.handleRequest(null, null, expiredError)).toThrow(
        expect.objectContaining({ response: { code: 'TOKEN_EXPIRED', message: 'Token 已过期，请重新登录' } }),
      );
    });

    it('无 Token 时应抛出 UNAUTHORIZED', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        expect.objectContaining({ response: { code: 'UNAUTHORIZED', message: '未授权访问' } }),
      );
    });

    it('有错误时应抛出 UNAUTHORIZED', () => {
      expect(() => guard.handleRequest(new Error('some error'), null, null)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('canActivate', () => {
    it('@Public() 路由应直接放行', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const mockContext = {
        getHandler: () => ({}),
        getClass: () => ({}),
      } as ExecutionContext;

      const result = guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});
