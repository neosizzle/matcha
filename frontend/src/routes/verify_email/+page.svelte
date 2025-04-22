<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../../components/Button.svelte";
    import { ToastType } from "../../types/toast";
    import { showToast } from "../../utils/globalFunctions.svelte";
	import { user as glob_user } from "../../stores/globalStore.svelte"
    import type { User } from "../../types/user";
	import { goto } from '$app/navigation'; // if using SvelteKit

	let interval: number | undefined;
	let otp = ''
	let otp_error = false;
	let verify_loading = false;
	let request_cooldown = 30;
	let local_user: User | null = null; 

	// junhan: not going to check for null here, this ux is not worth my effort
	glob_user.subscribe(e => local_user = e)

	function handleSubmit() {
		verify_loading = true;

		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				otp,
			}),
		}
		fetch('http://localhost:3000/auth/verify_email', payload)
		.then(data => data.json())
		.then(data => {
			verify_loading = false;
			const err_msg = data['detail']
			if (err_msg)
			{
				otp_error = true
				return showToast(err_msg, ToastType.ERROR)
			}
			glob_user.update((old_user) => {
				if (old_user)
					old_user.verified = true
				return old_user
			})
			showToast('Email verified', ToastType.SUCCESS)
			goto("/app/home")
		})
		.catch(error => {
			verify_loading = false;
			showToast(error, ToastType.ERROR)
		})
	}

	async function handleRequest() {
		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
		}
		let fetch_res = await fetch('http://localhost:3000/auth/request_verify_email', payload)
		if (fetch_res.ok)
			return startCooldown()
		if (fetch_res.status == 403)
			window.location.href = "/"
		let data = await fetch_res.json();
		showToast(data['detail'], ToastType.ERROR)
	}

	function startCooldown(seconds = 30) {
		request_cooldown = seconds;

		// clear any previous interval
		clearInterval(interval);

		interval = setInterval(() => {
		request_cooldown -= 1;
		if (request_cooldown <= 0) {
			clearInterval(interval);
			interval = undefined;
		}
		}, 1000);
	};

  onMount(async () => {
	const payload = {
		method: 'POST',
		credentials: "include" as RequestCredentials,
	}
	let fetch_res = await fetch('http://localhost:3000/auth/request_verify_email', payload)
	if (fetch_res.ok)
		return startCooldown()
	window.location.href = "/"
  })

</script>

<div class="flex justify-center items-center h-full">
	<div class="flex flex-col items-center">
		<img src="logo.png" class="w-[100px]" alt="logo"/>
		
		<div class="text-center mt-5 px-10">
			<p class="text-lg">Email verification</p>
			<p>
				email verification is required to use our services. We have sent a 6-digit OTP to <span class="font-semibold underline"> {local_user?.email} </span>
			</p>
		</div>

		<!--Login field-->
		<div class="mb-2">
			<form on:submit|preventDefault={handleSubmit} class="my-6">
				
				<input
				bind:value={otp}
				type={'text'}
				required placeholder="Enter OTP code here"
				class="
				w-[100%] border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 mb-3
				{otp_error? 'border-red-500' : 'border-gray-300'}
				"/>

				<div class="text-sm mb-2 px-1">
					{#if request_cooldown > 0}
						<p class="text-gray-400">Request available in {request_cooldown} seconds</p>
						{:else}
						<button type="button" class="underline text-blue-400 cursor-pointer" on:click={handleRequest}>Request a new OTP</button>
					{/if}
				</div>
				<Button isLoading={verify_loading} type="submit" customClass="w-[300px]" > Verify </Button>
			</form>
		</div>

	</div>
</div>

