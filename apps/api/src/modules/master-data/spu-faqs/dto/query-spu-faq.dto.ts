import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class QuerySpuFaqDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  spuId: number;
}
