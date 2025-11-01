import {
  IsString,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCatalogItemDto {
  @ApiProperty({
    example: 'Advanced Cardiac Life Support (ACLS) Certification',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'Comprehensive ACLS training course for healthcare professionals covering emergency cardiovascular care, including CPR techniques, drug administration, and team dynamics in critical care scenarios.',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({
    example: 'Medical Training',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: ['certification', 'emergency', 'cardiology', 'healthcare'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] = [];
}
