<script lang="ts">
    import { onMount } from "svelte";
    import { curr_call_remote_user, curr_ice_data, curr_in_call, curr_is_caller, curr_ringing, curr_rtc_data, notification_pool, ws_client } from "../../stores/globalStore.svelte";
    import { ToastType } from "../../types/toast";
    import { connect_ws, deserialize_user_object, not_w_filter, showToast } from "../../utils/globalFunctions.svelte";
    import type { ClientToServerEvents, NotificationObj, ServerToClientEvents } from "../../types/ws";
    import type { Socket } from "socket.io-client";

	let { children } = $props();

	let localVideo: HTMLVideoElement | null = $state(null);
	let remoteVideo: HTMLVideoElement | null = $state(null);
	let peerConnection: RTCPeerConnection | null = $state(null);


	let local_noti_pool: NotificationObj[] = $state([]);
	notification_pool.subscribe(e => local_noti_pool = e)

	let local_ws: Socket<ServerToClientEvents, ClientToServerEvents> | null = $state(null)
	ws_client.subscribe(e => local_ws = e)

	let matches_noti_num = $derived.by(() => {
		let res = local_noti_pool.filter(e => e.type == "notify_chat" || e.type == "notify_match")
		return res.length
	})

	let profile_noti_num = $derived.by(() => {
		let res = local_noti_pool.filter(e => e.type == "notify_like" || e.type == "notify_view")
		return res.length
	})

	async function logout() {
		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
		}
		let fetch_res = await fetch('http://localhost:3000/auth/logout', payload)
		if (fetch_res.ok)
			return window.location.href = "/"
		let err_msg = (await fetch_res.json())['detail']
		showToast(err_msg, ToastType.ERROR)
	}

	onMount(async () => {
		// I am going to create ws here
		if ($ws_client == null)
		{
			const new_ws_client = connect_ws();
			ws_client.set(new_ws_client)
		}

		// get pending notifications without consuming
		try {
			let pending_notifs = await not_w_filter()
			notification_pool.update((e) => [...e, ...pending_notifs])
		} catch (error: unknown) {
			let errorMessage = 'An unexpected error occurred';

			if (error instanceof Error) {
				errorMessage = error.message;
			}

			showToast(errorMessage, ToastType.ERROR);
		}
	})

	async function accept_call() {
		peerConnection = new RTCPeerConnection(rtc_config)
		let localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		if (localVideo) localVideo.srcObject = localStream;
		localStream.getTracks().forEach(track => {
			peerConnection?.addTrack(track, localStream!);
		});
		peerConnection.ontrack = (event: RTCTrackEvent) => {			
			if (remoteVideo)
				remoteVideo.srcObject = event.streams[0];
		};
		const offer = $curr_rtc_data['rtc']
		const user = $curr_call_remote_user

		if (user == null || local_ws == null)
			return showToast("no user or ws when answer", ToastType.ERROR)
		
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

	async function reject_call(): Promise<void> {
		if (!local_ws || !$curr_call_remote_user)
			return showToast("Local user or ws missing", ToastType.ERROR)
		const offer = $curr_rtc_data['rtc']

		await local_ws.emitWithAck('emit_reject', JSON.stringify({user_id: $curr_call_remote_user.id, data: offer}))
		curr_in_call.set(false)
		curr_ringing.set(false)
		curr_rtc_data.set(null)
		curr_call_remote_user.set(null)

		const modal = document.getElementById('call_modal') as HTMLDialogElement | null;
		modal?.close();
	}

	async function cleanup_call_modal() {
		leave_call()
		if (localVideo?.srcObject) {
			localVideo.srcObject = null;
		}
	}

	function leave_call() {
		if ($curr_in_call == false)
			return
		if (peerConnection) {
			// peerConnection.getSenders().forEach(sender => sender.track?.stop());
			// peerConnection.getReceivers().forEach(receiver => receiver.track?.stop());
			peerConnection.close();
			peerConnection = null;
    	}

		if (remoteVideo?.srcObject) {
			remoteVideo.srcObject = null;
		}

		curr_in_call.set(false)
		curr_ringing.set(false)
		curr_rtc_data.set(null)
		curr_is_caller.set(false)
		curr_call_remote_user.set(null)

		const modal = document.getElementById('call_modal') as HTMLDialogElement | null;
		modal?.close();
	}

	const rtc_config: RTCConfiguration = {
	  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
	};

	let ice_bucket: any[] = $state.raw([])

	$effect(() => {
		if ($curr_ice_data == null)
			return
		ice_bucket.push($curr_ice_data)
	})

	$effect(() => {
		if (!$curr_rtc_data && !$curr_in_call)
			return

		if ($curr_rtc_data['rtc'].type == "answer")
		{
			peerConnection?.setRemoteDescription(new RTCSessionDescription($curr_rtc_data['rtc']))
			curr_in_call.set(true)
			curr_ringing.set(false)
		}
	})

	$effect(() => {
		// open call modal when ring and init rtc stuff
		if ($curr_ringing)
		{
			const modal = document.getElementById('call_modal') as HTMLDialogElement | null;
			modal?.showModal();

		if ($curr_is_caller)
		{
			(async () => {
				peerConnection = new RTCPeerConnection(rtc_config)
				let localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
				if (localVideo) localVideo.srcObject = localStream;
				localStream.getTracks().forEach(track => {
					peerConnection?.addTrack(track, localStream!);
				});
				peerConnection.ontrack = (event: RTCTrackEvent) => {			
					if (remoteVideo)
						remoteVideo.srcObject = event.streams[0];
				};

				peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
					if (event.candidate) {
						local_ws?.emitWithAck('emit_ice', JSON.stringify({
							'user_id': $curr_call_remote_user?.id,
							'data': event.candidate
						}));
					}
				};

			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);
			const res = await local_ws?.emitWithAck('emit_call', JSON.stringify({user_id: $curr_call_remote_user?.id, data: offer}))

			let err_msg = res['detail']
			if (err_msg)
				return showToast(err_msg, ToastType.ERROR)
			})()
		}
		else {
			// do nothing and wait for user to accept or reject call...
			
			// perhaps set caller user here?
			if ($curr_rtc_data == null)
				return showToast("no rtc data at answer side", ToastType.ERROR)
			curr_call_remote_user.set($curr_rtc_data['user'])

		}
			// modal?.close()
		}
	})

