import {
  CatalogItem,
  CatalogItemStatus,
  QualityScore,
} from '../../domain/catalog-item.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogItemResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    example: 'Advanced Cardiac Life Support (ACLS) Certification',
  })
  title: string;

  @ApiProperty({
    example: 'Comprehensive ACLS training course for healthcare professionals covering emergency cardiovascular care, including CPR techniques, drug administration, and team dynamics in critical care scenarios.',
  })
  description: string;

  @ApiProperty({
    example: 'Medical Training',
  })
  category: string;

  @ApiProperty({
    example: ['certification', 'emergency', 'cardiology', 'healthcare'],
  })
  tags: string[];

  @ApiProperty({
    enum: CatalogItemStatus,
    example: CatalogItemStatus.APPROVED,
  })
  status: CatalogItemStatus;

  @ApiPropertyOptional({
    example: {
      total: 85,
      breakdown: {
        base: 40,
        titleLength: 20,
        descriptionLength: 15,
        categoryProvided: 10,
        tagsProvided: 10,
        uniqueTitle: 5,
      },
    },
  })
  qualityScore?: QualityScore;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-15T14:45:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(item: CatalogItem): CatalogItemResponseDto {
    const dto = new CatalogItemResponseDto();
    dto.id = item.id;
    dto.title = item.title;
    dto.description = item.description;
    dto.category = item.category;
    dto.tags = item.tags;
    dto.status = item.status;
    dto.qualityScore = item.qualityScore;
    dto.createdAt = item.createdAt;
    dto.updatedAt = item.updatedAt;
    return dto;
  }
}
