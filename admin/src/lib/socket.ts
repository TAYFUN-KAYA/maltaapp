import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_URL.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export async function getAdminSocket(): Promise<Socket> {
  const token = localStorage.getItem('admin_token');
  if (!token) throw new Error('Auth required');

  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  return new Promise((resolve, reject) => {
    socket!.on('connect', () => resolve(socket!));
    socket!.on('connect_error', (e) => reject(e));
  });
}

export function disconnectAdminSocket() {
  socket?.disconnect();
  socket = null;
}
