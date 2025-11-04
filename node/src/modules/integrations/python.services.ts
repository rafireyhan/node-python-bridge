import { Injectable, Logger } from '@nestjs/common';
import WebSocket from 'ws';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PythonService {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(PythonService.name);

  private get pythonUrl(): string {
    return this.configService.get<string>('PYTHON_WS_URL') || 'ws://localhost:8000/ws';
  }

  createSocket(): WebSocket {
    return new WebSocket(this.pythonUrl);
  }

  safeClose(socket?: WebSocket) {
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    } catch (error) {
      this.logger.error('Error closing python socket', error as Error);
    }
  }
}
