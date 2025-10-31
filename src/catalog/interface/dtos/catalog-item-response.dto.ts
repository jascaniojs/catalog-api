import {
  CatalogItem,
  CatalogItemStatus,
  QualityScore,
} from '../../domain/catalog-item.entity';

export class CatalogItemResponseDto {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: CatalogItemStatus;
  qualityScore?: QualityScore;
  createdAt: Date;
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