</script>

<div class="relative h-full">
	<!--NOTE: logout can be in profile page?-->
	<!-- <div class="grid grid-cols-4 gap-0 border-b-1 border-gray-200 h-20">
		<div class=" col-span-3">
			<img
			src="https://imgs.search.brave.com/pIsbd2G3Tr3v5J48mm1DQSk7EFgZfzAgG51gmCaiZFI/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9saXZl/LWhpbmR1LWFtZXJp/Y2FuLWZvdW5kYXRp/b24ucGFudGhlb25z/aXRlLmlvL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDE5LzExL25h/emktZmxhZy5qcGc"
			alt="logo"
			class="w-40 h-20"
			/>
		</div>

		<a href="/">
			<div class="flex justify-center items-center h-full col-span-1">
				<Button>Log out</Button>
			</div>
		</a>

	</div> -->
	<div class="px-2 py-1">
		{@render children()}
	</div>

	<!--video call modal-->
	<dialog id="call_modal" class="modal" onclose={cleanup_call_modal}>
		<div class="modal-box">
			<div class={$curr_in_call? 'hidden' : ''}>
				{#if $curr_is_caller}
					<p> Calling {$curr_call_remote_user?.displayname} </p>
				{:else}
					<div>
						<p>{$curr_call_remote_user?.displayname} is calling you</p>
						<button class="btn" onclick={accept_call}>Accept call</button>
						<button class="btn" onclick={reject_call}>reject call</button>
					</div>
				{/if}
			</div>

			<div class={$curr_in_call? '' : 'hidden'}>
				<div>
					<!-- <p>localVideo {localVideo? (localVideo.srcObject? "SRC yes" : "SRC no") : "no"}</p> -->
				  <video bind:this={localVideo} autoplay playsinline muted></video>
				</div>
				
				<div>
					<!-- <p>remote video {remoteVideo? (remoteVideo.srcObject? "SRC yes" : "SRC no") : "no"}</p> -->
					<!-- svelte-ignore a11y_media_has_caption -->
					<video bind:this={remoteVideo} autoplay playsinline></video>
				</div>
				<div>
					<button class="btn" onclick={leave_call}>leave call</button>
				</div>
			</div>

		
		</div>
	</dialog>


	<div class="sticky bottom-0 left-0 h-15 w-full grid grid-cols-5 gap-0 border-t-1 border-gray-200 bg-white" style="z-index: 900;">
		<div class="flex justify-center items-center">
			<a class="relative" href="/app/home" aria-label="home">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
				</svg>
			</a>	
		</div>
		<div class="relative flex justify-center items-center">
			<a class="relative" href="/app/matches" aria-label="matches">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
				</svg>
				{#if matches_noti_num > 0}
					<span class="absolute -top-1 -right-1 inline-block w-3 h-3 bg-red-500 rounded-full"></span>
				{/if}
			</a>
		</div>
		<div class="relative flex justify-center items-center">
			<a class="relative" href="/app/profile" aria-label="profile">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
				</svg>		
				{#if profile_noti_num > 0}
					<span class="absolute -top-1 -right-1 inline-block w-3 h-3 bg-red-500 rounded-full"></span>
				{/if}
			</a>
		</div>

		<div class="relative flex justify-center items-center">
			<a class="relative" href="/app/map" aria-label="map">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
				  </svg>
						
			</a>
		</div>

		<div class="relative flex justify-center items-center">
			<button class="relative cursor-pointer" aria-label="logout" onclick={logout}>
				
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="red" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
				</svg>
				  		  
			</button>
		</div>
	</div>
</div>