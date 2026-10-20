import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StockMovementType } from '../stock-movement.entity';

export class CreateStockMovementDto {
  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}