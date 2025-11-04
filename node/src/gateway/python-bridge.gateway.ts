import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';
import WebSocket from 'ws';

@WebSocketGateway({ path: '/ws' })
export class PythonBridgeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(PythonBridgeGateway.name);
  private readonly pythonUrl = process.env.PYTHON_WS_URL || 'ws://localhost:8000/ws';

  private clientMap = new Map<WebSocket, WebSocket>();

  handleConnection(client: WebSocket) {
    this.logger.log('Client connected');

    let pythonSocket = this.clientMap.get(client);

    const cleanupPython = () => {
      const py = this.clientMap.get(client) || pythonSocket;
      if (py && py.readyState === WebSocket.OPEN) {
        try {
          py.close();
        } catch (error) {
          this.logger.error('Error closing python socket', error);
        }
      }
      this.clientMap.delete(client);
      pythonSocket = undefined;
    };

    client.on('message', (msg: Buffer) => {
      try {
        const payload = JSON.parse(msg.toString());
        const text: string = payload?.text ?? '';

        const existing = this.clientMap.get(client);
        const isOpen = !!existing && existing.readyState === WebSocket.OPEN;

        if (!isOpen) {
          pythonSocket = new WebSocket(this.pythonUrl);
          this.clientMap.set(client, pythonSocket);

          pythonSocket.on('open', () => {
            pythonSocket?.send(JSON.stringify({ text }));
          });

          pythonSocket.on('message', (message: Buffer) => {
            client.send(message.toString());
          });

          pythonSocket.on('close', () => {
            client.send(JSON.stringify({ type: 'info', message: 'python socket closed' }));
            cleanupPython();
          });

          pythonSocket.on('error', (err: Error) => {
            this.logger.error('Python socket error', err);
            client.send(JSON.stringify({ type: 'error', message: 'python socket error' }));
          });
        } else {
          existing!.send(JSON.stringify({ text }));
        }
      } catch {
        client.send(JSON.stringify({ type: 'error', message: 'invalid payload' }));
      }
    });

    client.on('close', () => {
      this.logger.log('Client disconnected');
      cleanupPython();
    });

    client.on('error', (err: Error) => {
      this.logger.error('Client error', err);
    });
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log('Client disconnected');
    const py: WebSocket = this.clientMap.get(client);
    if (py instanceof WebSocket && py.readyState === WebSocket.OPEN) {
      try {
        py.close();
      } catch (error) {
        this.logger.error('Error closing python socket', error);
      }
    }
    this.clientMap.delete(client);
  }
}
