<script>
	import { onMount } from 'svelte';

	let isLoading = true;

	onMount(async () => {
	try {
		const params = Object.fromEntries(new URLSearchParams(window.location.search));
		console.log(params)
	} catch (error) {
	}
	});
</script>

<div>
	<h1>Signing you in....</h1>
</div>

