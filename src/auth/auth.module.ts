import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './interface/strategies/jwt.strategy';
import { UserRepository } from './infrastructure/user.repository';
import { UsersDbService } from './infrastructure/users-db.service';
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
  providers: [JwtStrategy, UserRepository, UsersDbService],
  exports: [UserRepository],
})
export class AuthModule {}
