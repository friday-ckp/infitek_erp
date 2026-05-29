import { Expose } from 'class-transformer';
import { UserStatus } from '@infitek/shared';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  name: string;

  @Expose()
  status: UserStatus;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  @Expose()
  created_by: string;

  @Expose()
  updated_by: string;

  @Expose({ name: 'dingtalk_nick' })
  dingtalkNick: string | null;

  @Expose({ name: 'dingtalk_bound_at' })
  dingtalkBoundAt: Date | null;
}
