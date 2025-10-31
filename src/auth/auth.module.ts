import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './interface/strategies/jwt.strategy';
import { UserRepository, USERS_DB_SERVICE } from './infrastructure/user.repository';
import { DynamoDbService } from '../shared/infrastructure/database/dynamodb.service';
import { AppConfig } from '../shared/infrastructure/config/app.config';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig>) => ({
        secret: configService.get('jwt.secret', { infer: true }),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn', { infer: true }),
        },
      }),
    }),
  ],
  providers: [
    JwtStrategy,
    UserRepository,
    {
      provide: USERS_DB_SERVICE,
      useFactory: (configService: ConfigService<AppConfig>) => {
        const usersTableName = configService.get('aws.dynamodb.usersTableName', {
          infer: true,
        });
        return new DynamoDbService(configService, usersTableName);
      },
      inject: [ConfigService],
    },
  ],
  exports: [UserRepository],
})
export class AuthModule {}
