<script lang="ts">
    import Button from "../../components/Button.svelte";

	let { children } = $props();
</script>

<div class="relative h-full">
	<div class="grid grid-cols-4 gap-0 border-b-1 border-gray-200 h-20">
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
				<!-- <button type="button" class="text-white bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Log out</button> -->
			</div>
		</a>

	</div>
	<div class="px-2 py-1">
		{@render children()}
	</div>

	<div class="absolute bottom-0 left-0 h-15 w-full grid grid-cols-4 gap-0 border-t-1 border-gray-200">
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
				<span class="absolute -top-1 -right-1 inline-block w-3 h-3 bg-red-500 rounded-full"></span>
			</a>
		</div>
		<div class="relative flex justify-center items-center">
			<a class="relative" href="/app/chat" aria-label="chat">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
				</svg>			  
			</a>
		</div>
		<div class="relative flex justify-center items-center">
			<a class="relative" href="/app/profile" aria-label="profile">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
				</svg>			  
			</a>
		</div>
	</div>
</div>