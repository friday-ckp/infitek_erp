import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateShippingDemandItemSupplierDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  purchaseSupplierId: number;
}
