import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.corsOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = configService.port;
  const host = configService.host;

  await app.listen(port, host);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    TradeVersus API                        ║
╠═══════════════════════════════════════════════════════════╣
║  GraphQL Playground: http://${host}:${port}/graphql
║  WebSocket:          ws://${host}:${port}/graphql
╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
