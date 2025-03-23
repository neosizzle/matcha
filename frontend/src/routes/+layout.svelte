<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<div class="flex justify-center h-screen pattern">
	<div class="absolute h-full w-full sm:w-md shadow-2xl rounded bg-white">
		{@render children()}
	</div>
</div>