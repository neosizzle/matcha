<script lang="ts">
	import { onMount } from "svelte";
	import { Gender, type User } from "../../../../types/user";
    import { calculate_age_from_date, desc_unix_ts, deserialize_user_object } from "../../../../utils/globalFunctions.svelte";
	import { ToastType } from "../../../../types/toast";
    import { showToast } from "../../../../utils/globalFunctions.svelte";
  	import type { Location } from "../../../../types/location";
	import { page } from '$app/stores';


	let user_id = $page.params.id;
	let curr_location: Location | null = $state(null)
	let user_status: {is_online: boolean, last_online: {num: number, unit: string}} = $state({is_online: false, last_online:  {num: -1, unit: ""}})
	let local_user: User | null = $state(null); 
	let report_text = $state(""); 


	async function submit_report() {
		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				user_id,
				contents: report_text
			}),
		}
		let fetch_res = await fetch('http://localhost:3000/users/report', payload)
		let data = await fetch_res.json()
		let err_msg = data['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		showToast("User reported", ToastType.SUCCESS)

	}

	onMount(async () => {
		// get user
		const payload = {
				method: 'GET',
				credentials: "include" as RequestCredentials,
			}
		let response = await fetch(`http://localhost:3000/users/${user_id}`, payload);
		if (response.status == 401)
			window.location.href = "/"

		const user_data = await response.json();
		let err_msg = user_data['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		let user_obj = user_data['data']
		let user_des: User = deserialize_user_object(user_obj)

		local_user = user_des

		// get user last online
		response = await fetch(`http://localhost:3000/users/last_active/${user_id}`, payload);
		if (response.status == 401)
			window.location.href = "/"

		const last_online_unix = await response.json();
		err_msg = user_data['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		user_status = desc_unix_ts(last_online_unix['data'])

		if (user_des.enable_auto_location)
		{
			response = await fetch(`http://localhost:3000/geo/coords?lat=${user_des.location_auto_lat}&lon=${user_des.location_auto_lon}`, payload);
			let body = await response.json();
			curr_location = body['data'] as Location
		}
})

</script>

<div>

	<!--Main header-->
	<div class="flex justify-center w-full">
		<div class="relative">
			<!-- gender, name, age, location display -->
			<div class="absolute p-4 bottom-0 left-0 text-white">
				<div class="flex items-center">

					{#if local_user?.gender == Gender.FEMALE}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="pink" class="" viewBox="0 0 16 16">
							<path fill-rule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 5a5 5 0 1 1 5.5 4.975V12h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0V13h-2a.5.5 0 0 1 0-1h2V9.975A5 5 0 0 1 3 5"/>
						</svg>
						{:else if local_user?.gender == Gender.MALE}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="lightblue" class="" viewBox="0 0 16 16">
							<path fill-rule="evenodd" d="M9.5 2a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V2.707L9.871 6.836a5 5 0 1 1-.707-.707L13.293 2zM6 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/>
						  </svg>
						{:else}
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="" viewBox="0 0 16 16">
							<path fill-rule="evenodd" d="M11.5 1a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-3.45 3.45A4 4 0 0 1 8.5 10.97V13H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V14H6a.5.5 0 0 1 0-1h1.5v-2.03a4 4 0 1 1 3.471-6.648L14.293 1zm-.997 4.346a3 3 0 1 0-5.006 3.309 3 3 0 0 0 5.006-3.31z"/>
						</svg>
					{/if}

					
					<span class="pl-[6px] text-lg font-extrabold"> {local_user?.displayname}, {calculate_age_from_date(local_user?.birthday)}</span>
				</div>
				<div class="max-w-48"> 
					{#if local_user?.enable_auto_location}
						<div>{curr_location?.name}</div>
						{:else}
						<p>{local_user?.location_manual}</p> 
					{/if}
				</div>
			</div>

			<!-- fame rating display -->
			<div class="absolute p-4 bottom-0 right-0 flex font-bold text-white">
				<svg xmlns="http://www.w3.org/2000/svg" fill="yellow" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
				</svg>
				{local_user?.fame_rating}
			</div>

			<!--Image carousel-->
			<div class="carousel rounded-box carousel-vertical w-[90vw] sm:w-[50vw] md:w-[50vw] lg:w-[25vw] h-96 sm:h-120 mb-3">

				{#if local_user}
					{#if local_user.images.length == 0}
						<div class="carousel-item h-full block">
							<div class="w-full h-full bg-gray-300 flex justify-center items-center">
								<div class="flex flex-col">
									<div class="w-50 text-center m-2">Bro has no picture yet 😭</div>
								</div>
							</div>
						</div>
					{/if}
					{#each local_user.images as image}
					<div class="carousel-item h-full w-full bg-cover bg-center" style="background-image: url(http://localhost:3000/{image})">

					</div>
					{/each}
				{/if}

			</div>
		</div>

	</div>

	<!--Last online-->
	{#if !user_status.is_online && user_status.last_online.num != -1}
		<p class="mb-3 pl-3">Offline: Last online {user_status.last_online.num} {user_status.last_online.unit} ago</p>
		{:else if user_status.is_online}
			<p class="mb-3 pl-3">Online </p>
		{:else}
			<p class="mb-3 pl-3">Offline </p>
	{/if}

	

	<!-- Bio -->
	<div class="card bg-base-100 card-sm shadow-md mb-3">
		<div class="card-body">
		  <h2 class="card-title">Bio</h2>
		  <p>{local_user?.bio}</p>
		</div>
	</div>	 

	<!-- Tags -->
	<div class="card bg-base-100 card-sm shadow-md mb-3">
		<div class="card-body">
		  <h2 class="card-title">Tags</h2>

		  <!-- Tag list-->
		  <div class="flex flex-wrap">
			{#if local_user}
				{#each local_user.tags as tag}
					<button class="badge badge-lg bg-pink-200 m-1">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
							<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
						</svg>
						{tag}
					</button>
				{/each}
			{/if}
		
		  </div>
		  
		</div>
	</div>

	<div class="inline-flex items-center justify-center w-full mb-5">
		<hr class="w-full h-[2px] bg-pink-200 border-0 rounded-sm">
		<div class="absolute px-4 -translate-x-1/2 bg-white left-1/2">
			<svg xmlns="http://www.w3.org/2000/svg" fill="pink" viewBox="0 0 24 24" stroke-width="1.5" stroke="pink" class="size-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
			  </svg>
		</div>
	</div>

	<!-- Open the modal using ID.showModal() method -->
	<button
	class="btn btn-error w-full"
	onclick={() => {
		const modal = document.getElementById('report_modal') as HTMLDialogElement | null;
		modal?.showModal();
	}}
	>
	Report user
	</button>

	<dialog id="report_modal" class="modal">
	<div class="modal-box">
		<h3 class="font-bold text-lg mb-3">Report user</h3>
		<textarea bind:value={report_text} class="textarea w-full resize-none" placeholder="Describe the report"></textarea>

		<div class="modal-action">
			<form method="dialog" onsubmit={submit_report}>
				<button class="btn btn-error">Submit</button>
			</form>
		</div>
	</div>


	<form method="dialog" class="modal-backdrop">
		<button>hidden close btn lol</button>
	</form>
		
	</dialog>
</div>
