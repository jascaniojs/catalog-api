import {
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCatalogItemDto {
  @ApiPropertyOptional({
    example: 'Basic Life Support (BLS) for Healthcare Providers',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Essential BLS training for healthcare professionals including high-quality CPR, AED use, and relief of choking in adults, children, and infants.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'Medical Training',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: ['certification', 'cpr', 'emergency', 'healthcare'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
