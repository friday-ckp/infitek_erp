import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ManualBindDingtalkOrgUserDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;
}
