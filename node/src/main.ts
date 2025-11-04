import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(process.env.PORT ?? 3000);
  console.log(`NestJS server listening on port ${process.env.PORT ?? 3000}`);
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed', err);
});
