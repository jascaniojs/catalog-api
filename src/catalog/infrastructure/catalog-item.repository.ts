import {Injectable} from '@nestjs/common';
import {DynamoDbService} from '@/shared/infrastructure/database/dynamodb.service';
import {CatalogItem, CatalogItemStatus} from '../domain/catalog-item.entity';

interface CatalogItemDynamoRecord {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  EntityType: string;
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: CatalogItemStatus;
  qualityScore?: any;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CatalogItemRepository {
  constructor(private readonly dynamoDb: DynamoDbService) {}

  async save(item: CatalogItem): Promise<CatalogItem> {
    const record = this.toDynamoRecord(item);
    await this.dynamoDb.put(record);
    return item;
  }

  async findById(id: string): Promise<CatalogItem | null> {
    const record = await this.dynamoDb.get<CatalogItemDynamoRecord>({
      PK: `CATALOG#${id}`,
      SK: `ITEM#${id}`,
    });

    if (!record) {
      return null;
    }

    return this.fromDynamoRecord(record);
  }

  async findAll(): Promise<CatalogItem[]> {
    const records = await this.dynamoDb.scan<CatalogItemDynamoRecord>(
      '#entityType = :entityType',
      { ':entityType': 'CatalogItem' },
      { '#entityType': 'EntityType' },
    );

    return records.map((record) => this.fromDynamoRecord(record));
  }

  async findByStatus(status: CatalogItemStatus): Promise<CatalogItem[]> {
    const records = await this.dynamoDb.query<CatalogItemDynamoRecord>(
      'GSI1PK = :status',
      { ':status': `STATUS#${status}` },
      undefined,
      'StatusIndex',
    );

    return records.map((record) => this.fromDynamoRecord(record));
  }

  async existsByTitle(title: string, excludeId?: string): Promise<boolean> {
    const records = await this.dynamoDb.scan<CatalogItemDynamoRecord>(
      'title = :title',
      { ':title': title },
    );

    if (excludeId) {
      return records.some((record) => record.id !== excludeId);
    }

    return records.length > 0;
  }

  async update(item: CatalogItem): Promise<CatalogItem> {
    const record = this.toDynamoRecord(item);
    await this.dynamoDb.put(record);
    return item;
  }

  async delete(id: string): Promise<void> {
    await this.dynamoDb.delete({
      PK: `CATALOG#${id}`,
      SK: `ITEM#${id}`,
    });
  }

  private toDynamoRecord(item: CatalogItem): CatalogItemDynamoRecord {
    return {
      PK: `CATALOG#${item.id}`,
      SK: `ITEM#${item.id}`,
      GSI1PK: `STATUS#${item.status}`,
      GSI1SK: `SCORE#${item.qualityScore?.total.toString().padStart(3, '0') || '000'}#${item.createdAt.toISOString()}`,
      EntityType: 'CatalogItem',
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags,
      status: item.status,
      qualityScore: item.qualityScore,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private fromDynamoRecord(record: CatalogItemDynamoRecord): CatalogItem {
    return new CatalogItem({
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      tags: record.tags,
      status: record.status,
      qualityScore: record.qualityScore,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    });
  }
}
