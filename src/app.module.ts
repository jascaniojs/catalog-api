import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SharedInfrastructureModule } from './shared/infrastructure/shared-infrastructure.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { JwtAuthGuard } from './auth/interface/guards/jwt-auth.guard';
import { RolesGuard } from './auth/interface/guards/roles.guard';

@Module({
  imports: [
    SharedInfrastructureModule,
    AuthModule,
    CatalogModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}