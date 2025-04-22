<script lang='ts'>
	import { onMount } from 'svelte';
	import { user as glob_user } from "../../stores/globalStore.svelte"
    import type { User } from "../../types/user";
	import { goto } from '$app/navigation';

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
		
			const user_obj = data['data']['user']
			const user: User = {...user_obj, birthday: new Date(user_obj['birthday']), images: user_obj['images'].split(",").filter((x: string)=>x!=''), tags: user_obj['tags'].split(",").filter((x: string)=>x!='')}
			glob_user.update(() => user)
			goto("/app/home")
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

