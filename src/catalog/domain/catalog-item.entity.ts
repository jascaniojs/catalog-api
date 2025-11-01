import { v4 as uuidv4 } from 'uuid';

export enum CatalogItemStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface QualityScore {
  total: number;
  breakdown: {
    base: number;
    titleLength: number;
    descriptionLength: number;
    categoryProvided: number;
    tagsProvided: number;
    uniqueTitle: number;
  };
}

export class CatalogItem {
  public id: string;
  public title: string;
  public description: string;
  public category: string;
  public tags: string[];
  public status: CatalogItemStatus;
  public qualityScore?: QualityScore;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(data: Partial<CatalogItem> = {}) {
    this.id = data.id || uuidv4();
    this.title = data.title || '';
    this.description = data.description || '';
    this.category = data.category || '';
    this.tags = data.tags || [];
    this.status = data.status || CatalogItemStatus.DRAFT;
    this.qualityScore = data.qualityScore;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  updateContent(
    title: string,
    description: string,
    category: string,
    tags: string[],
  ): void {
    this.title = title;
    this.description = description;
    this.category = category;
    this.tags = tags;
    this.updatedAt = new Date();
  }

  setQualityScore(score: QualityScore): void {
    this.qualityScore = score;
    this.updatedAt = new Date();
  }

  canBeApproved(): boolean {
    return this.qualityScore ? this.qualityScore.total >= 70 : false;
  }

  markAsApproved(): void {
    this.status = CatalogItemStatus.APPROVED;
    this.updatedAt = new Date();
  }

  markAsRejected(): void {
    this.status = CatalogItemStatus.REJECTED;
    this.updatedAt = new Date();
  }
}
