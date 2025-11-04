import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PythonBridgeGateway } from './gateway/python-bridge.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PythonBridgeGateway],
})
export class AppModule {}
