import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateSpuFaqDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  question?: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
