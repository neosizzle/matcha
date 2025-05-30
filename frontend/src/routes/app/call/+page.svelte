<script lang="ts">
	import { io, Socket } from 'socket.io-client';
    import type { ClientToServerEvents, ServerToClientEvents } from '../../../types/ws';
    import { ws_client, user as glob_user, curr_in_call, curr_ringing, curr_rtc_data, curr_caller, curr_ice_data } from '../../../stores/globalStore.svelte';
    import { createRawSnippet, onMount } from 'svelte';
    import type { User } from '../../../types/user';
    import { connect_ws, deserialize_user_object, get_user_rest, showToast } from '../../../utils/globalFunctions.svelte';
    import { ToastType } from '../../../types/toast';
  

	const rtc_config: RTCConfiguration = {
	  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
	};

	let localVideo: HTMLVideoElement | null = $state(null);
	let remoteVideo: HTMLVideoElement | null = $state(null);
  
	let localStream: MediaStream | null = $state(null);
	let peerConnection: RTCPeerConnection | null = $state(null);

	let local_ws: Socket<ServerToClientEvents, ClientToServerEvents> | null = $state(null)
	ws_client.subscribe(e => local_ws = e)

	let local_user: User | null = $state(null); 
	glob_user.subscribe(e => {
		local_user = e
	})

	let user_to_call: string = $state("")
	let user_calling_from = $state.raw({
		'user_id': ""
	})

	let ice_bucket: any[] = $state.raw([])

	// const socket = io('http://localhost:3000');
  
	// socket.on('message', async (data: any) => {
	// 	if (data.offer) {
	// 	await createAnswer(data.offer);
	// 	} else if (data.answer) {
	// 	await peerConnection?.setRemoteDescription(new RTCSessionDescription(data.answer));
	// 	}
	// });

	$effect(() => {
		if ($curr_ice_data == null)
			return
		// console.log("adding ice", peerConnection == null)
		// peerConnection?.addIceCandidate($curr_ice_data)
		console.log("adding ice to bucket")
		ice_bucket.push($curr_ice_data)
	})

	$effect(() => {
		if (!$curr_rtc_data)
			return
	
		console.log("new rtc_data ", $curr_rtc_data['rtc'])

		if ($curr_rtc_data['rtc'].type == "offer")
		{
			// someone calling us, do nth for now, wait for user to accept
			user_calling_from['user_id'] = $curr_rtc_data['user'].id
			console.log("someone calling us, " + user_calling_from)
		}
		else {
			console.log("someone accepted our call")
			
			peerConnection!.setRemoteDescription(new RTCSessionDescription($curr_rtc_data['rtc']))
			curr_in_call.set(true)
			curr_ringing.set(false)
		}
	})



	async function createOffer(): Promise<void> {
		if (!local_ws || !local_user || !localStream)
			return showToast("Local user or ws missing " + !local_ws + !local_user + !localStream, ToastType.ERROR)
		
		peerConnection = new RTCPeerConnection(rtc_config)
		localStream.getTracks().forEach(track => {
			peerConnection?.addTrack(track, localStream!);
		});
		peerConnection.ontrack = (event: RTCTrackEvent) => {			
			console.log("adding id ", event.streams)
			if (remoteVideo)
			{
				// remoteVideo = {
				// 	...remoteVideo,
				// 	srcObject: event.streams[0]
				// }
				remoteVideo.srcObject = event.streams[0];

			}
		};
		peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			console.log("emmiting ice")
			if (event.candidate) {
				local_ws?.emitWithAck('emit_ice', JSON.stringify({
					'user_id': user_to_call,
					'data': event.candidate
				}));
			}
		};

		

		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);
		const res = await local_ws.emitWithAck('emit_call', JSON.stringify({user_id: user_to_call, data: offer}))
		let err_msg = res['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		curr_caller.set(true)
		curr_ringing.set(true)
	}
  
	async function createAnswer(): Promise<void> {
		if (!local_ws || !local_user || !localStream)
			return showToast("Local user or ws missing", ToastType.ERROR)

		peerConnection = new RTCPeerConnection(rtc_config)
		localStream.getTracks().forEach(track => {
			peerConnection?.addTrack(track, localStream!);
		});
		peerConnection.ontrack = (event: RTCTrackEvent) => {			
			if (remoteVideo)
			{
				console.log("adding id ", event.streams)
				// remoteVideo = {
				// 	...remoteVideo,
				// 	srcObject: event.streams[0]
				// }
				remoteVideo.srcObject = event.streams[0];

			}
		};

		const offer = $curr_rtc_data['rtc']
		const user = $curr_rtc_data['user']
		await peerConnection.setRemoteDescription(new RTCSessionDescription(offer)); // assume that no changes in the store from ring to accept
		const answer = await peerConnection.createAnswer();
		await peerConnection.setLocalDescription(answer);
		
		// add ice from bucket
		ice_bucket.forEach(async ice => {
			await peerConnection!.addIceCandidate(ice)
		});
		
		const res = await local_ws.emitWithAck('emit_answer', JSON.stringify({user_id: user.id, data: answer}))
		let err_msg = res['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		curr_in_call.set(true)
		curr_ringing.set(false)
	}

	async function rejectCancelCall(): Promise<void> {
		if (!local_ws || !local_user)
			return showToast("Local user or ws missing", ToastType.ERROR)
		const user = $curr_rtc_data['user']
		const offer = $curr_rtc_data['rtc']

		await local_ws.emitWithAck('emit_reject', JSON.stringify({user_id: user.id, data: offer}))
		curr_in_call.set(false)
		curr_ringing.set(false)
		curr_rtc_data.set(null)
	}

	async function init_rtc_peer() {
		let localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  
		if (localVideo) localVideo.srcObject = localStream;

		let peerConnection = new RTCPeerConnection(rtc_config);

		peerConnection.ontrack = (event: RTCTrackEvent) => {			
			if (remoteVideo)
			{
				console.log("adding id ", event.streams)
				// remoteVideo = {
				// 	...remoteVideo,
				// 	srcObject: event.streams[0]
				// }
				remoteVideo.srcObject = event.streams[0];

			}
		};

		peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			console.log("emmiting ice")
			if (event.candidate) {
				let user_id_ice = ""
				if (user_to_call.length > 0)
					user_id_ice = user_to_call
				else
					user_id_ice = user_calling_from['user_id']
				local_ws?.emitWithAck('emit_ice', JSON.stringify({
					'user_id': user_id_ice,
					'data': event.candidate
				}));
			}
		};

		localStream.getTracks().forEach(track => {
			peerConnection?.addTrack(track, localStream);
		});

		return {
			'stream': localStream,
			'peer': peerConnection
		}
	}

	async function leaveCall() {
		
	}

	onMount(async () => {
		// // init stream and peer
		// let stream_peer = await init_rtc_peer()
		// localStream = stream_peer.stream
		// peerConnection = stream_peer.peer

		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  
		if (localVideo) localVideo.srcObject = localStream;

		// get user 
		let me_des = await get_user_rest()
		if (!me_des)
			return window.location.href = "/"

		// set global store if OK and store is empty (refresh)
		if (!local_user)
			glob_user.update(() => me_des)
	})


	// $effect(() => {
	// 	console.log(remoteVideo?.srcObject)
	// })
  </script>
  
  <style>
	video {
	  width: 300px;
	  margin: 10px;
	}
  </style>
  
<div>
	<h1>Video Call (Socket.IO + Svelte)</h1>
	<!-- <button onclick={start}>Start</button> -->
	<!-- <button onclick={createOffer}>Call</button> -->
	
	<div>
		in call {$curr_in_call}, ringing {$curr_ringing}, caller? {$curr_caller}
	</div>

	<div>
		<button class="btn" onclick={createOffer}>Init call</button>
		<button class="btn" onclick={createAnswer}>Accept call</button>
		<button class="btn" onclick={rejectCancelCall}>reject call</button>

	</div>

	<div>
		<input bind:value={user_to_call} placeholder="userid to call.."/>
	</div>

	<div>
		<p>localVideo {localVideo? (localVideo.srcObject? "SRC yes" : "SRC no") : "no"}</p>
	  <video bind:this={localVideo} autoplay playsinline muted></video>
	</div>
	
	<div>
		<p>remote video {remoteVideo? (remoteVideo.srcObject? "SRC yes" : "SRC no") : "no"}</p>
		<video bind:this={remoteVideo} autoplay playsinline muted></video>
	</div>
</div>