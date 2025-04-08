<script>
	export let customClass = '';
	export let isLoading = false;

</script>
  
<button
	class="{isLoading? ' bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 opacity-50' : 'cursor-pointer bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800'} text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center {customClass}"
	disabled={isLoading}
	{...$$props}
>
{#if isLoading}
	<span>...</span>
{:else}
	<slot></slot>
{/if}
</button>