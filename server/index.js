/**
 * CloudTwin 数据服务 - WebSocket Server
 * 提供设备数据推送、告警通知等功能
 * 
 * 使用方式:
 *   开发: npm run dev
 *   生产: npm start
 */
import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 4000;

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', ts: Date.now() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// ===== 模拟设备数据 (替换为实际数据源: MQTT, OPC-UA, REST API 等) =====
const DEVICES = ['pump-01', 'valve-02', 'motor-03', 'sensor-04', 'tank-05'];

function randomBetween(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateDeviceData() {
  const updates = {};
  for (const id of DEVICES) {
    const temperature = randomBetween(20, 95);
    const pressure = randomBetween(0.5, 4.5);
    const rpm = randomBetween(800, 3600);
    const status = temperature > 90 ? 'critical' : temperature > 85 ? 'warning' : 'normal';
    updates[id] = { temperature, pressure, rpm, status };
  }
  return updates;
}

// ===== Socket连接处理 =====
io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  // 发送初始数据
  socket.emit('device:batch', generateDeviceData());

  // 客户端请求设备数据
  socket.on('device:query', (deviceId) => {
    const data = generateDeviceData();
    if (data[deviceId]) {
      socket.emit('device:update', { deviceId, data: data[deviceId] });
    }
  });

  // 客户端发送控制指令
  socket.on('device:command', ({ deviceId, command }) => {
    console.log(`[CMD] ${deviceId}: ${JSON.stringify(command)}`);
    // TODO: 转发指令到实际设备 (MQTT publish, OPC-UA write, etc.)
    socket.emit('device:command:ack', { deviceId, command, status: 'ok' });
  });

  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
  });
});

// 定时推送设备数据 (2秒间隔)
setInterval(() => {
  const data = generateDeviceData();
  io.emit('device:batch', data);

  // 模拟随机告警
  for (const [id, d] of Object.entries(data)) {
    if (d.temperature > 88) {
      io.emit('alert', {
        deviceId: id,
        level: d.temperature > 90 ? 'critical' : 'warning',
        message: `${id} 温度异常: ${d.temperature}°C`,
      });
    }
  }
}, 2000);

httpServer.listen(PORT, () => {
  console.log(`🚀 CloudTwin data server running on port ${PORT}`);
});
