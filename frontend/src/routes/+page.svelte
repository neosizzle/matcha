<script>
    import Button from "../components/Button.svelte";

	let url = "http://localhost:3000/auth/oauth42";
	let email = ''
	let password = ''
	let showPassword = false;
	
	function redirectToUrl() {
		window.location.href = url;
	}

	function handleLogin() {
		// TODO..
	}


  // Toggle the visibility of the password
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

</script>

<div class="flex justify-center items-center h-full">
	<div class="flex flex-col items-center">
		<img src="logo.png" class="w-[100px]" alt="logo"/>

		<!--Login field-->
		<div>
			<form on:submit|preventDefault={handleLogin} class="my-6">
				
				<input type={'email'} required placeholder="Email" class="border-2 border-gray-300 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5 mb-3"/>



				<div class="relative mb-3">
					<input type={showPassword ? 'text' : 'password'} required placeholder="Password" class="border-2 border-gray-300 focus:border-pink-300 focus:outline-none focus:ring-pink-300 rounded py-1.5"/>

					{#if showPassword}
						<button class="absolute top-[9px] right-[15px] cursor-pointer"  on:click={togglePasswordVisibility} aria-label="show-pw">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
								<path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
								<path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clip-rule="evenodd" />
							</svg>						  
						</button>
					{:else}
						<button class="absolute top-[9px] right-[15px] cursor-pointer"  on:click={togglePasswordVisibility} aria-label="show-pw">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
								<path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z" clip-rule="evenodd" />
								<path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
							</svg>						  
						</button>
					{/if}
					

				</div>
				<Button type="submit" customClass="w-[200px]"> Login </Button>

			</form>
		</div>

		<div>
			<button on:click={redirectToUrl}>oauth test</button>
			<h1>COMING SOON: go to /app/home to view app contents</h1>
		</div>

		<div>
			<button on:click={redirectToUrl}>oauth test</button>
			<h1>COMING SOON: go to /app/home to view app contents</h1>
		</div>
	</div>
</div>

