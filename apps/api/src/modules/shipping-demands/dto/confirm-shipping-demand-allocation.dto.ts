import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { FulfillmentType } from '@infitek/shared';

export class ConfirmShippingDemandAllocationItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId: number;

  @IsIn(Object.values(FulfillmentType))
  fulfillmentType: FulfillmentType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  warehouseId?: number;
}

export class ConfirmShippingDemandAllocationDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ConfirmShippingDemandAllocationItemDto)
  items: ConfirmShippingDemandAllocationItemDto[];
}
