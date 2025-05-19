import { writable } from 'svelte/store';
import type { ToastElement } from '../types/toast';
import type { User } from '../types/user';
import { Socket } from 'socket.io-client';
import type { ClientToServerEvents, NotificationObj, ServerToClientEvents } from '../types/ws';

export const toasts = writable<ToastElement[]>([]);
export const user = writable<User | null>(null);
export const ws_client = writable<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
export const notification_pool = writable<NotificationObj[]>([]);