import { writable } from 'svelte/store';
import type { ToastElement } from '../types/toast';
import type { User } from '../types/user';

export const toasts = writable<ToastElement[]>([]);
export const user = writable<User | null>(null);