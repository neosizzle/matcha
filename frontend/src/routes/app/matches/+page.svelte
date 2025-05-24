
<script lang="ts">
	import { onMount } from "svelte";
	import Blocks from "./Blocks.svelte";
	import Dates from "./Dates.svelte";
	import Likes from "./Likes.svelte";
	import Matches from "./Matches.svelte";
	import { get_user_rest } from "../../../utils/globalFunctions.svelte";
	import { user as glob_user } from "../../../stores/globalStore.svelte";
	import type { User } from "../../../types/user";


	let local_user: User | null = $state(null); 
	glob_user.subscribe(e => {
		local_user = e
	})

	onMount(async () => {
		let user_des = await get_user_rest()
		if (!user_des)
			return window.location.href = "/"

		// set global store if OK and store is empty (refresh)
		if (!local_user)
			glob_user.update(() => user_des)
	})

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

