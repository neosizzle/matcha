<script lang="ts">
    import Button from "../../../components/Button.svelte";
	import { onMount } from "svelte";
	import { user as glob_user, ws_client } from "../../../stores/globalStore.svelte"
	import { Gender, type User } from "../../../types/user";
    import { calculate_age_from_date, connect_ws, deserialize_user_object, get_user_rest, update_user_loction_auto } from "../../../utils/globalFunctions.svelte";
    import type { Location } from "../../../types/location";
	import { ToastType } from "../../../types/toast";
    import { showToast } from "../../../utils/globalFunctions.svelte";
    import UserSearchSkeleton from "../../../components/UserSearchSkeleton.svelte";
    import { goto } from "$app/navigation";
    import UserBrowseSkeleton from "../../../components/UserBrowseSkeleton.svelte";
    import type { ClientToServerEvents, ServerToClientEvents } from "../../../types/ws";
    import type { Socket } from "socket.io-client";
    import ToastList from "../../../components/ToastList.svelte";

	let curr_mode = $state(1)
	let sort_keys = [
		{name: "Location", value: "location_diff"},
		{name: "Age", value: "age"},
		{name: "Fame Rating", value: "fame_rating"},
		{name: "# common tags", value: "common_tag_count"},
	]
	let sort_key = $state(sort_keys[0])
	let sort_dirs = [
		{name: "Ascending", value: "asc"},
		{name: "Descending", value: "desc"},
	]
	let genders = [
		{name: "Male", value: "m"},
		{name: "Female", value: "f"},
		{name: "Non binary", value: "nb"},
	]
	let selected_genders: string[] = $state(["nb"])
	let sort_dir = $state(sort_dirs[0])
	let age_range = [0, 100]
	let fame_range = [0, 100]
	let common_tag_range = [0, 100]
	let loc_range = $state(10)
	let save_changes_disabled = $state(false)
	let browse_users: User[] = $state([])
	let search_users: User[] = $state([])

	let local_user: User | null = $state(null); 
	glob_user.subscribe(e => {
		if (e)
			local_user = e
	})

	let local_ws: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
	ws_client.subscribe(e => local_ws = e)

	function get_gender_key_by_val(genders: {name: string, value: string}[], selected_genders: string[]) {
		let res = "";
		for (let i = 0; i < selected_genders.length; i++) {
			const gender_obj = genders.find((element) => {
				return element.value == selected_genders[i]
			});
			if (!gender_obj)
				continue

			res += gender_obj.name
			res += ", "
		}
		if (res.length > 2)
			res = res.slice(0, -2);
		return res
	}

	function gender_change(event: Event) {
		const target = event.target as HTMLInputElement;
		const val = target.value
		if (!selected_genders.includes(val))
			selected_genders.push(val)
		else
			selected_genders = selected_genders.filter(item => item != val);
  	}

	async function fetch_users() {
		if (!local_user)
			return

		save_changes_disabled = true

		// get search users
		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				sort_key: sort_key.value,
				sort_dir: sort_dir.value,
				age_range: age_range,
				loc_range: loc_range,
				fame_range,
				common_tag_range,
				genders: selected_genders,
			}),
		}
		let fetch_res = await fetch('http://localhost:3000/matching/search', payload)
		let data = await fetch_res.json()
		let err_msg = data['detail']
		if (err_msg)
		{
			save_changes_disabled = false
			return showToast(err_msg, ToastType.ERROR)
		}
		let search_users_ser = data['data']
		let search_users_deser: User[] = []
		search_users_ser.forEach((ser: {[key: string]: any}) => {
			search_users_deser.push(deserialize_user_object(ser))	
		});
		search_users = search_users_deser

		// get suggest users
		const payload2 = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				age_range: age_range,
				loc_range: loc_range,
				fame_range,
				common_tag_range,
				genders: selected_genders,
			}),
		}
		fetch_res = await fetch('http://localhost:3000/matching/suggest', payload2)
		data = await fetch_res.json()
		err_msg = data['detail']
		if (err_msg)
		{
			save_changes_disabled = false
			return showToast(err_msg, ToastType.ERROR)
		}
		let browse_users_unsorted_ser = data['data']
		let browse_users_unsorted_deser: User[] = []
		search_users_ser.forEach((ser: {[key: string]: any}) => {
			browse_users_unsorted_deser.push(deserialize_user_object(ser))	
		});
		let browse_users_unsorted: User[] = browse_users_unsorted_deser
		browse_users_unsorted.sort((a, b) => {
			if (!local_user)
				return 0
			const mult = sort_dir.value == "asc" ? 1 : -1;

			const get_age = (birthday: Date) => new Date().getFullYear() - birthday.getFullYear() - (new Date() < new Date(birthday.setFullYear(new Date().getFullYear())) ? 1 : 0);
			const get_common = (a: string[], b: string[]) => a.filter(item => b.includes(item)).length;
			const get_loc_diff = (user: User, userLat: number, userLon: number) => {
				const latDiff = (user.enable_auto_location 
					? user.location_auto_lat - userLat 
					: user.location_manual_lat - userLat) * 111.32;

				const lonDiff = (user.enable_auto_location 
					? user.location_auto_lon - userLon 
					: user.location_manual_lon - userLon) * 111.32 * Math.cos(userLat * Math.PI / 180);

				return Math.sqrt(latDiff ** 2 + lonDiff ** 2);
			}


			if (sort_key.value == "age")
				return (get_age(a.birthday) - get_age(b.birthday)) * mult
			if (sort_key.value == "fame_rating")
				return (a.fame_rating - b.fame_rating) * mult
			if (sort_key.value == "fame_rating")
				return (get_common(local_user.tags, a.tags ) - get_common(local_user.tags, b.tags )) * mult
			const [a_userLat, a_userLon] = a.enable_auto_location
				? [a.location_auto_lat, a.location_auto_lon]
				: [a.location_manual_lat, a.location_manual_lon];

			const [b_userLat, b_userLon] = b.enable_auto_location
				? [b.location_auto_lat, b.location_auto_lon]
				: [b.location_manual_lat, b.location_manual_lon];
			return (get_loc_diff(local_user, a_userLat, a_userLon) - get_loc_diff(local_user, b_userLat, b_userLon)) * mult

		})
		browse_users = browse_users_unsorted
		save_changes_disabled = false
	}

	let curr_auto_location_name = $state('')

	async function set_auto_location_from_coords(lat: number, lon: number) {
		const payload = {
				method: 'GET',
				credentials: "include" as RequestCredentials,
			}
		let response = await fetch(`http://localhost:3000/geo/coords?lat=${lat}&lon=${lon}`, payload);
		let body = await response.json();
		let loc = body['data'] as Location
		curr_auto_location_name = loc.name
	}

	async function handle_like() {
		if (!local_ws)
			return showToast("Ws not available", ToastType.ERROR)

		const response = await local_ws.emitWithAck("emit_like", JSON.stringify({user_id: browse_users[0].id}))
		let err_msg = response['detail']
		if (err_msg)
		{
			browse_users.shift()
			return showToast(err_msg, ToastType.ERROR)
		}
		let body = response['data']
		if (body['matched'])
			showToast(`You have matched with ${body['user']['displayname']}`, ToastType.HAPPY)
		else
			showToast(`like ${body['user']['displayname']} OK`, ToastType.SUCCESS)

		browse_users.shift()
	}

	function handle_skip() {
		browse_users.shift()
	}

	$effect(() => {
		if (browse_users.length > 0) {
    		set_auto_location_from_coords(browse_users[0].location_manual_lat, browse_users[0].location_manual_lon);
  		}
	})


	onMount(async () => {
		let user_des = await get_user_rest()
		if (!user_des)
			return window.location.href = "/"

		// set global store if OK and store is empty (refresh)
		if (!local_user)
			glob_user.update(() => user_des)

		const payload = {
			method: 'GET',
			credentials: "include" as RequestCredentials,
		}
		let response = await fetch("http://localhost:3000/geo/ip", payload);
		let body = await response.json();
		let curr_location: Location = body['data']
		
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(async (position) => {
				let response = await fetch(`http://localhost:3000/geo/coords?lat=${position.coords.latitude}&lon=${position.coords.longitude}`, payload);
				let body = await response.json();
				curr_location = body['data'] as Location
			});
		} else {
			// geolocation unavail, do nothing as we already have IP location
		}

		// I am going to create ws here
		if ($ws_client == null)
		{
			const new_ws_client = connect_ws();
			ws_client.set(new_ws_client)
		}

		// mm yes, we got lat and long from IP, time to update user
		let [new_user, loc_err] = await update_user_loction_auto(curr_location, user_des)
		if (loc_err)
			return showToast(loc_err, ToastType.ERROR)
		glob_user.update(() => new_user)

		// populate initial data
		await fetch_users()
  	})

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

						<div class="dropdown">
							<div tabindex="0" role="button" class={`btn m-1`}>{sort_key.name}</div>
							<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
								{#each sort_keys as curr_sort_key}
									<li>
										<button onclick={() => sort_key = curr_sort_key}>
											{curr_sort_key.name}
										</button>
									</li>
								{/each}
							</ul>
						</div>
	
					</div>
	
					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Sort direction
						</div>
	
						<div class="dropdown">
							<div tabindex="0" role="button" class={`btn m-1`}>{sort_dir.name}</div>
							<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
								{#each sort_dirs as curr_sort_dir}
									<li>
										<button onclick={() => sort_dir = curr_sort_dir}>
											{curr_sort_dir.name}
										</button>
									</li>
								{/each}
							</ul>
						  </div>
					</div>

					<div class="flex justify-between mb-2">
						<div class="flex items-center text-semibold ">
							Genders
						</div>
	
						<div class="dropdown dropdown-end">
							<div tabindex="0" role="button" class={`btn m-1`}>{get_gender_key_by_val(genders, selected_genders)}</div>
							<ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
								{#each genders as gender}
									<li>
										<label class="label">
											<input type="checkbox" value={gender.value} checked={selected_genders.includes(gender.value)} class="checkbox" onchange={gender_change} />
											{gender.name}
										  </label>
										<!-- <button onclick={() => sort_dir = curr_sort_dir}>
											{curr_sort_dir.name}
										</button> -->
									</li>
								{/each}
							</ul>
						  </div>
						  
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
								bind:value={age_range[0]}
							/>
							<div class="divider divider-horizontal text-sm"> </div>
							<input
								type="number"
								class="input"
								min="1"
								max="100"
								bind:value={age_range[1]}
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
							bind:value={loc_range}
						/>
					</div>
	
	
				<Button isLoading={save_changes_disabled} onclick={fetch_users}>Apply filters</Button>
				</div>
			</div>
		  </div>
	</div>


	<!--Search-->
	<div
	class={` ${curr_mode == 1? 'hidden' : ''}`}
	>
	<!-- <div>
		{search_users.length}
	</div> -->
	{#if save_changes_disabled}
		<UserSearchSkeleton/>
		{:else}
			{#if search_users.length == 0}
				<div class="h-[80vh] flex justify-center items-center">
					<div>
						<img alt="not found" class="block" src="/snow-mountain-svgrepo-com.svg"/>
						<div class="text-center">
							No users
						</div>

					</div>
				</div>

			{:else}
				{#each search_users as user}
					<button class="card bg-base-100 w-full shadow-sm mb-2" onclick={() => goto(`/app/stalk/${user.id}`)}>
						<figure>
						<img
							src={`http://localhost:3000/${user.images[0]}`}
							alt="Shoes" />
						</figure>
						<div class="card-body">
						<h2 class="card-title">{user.displayname}, {get_gender_key_by_val(genders, [user.gender])}, {calculate_age_from_date(user.birthday)}</h2>
						<p>{user.bio}</p>

						<div class="card-actions justify-end items-center font-lg">
							<svg xmlns="http://www.w3.org/2000/svg" fill="yellow" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-6">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
							</svg>
							{user.fame_rating}
						</div>
						</div>
					</button>
				{/each}
			{/if}
	{/if}
	</div>

	<!--Browse-->
	<div
	class={` ${curr_mode == 0? 'hidden' : ''}`}
	>
		{#if save_changes_disabled}
			<UserBrowseSkeleton/>
		{:else}
			{#if browse_users.length == 0}
				<div class="h-[80vh] flex justify-center items-center">
					<div>
						<img alt="not found" class="block" src="/snow-mountain-svgrepo-com.svg"/>
						<div class="text-center">
							No users
						</div>

					</div>
				</div>
			{:else}
					<div>
						<!--Main header-->
						<div class="flex justify-center w-full">
							<div class="relative">
								<!-- gender, name, age, location display -->
								<div class="absolute p-4 bottom-0 left-0 text-white">
									<div class="flex items-center">

										{#if browse_users[0].gender == Gender.FEMALE}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="pink" class="" viewBox="0 0 16 16">
												<path fill-rule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 5a5 5 0 1 1 5.5 4.975V12h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0V13h-2a.5.5 0 0 1 0-1h2V9.975A5 5 0 0 1 3 5"/>
											</svg>
											{:else if browse_users[0].gender == Gender.MALE}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="lightblue" class="" viewBox="0 0 16 16">
												<path fill-rule="evenodd" d="M9.5 2a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V2.707L9.871 6.836a5 5 0 1 1-.707-.707L13.293 2zM6 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/>
											</svg>
											{:else}
											<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="" viewBox="0 0 16 16">
												<path fill-rule="evenodd" d="M11.5 1a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-3.45 3.45A4 4 0 0 1 8.5 10.97V13H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V14H6a.5.5 0 0 1 0-1h1.5v-2.03a4 4 0 1 1 3.471-6.648L14.293 1zm-.997 4.346a3 3 0 1 0-5.006 3.309 3 3 0 0 0 5.006-3.31z"/>
											</svg>
										{/if}

										
										<span class="pl-[6px] text-lg font-extrabold"> {browse_users[0].displayname}, {calculate_age_from_date(browse_users[0].birthday)}</span>
									</div>
									<div class="max-w-48"> 
										{#if browse_users[0]?.enable_auto_location}
											<div>{curr_auto_location_name}</div>
											{:else}
											<p>{browse_users[0]?.location_manual}</p> 
										{/if}
									</div>
								</div>

								<!-- fame rating display -->
								<div class="absolute p-4 bottom-0 right-0 flex font-bold text-white">
									<svg xmlns="http://www.w3.org/2000/svg" fill="yellow" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-6">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
									</svg>
									{browse_users[0].fame_rating}
								</div>

								<!--Image carousel-->
								<div class="carousel rounded-box carousel-vertical w-[90vw] sm:w-[50vw] md:w-[50vw] lg:w-[25vw] h-96 sm:h-120 mb-3">
									{#each browse_users[0].images as image}
										<div class="carousel-item h-full w-full bg-cover bg-center" style="background-image: url(http://localhost:3000/{image})">

										</div>
									{/each}
								</div>

							</div>

						</div>

						<!-- Bio -->
						<div class="card bg-base-100 card-sm shadow-md mb-3">
							<div class="card-body">
							<h2 class="card-title">Bio</h2>
							<p>{browse_users[0].bio}</p>
							</div>
						</div>	 

						<!-- Tags -->
						<div class="card bg-base-100 card-sm shadow-md mb-3">
							<div class="card-body">
							<h2 class="card-title">Tags</h2>

							<!-- Tag list-->
							<div class="flex flex-wrap">
								{#each browse_users[0].tags as tag}
										<button class="badge badge-lg bg-pink-200 m-1">
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
												<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
											</svg>
											{tag}
										</button>
								{/each}
							</div>
							
							</div>
						</div>

						<!--Action-->
						<div class="flex justify-between px-3 mb-3">
							<button
							onclick={handle_skip}
							aria-label="skip"
							class="flex justify-center items-center rounded-full h-15 w-15 bg-red-500"
							>
							<svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="4" stroke="white" class="size-8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
							  </svg>
							  
							</button>

							<button
							onclick={handle_like}
							aria-label="like"
							class="flex justify-center items-center rounded-full h-15 w-15 bg-pink-500"
							>
							<svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="3" stroke="white" class="size-8">
								<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
							  </svg>
							  
							  
							</button>

						</div>
						
					</div>
			{/if}

		{/if}

	</div>
</div>
  
  