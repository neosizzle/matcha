<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../components/Button.svelte";
    import { ToastType } from "../types/toast";
    import { showToast } from "../utils/globalFunctions.svelte";
	import { user as glob_user } from "../stores/globalStore.svelte"
    import type { User } from "../types/user";
	import { goto } from '$app/navigation';


	let oauth_url = "http://localhost:3000/auth/oauth42";
	let email = ''
	let password = ''
	let show_password = false;
	let login_error = false;
	let login_loading = false;

	function redirectToOauth() {
		window.location.href = oauth_url;
	}

	function handleLogin() {
		login_loading = true;
		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				method: 'email',
				email,
				password
			}),
		}
		fetch('http://localhost:3000/auth/login', payload)
		.then(data => data.json())
		.then(data => {
			login_loading = false;
			const err_msg = data['detail']
			if (err_msg)
			{
				login_error = true
				return showToast(err_msg, ToastType.ERROR)
			}
			showToast('Logged in', ToastType.SUCCESS)

			const user_obj = data['data']['user']
			const user: User = {...user_obj, birthday: new Date(user_obj['birthday']), images: user_obj['images'].split(",").filter((x: string)=>x!='')}
			glob_user.update(() => user)
			goto("/app/home")
		})
		.catch(error => {
			login_loading = false;
			showToast(error, ToastType.ERROR)
		})
	}


  // Toggle the visibility of the password
  function togglePasswordVisibility() {
    show_password = !show_password;
  }

  onMount(async () => {
	try {
		const resp = await fetch('http://localhost:3000/users/me', {credentials: 'include'})
		if (resp.ok)
		{
			const data = await resp.json();
			const user_obj = data['data']
			const user: User = {...user_obj, birthday: new Date(user_obj['birthday']), images: user_obj['images'].split(",").filter((x: string)=>x!='')}
			glob_user.update(() => user)
			goto('/app/home')
		}
	} catch (error) {
		return
	}
  })

</script>

<div class="flex justify-center items-center h-full">
	<div class="flex flex-col items-center">
		<img src="logo.png" class="w-[100px]" alt="logo"/>

		<!--Login field-->
		<div class="mb-2">
			<form on:submit|preventDefault={handleLogin} class="my-6">
				
				<input
				bind:value={email}
				type={'email'}
				required placeholder="Email"
				class="
				border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 mb-3
				{login_error? 'border-red-500' : 'border-gray-300'}
				"/>

				<div class="relative mb-6">
					<input
					bind:value={password}
					type={show_password ? 'text' : 'password'}
					required
					placeholder="Password"
					class="border-2 {login_error? 'border-red-500' : 'border-gray-300'} focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5"/>

					{#if show_password}
						<button type="button" class="absolute top-[9px] right-[15px] cursor-pointer"  on:click={togglePasswordVisibility} aria-label="show-pw">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
								<path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
								<path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd" />
							</svg>						  
						</button>
					{:else}
						<button type="button" class="absolute top-[9px] right-[15px] cursor-pointer"  on:click={togglePasswordVisibility} aria-label="show-pw">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
								<path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clip-rule="evenodd" />
								<path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
							</svg>						  
						</button>
					{/if}
					
				</div>

				<div class="text-sm mb-2 px-1">
					<a class="underline text-blue-400 cursor-pointer" href="/register">Register</a> or <a class="underline text-blue-400 cursor-pointer" href="/reset-pw">Reset password</a>
				</div>
				<Button isLoading={login_loading} type="submit" customClass="w-[200px]" > Login </Button>
			</form>
		</div>

		<div class="inline-flex items-center justify-center w-full mb-10">
			<hr class="w-64 h-[2px] bg-pink-200 border-0 rounded-sm">
			<div class="absolute px-4 -translate-x-1/2 bg-white left-1/2">
				<svg xmlns="http://www.w3.org/2000/svg" fill="pink" viewBox="0 0 24 24" stroke-width="1.5" stroke="pink" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
				  </svg>
			</div>
		</div>

		<div>
			<button on:click={redirectToOauth} class="w-[300px] bg-black flex items-center justify-center border-1 border-gray-700 rounded py-3 cursor-pointer text-white"> <span>Continue with</span>  <img src="42-white.png" alt="42" class="pl-2 w-10"/></button>
		</div>

	</div>
</div>

