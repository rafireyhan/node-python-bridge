export interface TextPayload {
  text: string;
}

export interface InfoMessage {
  type: 'info';
  message: string;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type ClientMessage = InfoMessage | ErrorMessage;

export function createTextPayload(text: string): string {
  return JSON.stringify({ text });
}

export function createInfoMessage(message: string): string {
  return JSON.stringify({ type: 'info', message });
}

export function createErrorMessage(message: string): string {
  return JSON.stringify({ type: 'error', message });
}

export function parseBufferToObject(msg: Buffer): unknown {
  return JSON.parse(msg.toString());
}
