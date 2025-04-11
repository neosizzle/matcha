<style>
	@keyframes rainbow {
	  0% { background-position: 0% 50%; }
	  50% { background-position: 100% 50%; }
	  100% { background-position: 0% 50%; }
	}
  
	.rainbow-text {
	  background-size: 300% 300%;
	  animation: rainbow 1s linear infinite;
	}
</style>

<script lang="ts">
    import Button from "../../components/Button.svelte";
	let login_error = false
	let show_password = false
	
	function handleRegister() {
		// TODO..
	}
</script>

<div>
	<div class="flex justify-center items-center flex-col pt-4">
		<img src="logo.png" class="w-[70px]" alt="logo"/>
		<div class="pt-2 px-3 text-center">
			<h1 class="font-black italic text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-yellow-500 to-blue-500 rainbow-text">Welcome to the DIDDY party</h1>
			<span class="text-sm/1">𝓔𝓿𝓮𝓻𝔂 𝓭𝓪𝔂 𝓲𝓼 𝓪 𝓯𝓻𝓮𝓪𝓴𝓲𝓷' 𝓪𝓭𝓿𝓮𝓷𝓽𝓾𝓻𝓮, 𝓘 𝓽𝓮𝓵𝓵 𝔂𝓸𝓾. 𝓕𝓻𝓸𝓶 𝓽𝓱𝓮 𝓶𝓸𝓶𝓮𝓷𝓽 𝓘 𝔀𝓪𝓴𝓮 𝓾𝓹 𝓽𝓸 𝓽𝓱𝓮 𝓶𝓸𝓶𝓮𝓷𝓽 𝓘 𝓯𝓻𝓮𝓪𝓴𝓲𝓷' 𝓬𝓻𝓪𝓼𝓱 𝓫𝓪𝓬𝓴 𝓲𝓷𝓽𝓸 𝓶𝔂 𝓯𝓻𝓮𝓪𝓴𝔂 𝓭𝓻𝓮𝓪𝓶𝓼, 𝓲𝓽'𝓼 𝓪 𝓷𝓸𝓷-𝓼𝓽𝓸𝓹 𝓯𝓻𝓮𝓪𝓴𝓯𝓮𝓼𝓽. 𝓘'𝓶 𝓽𝓪𝓵𝓴𝓲𝓷𝓰 𝓯𝓻𝓮𝓪𝓴𝓫𝓻𝓮𝓪𝓴𝓯𝓪𝓼𝓽, 𝓯𝓻𝓮𝓪𝓴𝓬𝓸𝓯𝓯𝓮𝓮, 𝓯𝓻𝓮𝓪𝓴𝓼𝓱𝓸𝔀𝓮𝓻, 𝓯𝓻𝓮𝓪𝓴𝓬𝓸𝓶𝓶𝓾𝓽𝓮 – 𝔂𝓸𝓾 𝓷𝓪𝓶𝓮 𝓲𝓽, 𝓲𝓽'𝓼 𝓯𝓻𝓮𝓪𝓴𝓲𝓷' 𝓯𝓻𝓮𝓪𝓴𝔂.</span>
		</div>
	</div>

	<div class="inline-flex items-center justify-center w-full mb-2">
		<hr class="w-100 h-[2px] bg-pink-200 border-0 rounded-sm">
		<div class="absolute px-4 -translate-x-1/2 bg-white left-1/2">
			<svg xmlns="http://www.w3.org/2000/svg" fill="pink" viewBox="0 0 24 24" stroke-width="1.5" stroke="pink" class="size-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
			  </svg>
		</div>
	</div>

	<div class="flex justify-center items-center h-full">
		<div class="px-5 w-[99%]">
			<form on:submit|preventDefault={handleRegister} class="my-6">
				
				<div>
					<label class="block text-sm text-gray-500 mb-1" for="dob">Date of Birth</label>
					<input
					type="date"
					id="dob"
					class="
					w-[100%] border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 mb-3
					{login_error? 'border-red-500' : 'border-gray-300'}
					"
					/>

				</div>

				<div class="relative mb-3">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 absolute top-[9px] left-[12px]">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
					</svg>
					  
					<input
					type={'text'}
					required placeholder="Enter your display name"
					class="
					w-[100%] border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 pl-10
					{login_error? 'border-red-500' : 'border-gray-300'}
					"/>
				</div>

				<div class="relative mb-3">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 absolute top-[9px] left-[12px]">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
					</svg>
					  
					  
					<input
					type={'email'}
					required placeholder="Enter your email"
					class="
					w-[100%] border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 pl-10
					{login_error? 'border-red-500' : 'border-gray-300'}
					"/>
				</div>
				
				<div class="relative mb-3">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 absolute top-[9px] left-[12px]">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
					</svg>
					  
					  
					<input
					type={show_password ? 'text' : 'password'}
					required placeholder="Enter your password"
					class="
					w-[100%] border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 pl-10
					{login_error? 'border-red-500' : 'border-gray-300'}
					"/>
				</div>

				<div class="relative mb-3">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 absolute top-[9px] left-[12px]">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
					</svg>
					  
					  
					<input
					type={show_password ? 'text' : 'password'}
					required placeholder="Confirm password"
					class="
					w-[100%] border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 pl-10
					{login_error? 'border-red-500' : 'border-gray-300'}
					"/>
					
					<label class="inline-flex space-x-2 mt-1 text-sm text-gray-500">
						<input
						  type="checkbox"
						  bind:checked={show_password}
						  class=" h-4 w-4 rounded border-gray-300 focus:ring-pink-300"
						/>
						<span class="text-gray-700">Show passwords</span>
					</label>
				</div>

				<div class="px-4 mb-3 text-sm">
					<h2 class="text-base">Password requirements</h2>
					<ul class="list-disc">
						<li>Longer than 7 characters</li>
						<li>Has at least 1 uppercase character</li>
						<li>Has at least 1 lowercase character</li>
						<li>Has at least 1 special character</li>
						<li>Has at least 1 number</li>

					</ul>
				</div>
				<Button isLoading={false} type="submit" customClass="w-[200px]" > Register </Button>
			</form>
		</div>
	</div>
</div>


