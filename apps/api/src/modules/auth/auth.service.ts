import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserStatus } from '@infitek/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByUsername(username);

    // 用户不存在或密码错误：统一返回相同错误，防止用户枚举攻击
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: '用户名或密码错误' });
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED', message: '账号已停用' });
    }

    const payload = { sub: user.id, username: user.username };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
