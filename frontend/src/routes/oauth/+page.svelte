<script>
	import { onMount } from 'svelte';

	let isLoading = true;

	onMount(async () => {
	try {
		const params = Object.fromEntries(new URLSearchParams(window.location.search));
		// TODO validate oauth user and redirect to home page
		console.log(params)
	} catch (error) {
	}
	});
</script>

<div>
	<h1>Signing you in....</h1>
</div>

