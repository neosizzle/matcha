import { writable } from 'svelte/store';
import type { ToastElement } from '../types/toast';

export const toasts = writable<ToastElement[]>([]);
