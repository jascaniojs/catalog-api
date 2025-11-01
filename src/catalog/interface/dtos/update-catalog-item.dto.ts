import {
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateCatalogItemDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @IsOptional()
  description?: string;


  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
