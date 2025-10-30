import { Module } from '@nestjs/common';
import { SharedInfrastructureModule } from './shared/infrastructure/shared-infrastructure.module';
import { CatalogModule } from './catalog/catalog.module';

@Module({
  imports: [SharedInfrastructureModule, CatalogModule],
  controllers: [],
  providers: [],
})
export class AppModule {}