import websocket
import threading
import json
import dotenv
import os

dotenv.load_dotenv()

NODE_WS = os.getenv('NODE_WS_URL') or 'ws://localhost:3000/ws'

def on_message(ws, message):
    try:
        data = json.loads(message)
        t = data.get('type')
        if t == 'progress':
            print(f"[Progress] {data.get('message')} ({data.get('step')}/{data.get('total')}))")
        elif t == 'final':
            print(f"[Final] {data.get('result')}")
        else:
            print('[MSG]', data)
    except Exception:
        print('[RAW]', message)

def on_error(ws, error):
    print(f"[Error] {error}")

def on_close(ws, close_status_code, close_msg):
    print('Connection Closed')

def on_open(ws):
    def run():
        text = input('Enter text to analyze: ')
        ws.send(json.dumps({'text': text}))
    threading.Thread(target=run).start()

if __name__ == '__main__':
    websocket.enableTrace(False)
    ws = websocket.WebSocketApp(NODE_WS,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever()