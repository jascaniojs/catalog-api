import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { DynamoDbService } from './database/dynamodb.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [DynamoDbService],
  exports: [ConfigModule, DynamoDbService],
})
export class SharedInfrastructureModule {}
