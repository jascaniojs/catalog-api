import { Module } from '@nestjs/common';
import { CatalogController } from './interface/catalog.controller';
import { CatalogService } from './domain/catalog.service';
import { QualityScoreService } from './domain/quality-score.service';
import { CatalogItemRepository } from './infrastructure/catalog-item.repository';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, QualityScoreService, CatalogItemRepository],
  exports: [CatalogService, QualityScoreService, CatalogItemRepository],
})
export class CatalogModule {}
