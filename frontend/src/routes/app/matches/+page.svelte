
<script lang="ts">
    import Blocks from "./Blocks.svelte";
    import Dates from "./Dates.svelte";
    import Likes from "./Likes.svelte";
    import Matches from "./Matches.svelte";




</script>

<div>

	<div class="tabs tabs-lift">
		<input type="radio" name="my_tabs_3" class="tab text-black focus:shadow-none focus:outline-none focus:ring-0 focus:border-none" aria-label="Matches" checked/>
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<Matches/>
		</div>
	  
		<input type="radio" name="my_tabs_3" class="tab text-black focus:shadow-none focus:outline-none focus:ring-0 focus:border-none" aria-label="Likes" />
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<Likes/>
		</div>
	  
		<input type="radio" name="my_tabs_3" class="tab text-black focus:shadow-none focus:outline-none focus:ring-0 focus:border-none" aria-label="Blocks" />
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<Blocks/>
		</div>

		<input type="radio" name="my_tabs_3" class="tab text-black focus:shadow-none focus:outline-none focus:ring-0 focus:border-none" aria-label="Dates" />
		<div class="tab-content bg-base-100 border-base-300 p-6">
			<Dates/>
		</div>
	  </div>
</div>

