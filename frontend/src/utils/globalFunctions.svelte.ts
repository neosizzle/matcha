
import { notification_pool, toasts } from "../stores/globalStore.svelte";
import type { Location } from "../types/location";
import { ToastType } from "../types/toast";
import type { User } from "../types/user";
import io from "socket.io-client"; // Import Socket.IO client
import type { NotificationObj } from "../types/ws";

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

export function connect_ws() {
	const ws_conn_options = {
		withCredentials: true
	}
	const socket = io("http://localhost:3000", ws_conn_options);

	socket.on('notify_like', (msg) => {
		const not_obj = {...msg, time: Date.now(), type: 'notify_like'} as NotificationObj
		notification_pool.update(a => [...a, not_obj]) 
		
		// show toast here
		const not_msg = deserialize_user_object(JSON.parse(JSON.stringify(not_obj.data)));
		showToast(`${not_msg.displayname} has liked you`, ToastType.HAPPY)
	})

	socket.on('notify_match', (msg) => {
		const not_obj = {...msg, time: Date.now(), type: 'notify_match'} as NotificationObj
		notification_pool.update(a => [...a, not_obj]) 
		
		// show toast here
		const not_msg = deserialize_user_object(JSON.parse(JSON.stringify(not_obj.data)));
		showToast(`${not_msg.displayname} has matched you`, ToastType.HAPPY)
	})

	socket.on('notify_unlike', (msg) => {
		const not_obj = {...msg, time: Date.now(), type: 'notify_unlike'} as NotificationObj
		notification_pool.update(a => [...a, not_obj]) 
		
		// show toast here
		const not_msg = deserialize_user_object(JSON.parse(JSON.stringify(not_obj.data)));
		showToast(`${not_msg.displayname} has unliked you`, ToastType.HAPPY)
	})

	socket.on('notify_chat', (msg) => {
		const not_obj = {...msg, time: Date.now(), type: 'notify_chat'} as NotificationObj
		notification_pool.update(a => [...a, not_obj]) 
		
		// show toast here
		const not_msg = deserialize_user_object(JSON.parse(JSON.stringify(not_obj.data)));
		showToast(`${not_msg.displayname} has messaged you`, ToastType.HAPPY)
	})

	socket.on('notify_view', (msg) => {
		const not_obj = {...msg, time: Date.now(), type: 'notify_view'} as NotificationObj
		notification_pool.update(a => [...a, not_obj]) 
		
		// show toast here
		const not_msg = deserialize_user_object(JSON.parse(JSON.stringify(not_obj.data)));
		showToast(`${not_msg.displayname} has viewed you`, ToastType.HAPPY)
	})

	socket.on('notify_ping', () => {
		socket.emit('emit_pong')
	})

	socket.on("message", (msg) => {
		console.log('message: ' + msg)
	});

	return socket
}

export async function get_user_rest() {
	const payload = {
		method: 'GET',
		credentials: "include" as RequestCredentials,
	}
	let response = await fetch("http://localhost:3000/users/me", payload);
	if (response.status == 401)
		return null

	
	// I dont like this, too many things can go wrong.. oh well womp womp
	const user_data = await response.json();
	let user_obj = user_data['data']
	let user_des: User = deserialize_user_object(user_obj)

	return user_des
}

export async function update_user_loction_auto(location: Location, user_des: User) {
	const payload2 = {
		method: 'PUT',
		credentials: "include" as RequestCredentials,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			images: user_des.images.join(","),
			tags: user_des.tags.join(","),
			sexuality: user_des.sexuality,
			displayname: user_des.displayname,
			bio: user_des.bio,
			enable_auto_location: user_des.enable_auto_location,
			gender: user_des.gender,
			email: user_des.email,
			location_manual: user_des.location_manual,
			location_manual_lat: user_des.location_manual_lat,
			location_manual_lon: user_des.location_manual_lon,
			location_auto_lat: location.latitude,
			location_auto_lon: location.longitude,
			birthday: user_des.birthday.toISOString().split('T')[0]
		}),
	}

	let fetch_res = await fetch('http://localhost:3000/users/me', payload2)
	let data = await fetch_res.json()
	let err_msg = data['detail']
	if (err_msg)
		return [undefined, err_msg]
	let user_obj = data['data']
	user_des = deserialize_user_object(user_obj)
	return [user_des, undefined]
}

// get pending notifications but dont consume them
export async function peek_not_w_filter(filter?: string) {
	let res = []

	const payload = {
		method: 'GET',
		credentials: "include" as RequestCredentials,
	}
	let response = await fetch(`http://localhost:3000/users/pending_notifications_peek${filter? `?filter=${filter}` : ''}`, payload);
	let data = await response.json()
	if (data['detail'])
		throw new Error(data['detail']);
	for (let i = 0; i < data['data'].length; i++) {
		const noti_ser = data['data'][i];
		const noti_deser = {...noti_ser, time: Date.now()} as NotificationObj
		
		// dont show toast here, as it is not needed
		res.push(noti_deser)
	}
	return res
}