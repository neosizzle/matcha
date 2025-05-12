
import { toasts } from "../stores/globalStore.svelte";
import type { ToastType } from "../types/toast";
import type { User } from "../types/user";

export function showToast(message: string, type: ToastType) {
	const id = Date.now();
	const duration = 4000;
	toasts.update((currentToasts) => [
	  ...currentToasts,
	  { id, message, duration, type }
	]);
}

export function calculate_age_from_date(date: Date|null|undefined) {
	if (!date)
		return 69
	const today = new Date();
	let age = today.getFullYear() - date.getFullYear();
	const monthDiff = today.getMonth() - date.getMonth();
	const dayDiff = today.getDate() - date.getDate();

	if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
		age--;
	}

	return age;
}

type RawUser = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
  };
  
export function deserialize_user_object(user_obj: RawUser): User {
	return {
		...user_obj,
		birthday: new Date(user_obj.birthday),
		images: user_obj.images.split(",").filter((x: string) => x !== ""),
		tags: user_obj.tags.split(",").filter((x: string) => x !== "")
	} as User;
}

// takes a past unix timestamp
// if unix time stamp is invalid or null, return offline
// else, parse the timestamp and
// return an object like this:
// {'is_online': bool, 'last_online': {'num': number, 'unit': 'Minutes', 'Seconds', 'Days' ...}}
export function desc_unix_ts(unix_ts: string | null) {
	if (!unix_ts || isNaN(Number(unix_ts))) {
		return { is_online: false, last_online: {num: -1, unit: ""} };
	}
	
	const past = Number(unix_ts)
	const now = Date.now();
	const diffMs = now - past;

	if (diffMs < 0) {
		return { is_online: false, last_online: {num: -1, unit: ""} };
	}

	// Online if last seen within 60 seconds
	const is_online = diffMs < 60000;

	// Calculate time difference in human-readable format
	const seconds = Math.floor(diffMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	let num: number;
	let unit: string;

	if (days > 0) {
		num = days;
		unit = 'Days';
	} else if (hours > 0) {
		num = hours;
		unit = 'Hours';
	} else if (minutes > 0) {
		num = minutes;
		unit = 'Minutes';
	} else {
		num = seconds;
		unit = 'Seconds';
	}

	return {
		is_online,
		last_online: {
			num,
			unit
		}
	};
}