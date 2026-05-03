import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LogisticsOrderStatus } from '@infitek/shared';

export class UpdateLogisticsTrackingDto {
  @IsOptional()
  @IsDateString()
  etd?: string | null;

  @IsOptional()
  @IsDateString()
  eta?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  bookingNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  carrier?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  vesselVoyage?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  blSoNumber?: string | null;

  @IsOptional()
  @IsDateString()
  actualDepartureDate?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(LogisticsOrderStatus))
  status?: LogisticsOrderStatus;
}
