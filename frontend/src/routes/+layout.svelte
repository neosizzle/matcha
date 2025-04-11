<style>
	::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}

	::-webkit-scrollbar-track {
	background: #fddbf3;
	}

	::-webkit-scrollbar-thumb {
		background: #ffb9eb;
		border-radius: 10px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #ffb9eb;
	}
</style>

<script lang="ts">
	import '../app.css';
	import ToastList from '../components/ToastList.svelte';
	let { children } = $props();

</script>

<div class="flex justify-center h-screen pattern">
	<div class="absolute h-full w-full sm:w-md shadow-2xl rounded bg-white overflow-y-auto overflow-x-auto">
		<ToastList />
		{@render children()}
	</div>
</div>