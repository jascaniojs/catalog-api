import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfigAsync } from './config/app.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfigAsync],
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [],
  exports: [ConfigModule],
})
export class SharedInfrastructureModule {}
