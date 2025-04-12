<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../../components/Button.svelte";
    import { ToastType } from "../../types/toast";
    import { showToast } from "../../utils/globalFunctions.svelte";
	import { goto } from '$app/navigation'; // if using SvelteKit

	let interval: number | undefined;
	let otp = ''
	let otp_error = false;
	let verify_loading = false;
	let request_cooldown = 0;
	let show_password = false
	let password = ''
	let password_confirm = ''
	let email =''

	function handleSubmit() {
		
		if (password != password_confirm)
		{
			otp_error = true
			return showToast("Passwords do not match", ToastType.ERROR)	
		}
		
		verify_loading = true;
		const payload = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				otp,
				email,
				new_pw: password
			}),
		}
		fetch('http://localhost:3000/auth/verify_pw_reset', payload)
		.then(data => data.json())
		.then(data => {
			verify_loading = false;
			const err_msg = data['detail']
			if (err_msg)
			{
				otp_error = true
				return showToast(err_msg, ToastType.ERROR)
			}
			showToast('Reset successful', ToastType.SUCCESS)
			goto("/")
		})
		.catch(error => {
			verify_loading = false;
			showToast(error, ToastType.ERROR)
		})
	}

	async function handleRequest() {
		const payload = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email
			})
		}
		let fetch_res = await fetch('http://localhost:3000/auth/request_pw_reset', payload)
		if (fetch_res.ok)
		{
			otp_error = false
			showToast("Request success", ToastType.SUCCESS)
			return startCooldown()
		}
		const data = await fetch_res.json()
		showToast(data['detail'], ToastType.ERROR)
		otp_error = true
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
  })

</script>

<div class="flex justify-center items-center h-full">
	<div class="flex flex-col items-center">
		<img src="logo.png" class="w-[100px]" alt="logo"/>
		
		<div class="text-center mt-5 px-10">
			<p class="text-lg">Reset password</p>
			<p>
				An OTP code will be sent to the email and a new password can be set
			</p>
		</div>

		<div class="mb-2 px-10">
			<form on:submit|preventDefault={handleSubmit} class="my-6">
				
				<input
					type={'email'}
					bind:value={email}
					required placeholder="Enter your email"
					class="
					w-[100%] border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5  mb-3
					{otp_error? 'border-red-500' : 'border-gray-300'}
				"/>

				<div class="mb-3">
					<input
					bind:value={otp}
					type={'text'}
					required placeholder="Enter OTP code here"
					class="
					border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5
					{otp_error? 'border-red-500' : 'border-gray-300'}
					"/>
					<Button isLoading={request_cooldown > 0} type="button" onclick={handleRequest} > 
						{#if request_cooldown > 0}
							<p class="text-gray-400">Request available in {request_cooldown} seconds</p>
							{:else}
							Request OTP
						{/if}
					</Button>
				</div>


				<input
				type={show_password ? 'text' : 'password'}
				bind:value={password}
				required placeholder="New password"
				class="
				w-[100%] mb-3 border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5
				{otp_error? 'border-red-500' : 'border-gray-300'}
				"/>

				<input
				type={show_password ? 'text' : 'password'}
				bind:value={password_confirm}
				required placeholder="Confirm new password"
				class="
				w-[100%] mb-3 border-2 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5
				{otp_error? 'border-red-500' : 'border-gray-300'}
				"/>

				<label class="inline-flex space-x-2 mt-1 text-sm text-gray-500">
					<input
					  type="checkbox"
					  bind:checked={show_password}
					  class=" h-4 w-4 rounded border-gray-300 focus:ring-pink-300"
					/>
					<span class="text-gray-700">Show passwords</span>
				</label>

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
				<Button isLoading={verify_loading} type="submit" customClass="w-[100%]" > Reset password </Button>
			</form>
		</div>

	</div>
</div>

