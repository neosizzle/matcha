<script lang="ts">
	import '../app.css';
	import ToastList from '../components/ToastList.svelte';
	let { children } = $props();

</script>

<div class="flex justify-center h-screen pattern">
	<div class="absolute h-full w-full sm:w-md shadow-2xl rounded bg-white">
		<ToastList />
		{@render children()}
	</div>
</div>