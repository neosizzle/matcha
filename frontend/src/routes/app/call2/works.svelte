<script lang="ts">
	import { onMount } from 'svelte';
	import io from 'socket.io-client';
  
	let localVideo: HTMLVideoElement;
	let remoteVideo: HTMLVideoElement;
	let localStream: MediaStream;
	let peerConnection: RTCPeerConnection | null = null;
  
	const ws_conn_options = {
		withCredentials: true
	}
	const socket = io('http://localhost:3000', ws_conn_options); // Signaling server
  
	const config: RTCConfiguration = {
	  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
	};
  
	onMount(async () => {
	  try {
		localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
		if (localVideo) {
		  localVideo.srcObject = localStream;
		}
	  } catch (err) {
		console.error('Error accessing media devices:', err);
	  }
  
	  socket.on('offer', async (offer: RTCSessionDescriptionInit) => {
		peerConnection = new RTCPeerConnection(config);
		localStream.getTracks().forEach(track => peerConnection!.addTrack(track, localStream));
  
		peerConnection.ontrack = (event: RTCTrackEvent) => {
			console.log("ontrack!!")
		  remoteVideo.srcObject = event.streams[0];
		};

		peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			if (event.candidate) {
				console.log('emit ice')
				socket.emit('ice-candidate', event.candidate);
			}
		};
  
		await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
		const answer = await peerConnection.createAnswer();
		await peerConnection.setLocalDescription(answer);
		socket.emit('answer', answer);
	  });
  
	  socket.on('answer', (answer: RTCSessionDescriptionInit) => {
		peerConnection?.setRemoteDescription(new RTCSessionDescription(answer));
	  });
  
	  socket.on('ice-candidate', (candidate: RTCIceCandidateInit) => {
		peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
	  });
	});
  
	const startCall = async () => {
		peerConnection = new RTCPeerConnection(config);
		localStream.getTracks().forEach(track => peerConnection!.addTrack(track, localStream));
		
		peerConnection.ontrack = (event: RTCTrackEvent) => {
			remoteVideo.srcObject = event.streams[0];
		};
		
		peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			if (event.candidate) {
				console.log('emit ice')
				socket.emit('ice-candidate', event.candidate);
			}
		};
		
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);
	  socket.emit('offer', offer);
	};
  </script>
  
  <main>
	<video bind:this={localVideo} autoplay muted playsinline></video>
	<video bind:this={remoteVideo} autoplay playsinline></video>
	<button on:click={startCall}>Start Call</button>
  </main>
  
  <style>
	video {
	  width: 300px;
	  margin: 10px;
	  background: black;
	}
  </style>
  