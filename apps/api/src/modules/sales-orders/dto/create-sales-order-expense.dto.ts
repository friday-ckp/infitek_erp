import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateSalesOrderExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  expenseName: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}
