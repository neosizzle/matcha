<script lang="ts">
    import { onMount } from "svelte";
    import { notification_pool, ws_client } from "../../stores/globalStore.svelte";
    import { ToastType } from "../../types/toast";
    import { connect_ws, not_w_filter, showToast } from "../../utils/globalFunctions.svelte";
    import type { NotificationObj } from "../../types/ws";

	let { children } = $props();
	let local_noti_pool: NotificationObj[] = $state([]);
	notification_pool.subscribe(e => local_noti_pool = e)

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

	<div class="sticky bottom-0 left-0 h-15 w-full grid grid-cols-5 gap-0 border-t-1 border-gray-200 bg-white">
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