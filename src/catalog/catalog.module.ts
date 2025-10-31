import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogController } from './interface/catalog.controller';
import { CatalogService } from './domain/catalog.service';
import { QualityScoreService } from './domain/quality-score.service';
import { CatalogItemRepository } from './infrastructure/catalog-item.repository';
import { DynamoDbService } from '../shared/infrastructure/database/dynamodb.service';
import { AppConfig } from '../shared/infrastructure/config/app.config';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogService,
    QualityScoreService,
    CatalogItemRepository,
    {
      provide: DynamoDbService,
      useFactory: (configService: ConfigService<AppConfig>) => {
        const tableName = configService.get('aws.dynamodb.tableName', {
          infer: true,
        });
        return new DynamoDbService(configService, tableName);
      },
      inject: [ConfigService],
    },
  ],
  exports: [CatalogService, QualityScoreService, CatalogItemRepository],
})
export class CatalogModule {}
