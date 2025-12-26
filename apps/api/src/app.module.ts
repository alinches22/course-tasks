import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { GraphqlModule } from './graphql/graphql.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ScenarioModule } from './scenario/scenario.module';
import { BattleModule } from './battle/battle.module';
import { ActionModule } from './action/action.module';
import { PointsModule } from './points/points.module';
import { ReplayModule } from './replay/replay.module';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.throttleTtl * 1000,
            limit: config.throttleLimit,
          },
        ],
      }),
    }),

    // Infrastructure
    PrismaModule,
    RedisModule,
    GraphqlModule,

    // Domain Modules
    AuthModule,
    UserModule,
    ScenarioModule,
    BattleModule,
    ActionModule,
    PointsModule,
    ReplayModule,
  ],
})
export class AppModule {}
