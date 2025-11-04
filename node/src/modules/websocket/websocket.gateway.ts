import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';
import WebSocket from 'ws';
import { PythonService } from '../integrations/python.services';
import {
  createTextPayload,
  createInfoMessage,
  createErrorMessage,
  parseBufferToObject,
  TextPayload,
} from '../../common/helpers/message';

@WebSocketGateway({ path: '/ws' })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private clientMap = new Map<WebSocket, WebSocket>();

  constructor(private readonly pythonService: PythonService) {}

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
        const payload = parseBufferToObject(msg) as Partial<TextPayload>;
        const text: string = payload?.text ?? '';

        const existing = this.clientMap.get(client);
        const isOpen = !!existing && existing.readyState === WebSocket.OPEN;

        if (!isOpen) {
          pythonSocket = this.pythonService.createSocket();
          this.clientMap.set(client, pythonSocket);

          pythonSocket.on('open', () => {
            pythonSocket?.send(createTextPayload(text));
          });

          pythonSocket.on('message', (message: Buffer) => {
            client.send(message.toString());
          });

          pythonSocket.on('close', () => {
            client.send(createInfoMessage('python socket closed'));
            cleanupPython();
          });

          pythonSocket.on('error', (err: Error) => {
            this.logger.error('Python socket error', err);
            client.send(createErrorMessage('python socket error'));
          });
        } else {
          existing!.send(createTextPayload(text));
        }
      } catch {
        client.send(createErrorMessage('invalid payload'));
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
