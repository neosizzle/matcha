<script>
	let url = "http://localhost:3000/auth/oauth42";

	function redirectToUrl() {
		window.location.href = url;
	}
</script>

<div>
	<h1>COMING SOON: go to /app/home to view app contents</h1>
	<button on:click={redirectToUrl}>oauth test</button>
</div>

