import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebsocketGateway } from './modules/websocket/websocket.gateway';
import { PythonService } from './modules/integrations/python.services';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway, PythonService],
})
export class AppModule {}
