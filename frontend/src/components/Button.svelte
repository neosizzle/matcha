<script>
	export let customClass = '';
</script>
  
<button
	class="text-white bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-pink-300 dark:focus:ring-pink-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center {customClass}"
	{...$$props}
>
<slot></slot>
</button>