import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CatalogItem, CatalogItemStatus } from './catalog-item.entity';
import { QualityScoreService } from './quality-score.service';
import { CatalogItemRepository } from '../infrastructure/catalog-item.repository';

@Injectable()
export class CatalogService {
  constructor(
    private readonly repository: CatalogItemRepository,
    private readonly qualityScoreService: QualityScoreService,
  ) {}

  async createItem(data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  }): Promise<CatalogItem> {
    // Check for duplicate title
    const titleExists = await this.repository.existsByTitle(data.title);

    // Calculate quality score
    const qualityScore = this.qualityScoreService.calculateScore(
      data.title,
      data.description,
      data.category,
      data.tags,
      !titleExists,
    );

    // Create catalog item
    const item = new CatalogItem(data);
    item.setQualityScore(qualityScore);

    // Save to DynamoDB
    return await this.repository.save(item);
  }

  async getItemById(id: string): Promise<CatalogItem> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException(`Catalog item with ID ${id} not found`);
    }
    return item;
  }

  async getAllItems(): Promise<CatalogItem[]> {
    return await this.repository.findAll();
  }

  async getItemsByStatus(status: CatalogItemStatus): Promise<CatalogItem[]> {
    return await this.repository.findByStatus(status);
  }

  async updateItem(id: string, data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  }): Promise<CatalogItem> {
    const item = await this.getItemById(id);

    // Check for duplicate title (excluding current item)
    const titleExists = await this.repository.existsByTitle(data.title, id);

    // Update content
    item.updateContent(data.title, data.description, data.category, data.tags);

    // Recalculate quality score
    const qualityScore = this.qualityScoreService.calculateScore(
      data.title,
      data.description,
      data.category,
      data.tags,
      !titleExists,
    );

    item.setQualityScore(qualityScore);

    return await this.repository.update(item);
  }

  async deleteItem(id: string): Promise<void> {
    await this.getItemById(id); // Check if exists
    await this.repository.delete(id);
  }

  async approveItem(id: string): Promise<CatalogItem> {
    const item = await this.getItemById(id);
    item.markAsApproved();
    return await this.repository.update(item);
  }

  async rejectItem(id: string): Promise<CatalogItem> {
    const item = await this.getItemById(id);
    item.markAsRejected();
    return await this.repository.update(item);
  }
}