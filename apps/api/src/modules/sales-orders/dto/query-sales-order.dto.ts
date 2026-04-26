import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { SalesOrderStatus, SalesOrderType } from '@infitek/shared';

export class QuerySalesOrderDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsIn(Object.values(SalesOrderStatus))
  status?: SalesOrderStatus;

  @IsOptional()
  @IsIn(Object.values(SalesOrderType))
  orderType?: SalesOrderType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number;
}
