import { writable } from 'svelte/store';
import type { ToastElement } from '../types/toast';
import type { User } from '../types/user';
import { Socket } from 'socket.io-client';
import type { ClientToServerEvents, NotificationObj, ServerToClientEvents } from '../types/ws';

export const toasts = writable<ToastElement[]>([]);
export const user = writable<User | null>(null);
export const ws_client = writable<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
export const notification_pool = writable<NotificationObj[]>([]);

// video call
export const rtc_peer = writable<RTCPeerConnection | null>(null);
export const curr_in_call = writable<boolean>(false);
export const curr_ringing = writable<boolean>(false);
export const curr_caller = writable<boolean>(false);
export const curr_rtc_data = writable<any>(null);
export const curr_ice_data = writable<any>(null)