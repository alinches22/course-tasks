import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { UserModule } from '../user/user.module';
import { PointsModule } from '../points/points.module';

// Provider for dev mode detection (used by JwtAuthGuard)
const IsDevModeProvider = {
  provide: 'IS_DEV_MODE',
  useFactory: (config: ConfigService) => config.isDevelopment,
  inject: [ConfigService],
};

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: {
          expiresIn: configService.jwtExpiresIn,
        },
      }),
    }),
    forwardRef(() => UserModule),
    PointsModule,
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, JwtAuthGuard, IsDevModeProvider],
  exports: [AuthService, JwtModule, JwtAuthGuard, IsDevModeProvider],
})
export class AuthModule {}
