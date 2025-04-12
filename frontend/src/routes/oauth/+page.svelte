<script lang='ts'>
	import { onMount } from 'svelte';

	let isLoading = true;

	onMount(async () => {
	try {
		const params = Object.fromEntries(new URLSearchParams(window.location.search));
		const code = params.code
		const state = params.state

		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				method: '42',
				code,
				state
			}),
		}
		fetch('http://localhost:3000/auth/login', payload)
		.then(data => data.json())
		.then(data => {
			const err_msg = data['detail']
			if (err_msg)
				window.location.href = "/"

			// TODO set user store here
			window.location.href = "/app/home"
		})
		.catch(error => {
			console.log(error)
			window.location.href = "/"
		})

	} catch (error) {
	}
	});
</script>

<div>
	<h1>Signing you in....</h1>
</div>

