import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class QueryOutboundCreatePrefillDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  logisticsOrderId: number;
}
