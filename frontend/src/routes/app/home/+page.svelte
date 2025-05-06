<script>
    import Button from "../../../components/Button.svelte";

	let curr_mode = 0
	let sort_keys = [
		{name: "Location", value: "location_diff"},
		{name: "Age", value: "age"},
		{name: "Fame Rating", value: "fame_rating"},
		{name: "# common tags", value: "common_tag_count"},
	]
	let curr_sort_key = sort_keys[0]
	let sort_dirs = [
		{name: "Ascending", value: "asc"},
		{name: "Descending", value: "desc"},
	]
	let curr_sort_dir = sort_dirs[0]
	let curr_age_range = [0, 100]
	let fame_range = [0, 100]
	let common_tag_range = [0, 100]
	let loc_diff = 10

</script>

<div>
	<!-- Settings dropdown -->
	<div class="relative w-full">
		<div class="collapse bg-base-100">
			<input type="checkbox" />
			<div class="collapse-title font-semibold flex justify-center p-2">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
				  </svg>							
			</div>
			<div class="collapse-content">
				<div class="shadow-lg p-2 sm:px-4">
					
					<!--Mode-->
					<div class="flex w-full h-10 mb-5">
						<button class={`card bg-base-300 rounded-box grid grow place-items-center cursor-pointer ${curr_mode == 1? 'bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 text-white' : ''}`} onclick={() => curr_mode = 1}>Browse</button>
						<div class="divider divider-horizontal"></div>
						<button class={`card bg-base-300 rounded-box grid grow place-items-center cursor-pointer ${curr_mode == 0? 'bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 text-white' : ''}`} onclick={() => curr_mode = 0}>Search</button>
					</div>
	
					<!-- Sorts and filters -->
					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Sort by
						</div>
	
						<details class="dropdown">
							<summary class="btn m-1">{curr_sort_key.name}</summary>
							<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
								{#each sort_keys as sort_key}
									<li>
										<button onclick={() => curr_sort_key = sort_key}>
											{sort_key.name}
										</button>
									</li>
								{/each}
							</ul>
						</details>
					</div>
	
					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Sort direction
						</div>
	
						<details class="dropdown">
							<summary class="btn m-1">{curr_sort_dir.name}</summary>
							<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
								{#each sort_dirs as sort_dir}
									<li>
										<button onclick={() => curr_sort_dir = sort_dir}>
											{sort_dir.name}
										</button>
									</li>
								{/each}
							</ul>
						</details>
					</div>
	
					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Age range
						</div>
	
						<div class="flex">
							<input
								type="number"
								class="input"
								min="1"
								max="100"
								bind:value={curr_age_range[0]}
							/>
							<div class="divider divider-horizontal text-sm"> </div>
							<input
								type="number"
								class="input"
								min="1"
								max="100"
								bind:value={curr_age_range[1]}
							/>
						</div>
					</div>
	
					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Fame range
						</div>
	
						<div class="flex">
							<input
								type="number"
								class="input"
								min="1"
								max="100"
								bind:value={fame_range[0]}
							/>
							<div class="divider divider-horizontal text-sm"> </div>
							<input
								type="number"
								class="input"
								min="1"
								max="100"
								bind:value={fame_range[1]}
							/>
						</div>
					</div>
	
					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Common tag range
						</div>
	
						<div class="flex">
							<input
								type="number"
								class="input"
								min="1"
								max="100"
								bind:value={common_tag_range[0]}
							/>
							<div class="divider divider-horizontal text-sm"> </div>
							<input
								type="number"
								class="input"
								min="1"
								max="100"
								bind:value={common_tag_range[1]}
							/>
						</div>
					</div>
	
					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Location range
						</div>
	
						<input
							type="number"
							class="input w-20"
							min="1"
							max="100"
							bind:value={loc_diff}
						/>
					</div>
	
	
				<Button>Apply filters</Button>
				</div>
			</div>
		  </div>
	</div>


	Asdasd

</div>
  
  