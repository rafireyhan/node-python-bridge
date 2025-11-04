from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json

app = FastAPI()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print ("WebSocket connection accepted")
    try:
        initial = await websocket.receive_text()
        data = json.loads(initial)
        text = data.get("text", "")

        if not isinstance(text, str):
            raise ValueError("Invalid input type. Please provide a string.")
            return

        total_steps = 5
        for i in range(total_steps):
            await asyncio.sleep(1)
            await websocket.send_json({
                "type": "progress",
                "step": i + 1,
                "total": total_steps,
                "message": f"Analyzing... step {i + 1}/{total_steps}"
            })
            print(f"Progress {i+1}/{total_steps} for text: {text}")

        result = text.upper()
        await websocket.send_json({"type": "final", "result": result})

        await websocket.close()
    except WebSocketDisconnect:
        print("WebSocket connection closed")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
        print(f"Error: {e}")