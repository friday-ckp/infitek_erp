import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError, NotBeforeError } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    try {
      const isPublic = this.reflector?.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (isPublic) {
        return true;
      }
    } catch (e) {
      // Reflector not available, continue with JWT check
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', message: 'Token 已过期，请重新登录' });
    }
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', message: 'Token 格式无效' });
    }
    if (info instanceof NotBeforeError) {
      throw new UnauthorizedException({ code: 'TOKEN_NOT_ACTIVE', message: 'Token 尚未生效' });
    }
    if (err || !user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: '未授权访问' });
    }
    return user;
  }
}
