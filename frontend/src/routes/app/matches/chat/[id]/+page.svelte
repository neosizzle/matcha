<script lang="ts">
	import { onMount } from "svelte";
	import { Gender, type User } from "../../../../../types/user";
    import { connect_ws, deserialize_user_object, get_user_rest, unix_time_ago } from "../../../../../utils/globalFunctions.svelte";
	import { ToastType } from "../../../../../types/toast";
    import { showToast } from "../../../../../utils/globalFunctions.svelte";
    import { notification_pool, ws_client, user as glob_user } from "../../../../../stores/globalStore.svelte";
    import type { Socket } from "socket.io-client";
    import type { ClientToServerEvents, MessageNotification, NotificationObj, ServerToClientEvents } from "../../../../../types/ws";
	import { page } from '$app/stores';
    import { goto } from "$app/navigation";

	interface ChatObject {
		contents: string;
		created_at: number;
		from_id: string;
		to_id: string
	}
	
	let messagesEnd: HTMLDivElement | null = null;
	let local_noti_pool: NotificationObj[] = $state([]);
	notification_pool.subscribe(e => local_noti_pool = e)

	let local_ws: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
	ws_client.subscribe(e => local_ws = e)

	let local_user_me: User | null = $state(null); 
	glob_user.subscribe(e => {
		if (e)
			local_user_me = e
	})

	let user_id = $page.params.id;
	let local_user: User | null = $state(null);
	let rest_chats: ChatObject[] = $state([]);
	let ws_chats: ChatObject[] = $derived.by(() => {
		if (!local_user_me)
			return []
		if (!local_user)
			return []
		let nots: NotificationObj[] = local_noti_pool.filter(e => e.type == "notify_chat")
		let res = nots.map((e) => {
			let chat_object: ChatObject = {
				contents: (e.data as MessageNotification).contents,
				from_id: user_id,
				to_id: local_user_me?.id || "",
				created_at: e.time
			}
			return chat_object
		})
		scrollToBottom()	

		return res
	});
	let own_chats: ChatObject[] = $state([]);
	let all_chats: ChatObject[] = $derived.by(() => {
		let res = [...rest_chats]
		let current_chats = [...ws_chats, ...own_chats]
		current_chats.sort((a, b) => a.created_at - b.created_at)
		res = [...res, ...current_chats]
		return res
	})
	let message: string = $state("");

	async function send_message() {
		if (!local_ws)
			return showToast("Ws not available", ToastType.ERROR) 
		if (!local_user_me)
			return showToast("local current user not available", ToastType.ERROR) 
		const response = await local_ws.emitWithAck("emit_chat", JSON.stringify({user_id, contents: message}))
		let err_msg = response['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		const new_chat_obj = {
			contents: message,
			from_id: local_user_me.id,
			to_id: user_id,
			created_at: Date.now()
		}
		own_chats = [...own_chats, new_chat_obj]
		scrollToBottom()
		message = ""
	}

	function scrollToBottom() {
		if (!messagesEnd)
			return
		messagesEnd?.scrollIntoView({ behavior: 'smooth' });
	}

	onMount(async () => {
		// get user
		const payload = {
				method: 'GET',
				credentials: "include" as RequestCredentials,
			}
		let response = await fetch(`http://localhost:3000/users/${user_id}`, payload);
		if (response.status == 401)
			window.location.href = "/"

		const user_data = await response.json();
		let err_msg = user_data['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		let user_obj = user_data['data']
		let user_des: User = deserialize_user_object(user_obj)

		local_user = user_des

		let me_des = await get_user_rest()
		if (!me_des)
			return window.location.href = "/"

		// set global store if OK and store is empty (refresh)
		if (!local_user_me)
			glob_user.update(() => me_des)

		// I am going to create ws here
		if ($ws_client == null)
		{
			const new_ws_client = connect_ws();
			ws_client.set(new_ws_client)
		}

		// get chat history data
		response = await fetch(`http://localhost:3000/chat/history/${user_id}`, payload);
		let body = await response.json();
		err_msg = body['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		let res: ChatObject[] = []
		for (let i = 0; i < body['data'].length; i++) {
			const chat_obj = body['data'][i] as ChatObject;
			res.push(chat_obj)
		}
		rest_chats = [...rest_chats, ...body['data'] as ChatObject[]]

		// scroll to bottom
		await new Promise(resolve => setTimeout(resolve, 10));
		scrollToBottom()
	})

</script>

<div class="w-full">
	<div class="z-2 sticky top-0 bg-white flex items-center p-2 border-b-2 border-gray-500">
		
		<button aria-label="back" class="cursor-poninter mr-2" onclick={() => goto("/app/matches")}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
			  </svg>
		</button>
		
		<div class="avatar mr-4">
			<div class="w-12 rounded-full">
			  <img alt="pic" src={`http://localhost:3000/${local_user?.images[0]}`} />
			</div>
		</div>

		<div class="text-xl">
			{local_user?.displayname}
			{#if local_user?.gender == Gender.FEMALE}
			<div class="badge badge-sm bg-pink-300">
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="white" class="" viewBox="0 0 16 16">
					<path fill-rule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 5a5 5 0 1 1 5.5 4.975V12h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0V13h-2a.5.5 0 0 1 0-1h2V9.975A5 5 0 0 1 3 5"/>
				</svg>
			</div>
			{:else if local_user?.gender == Gender.MALE}
			<div class="badge badge-sm bg-blue-300">
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="white" class="white" viewBox="0 0 16 16">
					<path fill-rule="evenodd" d="M9.5 2a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V2.707L9.871 6.836a5 5 0 1 1-.707-.707L13.293 2zM6 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/>
				</svg>
			</div>
			{:else}
			<div class="badge badge-sm bg-gray-300">
				<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-gender-ambiguous" viewBox="0 0 16 16">
					<path fill-rule="evenodd" d="M11.5 1a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-3.45 3.45A4 4 0 0 1 8.5 10.97V13H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V14H6a.5.5 0 0 1 0-1h1.5v-2.03a4 4 0 1 1 3.471-6.648L14.293 1zm-.997 4.346a3 3 0 1 0-5.006 3.309 3 3 0 0 0 5.006-3.31z"/>
				</svg>
			</div>
			{/if}
		</div>

		<button class="ml-auto cursor-pointer" aria-label="call">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
			</svg>			  
		</button>
	</div>

	<div class="h-full min-h-[90vh] pb-10">
		{#each all_chats as chat}
		{#if chat.from_id == user_id}
			<div class="chat chat-start">
				<div class="chat-header">
					{local_user?.displayname}
				</div>

				<div class="chat-image avatar">
					<div class="w-8 rounded-full">
					<img
						alt="profile"
						src={`http://localhost:3000/${local_user?.images[0]}`}
					/>
					</div>
				</div>
				
				<div class="chat-bubble max-w-3/4">
					{chat.contents}
				</div>

				<div class="chat-footer opacity-50">{unix_time_ago(chat.created_at)}</div>
			</div>
		{:else}
		<div class="chat chat-end">
			<div class="chat-header">
				You
			</div>

			<div class="chat-bubble max-w-3/4">
				{chat.contents}
			</div>

			<div class="chat-footer opacity-50">{unix_time_ago(chat.created_at)}</div>
		</div>
		{/if}
		{/each}
		
		<!-- Invisible dummy element to scroll to -->
		<div class="py-10"> </div>
		<div bind:this={messagesEnd} class="py-1"> </div>
	</div>

	<!-- make this element stick to the bottom -->
	<div class="fixed bottom-15 w-[95vw] sm:w-[428px] bg-white flex items-center py-2">
		<input
			class="input imput-sm"
			type="text"
			bind:value={message}
			placeholder="Type a message..."
			onkeypress={(e) => e.key === 'Enter' && send_message()}
		/>
		
		<div class="w-1/4 flex justify-evenly items-center">
			<button aria-label="send" onclick={() => {}} class="btn btn-circle btn-xs sm:btn-sm">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
				</svg>			  
			</button>

			<button aria-label="send" onclick={send_message} class="btn btn-circle btn-xs sm:btn-sm">
				<svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
				</svg>
			</button>
		</div>
	</div>
</div>
