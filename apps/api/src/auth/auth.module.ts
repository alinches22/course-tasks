import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
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
  ],
  providers: [AuthService, AuthResolver, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
