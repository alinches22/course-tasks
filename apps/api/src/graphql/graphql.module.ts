import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ConfigService } from '../config/config.service';
import { PubSubProvider } from './pubsub.provider';
import { DateScalar } from './scalars/date.scalar';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [
    AuthModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [AuthModule],
      inject: [ConfigService, AuthService],
      useFactory: (configService: ConfigService, authService: AuthService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        playground: configService.isDevelopment,
        introspection: true,
        context: ({ req, res, connection }: { req: unknown; res: unknown; connection?: { context: unknown } }) => {
          if (connection) {
            // WebSocket connection
            return { req: connection.context, res };
          }
          return { req, res };
        },
        subscriptions: {
          'graphql-ws': {
            path: '/graphql',
            onConnect: async (context: { connectionParams?: Record<string, unknown> }) => {
              const { connectionParams } = context;
              
              // Support dev user via connectionParams (for testing)
              const devUser = connectionParams?.['x-dev-user'] as string;
              if (devUser) {
                return {
                  user: {
                    userId: devUser,
                    address: `0x${devUser.padStart(40, '0')}`,
                  },
                };
              }
              
              const authorization =
                (connectionParams?.authorization as string) || (connectionParams?.Authorization as string);

              if (!authorization) {
                return { user: null };
              }

              try {
                const token = authorization.replace('Bearer ', '');
                const user = await authService.validateToken(token);
                return { user };
              } catch {
                return { user: null };
              }
            },
            onDisconnect: () => {
              console.log('Client disconnected from WebSocket');
            },
          },
          'subscriptions-transport-ws': false,
        },
        cors: {
          origin: configService.corsOrigins,
          credentials: true,
        },
      }),
    }),
  ],
  providers: [PubSubProvider, DateScalar],
  exports: [PubSubProvider],
})
export class GraphqlModule {}
