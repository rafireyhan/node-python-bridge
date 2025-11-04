import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const HTTP_PORT = 3000;
const PYTHON_WS = "ws://localhost:8000/ws";

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (wsClient) => {
  console.log("Node Server: client connected");
  let pythonSocket = null;

  wsClient.on("message", async (msg) => {
    try {
      const payload = JSON.parse(msg.toString());
      const text = payload.text || "";

      pythonSocket = new WebSocket(PYTHON_WS);

      pythonSocket.on("open", () => {
        pythonSocket.send(JSON.stringify({ text }));
      });

      pythonSocket.on("message", (message) => {
        wsClient.send(message.toString());
      });

      pythonSocket.on("close", () => {
        wsClient.send(
          JSON.stringify({ type: "info", message: "python socked closed" })
        );
      });

      pythonSocket.on("error", (err) => {
        console.error("Node Server: python socket error", err);
        wsClient.send(
          JSON.stringify({ type: "error", message: "python socket error" })
        );
      });
    } catch (error) {
      wsClient.send(
        JSON.stringify({ type: "error", message: "invalid payload" })
      );
    }
  });

  wsClient.on("close", () => {
    console.log("Node Server: client disconnected");
    if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN) {
      pythonSocket.close();
    }
  });

  wsClient.on("error", (err) => {
    console.error("Node Server: client error", err);
  });
});

server.listen(HTTP_PORT, () =>
  console.log(`Server listening on port ${HTTP_PORT}`)
);
