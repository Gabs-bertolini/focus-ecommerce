import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @IsInt()
  stock!: number;

  @IsString()
  image!: string;
}
