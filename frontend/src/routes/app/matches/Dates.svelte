<script lang="ts">
	import { onMount } from "svelte";
	import { ToastType } from "../../../types/toast";
	import type { User } from "../../../types/user";
	import { deserialize_user_object, showToast } from "../../../utils/globalFunctions.svelte";
  	import Button from "../../../components/Button.svelte";
  import { user } from "../../../stores/globalStore.svelte";

	interface DateObject {
		datetime: number,
		details: string
	}

	interface Date {
		date: DateObject,
		user: User
	}

	function getCurrentDateTimeLocal(): string {
		const now = new Date();

		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}

	function formatTimestampToDate(timestamp: number) {
		const date = new Date(timestamp * 1000);

		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are 0-based, so add 1
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');

		return `${year}-${month}-${day}T${hours}:${minutes}`;
	}


	let dates_from_rest: Date[] = $state([])
	let matches_from_rest: User[] = $state([])

	let new_date_details: string = $state("")
	let new_date_user: string = $state("")
	let new_date_datetime: string = $state(getCurrentDateTimeLocal());

	let editing_date_details: string = $state("")
	let editing_date_user: string = $state("")
	let editing_date_user_name: string = $state("")
	let editing_date_datetime: string = $state(getCurrentDateTimeLocal());

	async function delete_date(user_id: string) {
		const payload = {
			method: 'DELETE',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
		}
		let fetch_res = await fetch('http://localhost:3000/dates/' + user_id, payload)
		let data = await fetch_res.json()
		let err_msg = data['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		showToast("Date deleted", ToastType.SUCCESS)
		dates_from_rest = dates_from_rest.filter((e) => e.user.id != user_id)
	}

	async function create_date(is_update: boolean) {
		let datetime_secs = new Date(new_date_datetime).getTime() / 1000;
		let user_id_2 = new_date_user
		let details = new_date_details

		if (is_update)
		{
			datetime_secs = new Date(editing_date_datetime).getTime() / 1000;
			user_id_2 = editing_date_user
			details = editing_date_details
		}

		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				"datetime": datetime_secs,
				user_id_2,
				details,
				is_update
			}),
		}
		let fetch_res = await fetch('http://localhost:3000/dates/', payload)
		let data = await fetch_res.json()
		let err_msg = data['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		if (is_update)
			showToast("Date updated", ToastType.SUCCESS)
		else
			showToast("Date created", ToastType.SUCCESS)

		if (!is_update)
		{
			const new_obj = {
				date: {
					datetime: datetime_secs,
					details
				},
				user: matches_from_rest.find((u) => u.id == user_id_2) as User
			}
			dates_from_rest = [...dates_from_rest, new_obj]
		}
		else {
			let dates_copy = [...dates_from_rest]
			let idx = dates_copy.findIndex((e) => e.user.id == user_id_2)
			const new_obj = {
				date: {
					datetime: datetime_secs,
					details
				},
				user: dates_copy[idx].user
			}
			dates_copy[idx] = new_obj
			dates_from_rest = dates_copy
		}
	}

	async function fetch_matches_rest() {
		const payload = {
			method: 'GET',
			credentials: "include" as RequestCredentials,
		}
		const response = await fetch("http://localhost:3000/matching/matches", payload);
		const body = await response.json();
		const err_msg = body['detail']
		if (err_msg)
		{
			showToast(err_msg, ToastType.ERROR)
			return []
		}
		return body['data'].map((e: {}) => deserialize_user_object(e))
	}

	async function fetch_dates_rest() {
		const payload = {
				method: 'GET',
				credentials: "include" as RequestCredentials,
			}
		const response = await fetch("http://localhost:3000/dates/all", payload);
		const body = await response.json();
		const err_msg = body['detail']
		if (err_msg)
		{
			showToast(err_msg, ToastType.ERROR)
			return []
		}
		const data = body['data']
		return data.map((e: {
			[index: string]: string;
		}) => {
			const user_deser = deserialize_user_object(JSON.parse(JSON.stringify(e['user'])))
			const date_deser = JSON.parse(JSON.stringify(e['date'])) as DateObject
			return {
				user: user_deser,
				date: date_deser
			}
		})
	}

	function open_edit_modal(datetime: string, user: string, username: string, details: string) {
		let modal_elem = document.getElementById('edit_date_modal') as HTMLDialogElement | null
		editing_date_datetime = datetime
		editing_date_user = user
		editing_date_user_name = username
		editing_date_details = details
		
		modal_elem?.showModal()
	}
	
	onMount(async () => { 
		dates_from_rest = await fetch_dates_rest()
		matches_from_rest = await fetch_matches_rest()
	})

</script>

<div>
	
	<Button onclick={()=>(document.getElementById('new_date_modal') as HTMLDialogElement | null)?.showModal()}>New date</Button>

	<dialog id="new_date_modal" class="modal" >
		<div class="modal-box">
		  <h3 class="text-lg font-bold">New date</h3>

		  <div class="mb-3 w-full">
			<p>User</p>
			<select class="select w-full" bind:value={new_date_user}>
				<option disabled selected={new_date_user == ""} >Pick a user</option>
				{#each matches_from_rest.filter((e) => !dates_from_rest.find(f => f.user.id == e.id)) as match}
					<option value={match.id} selected={match.id == new_date_user}>{match.displayname}</option>
				{/each}
			</select>
	
		  </div>
		  
		  <div class="mb-3 w-full">
			<p>Time</p>
			<input
			class="w-full"
			type="datetime-local"
			bind:value={new_date_datetime}
			min={getCurrentDateTimeLocal()}
			max="2030-06-14T00:00" />
		  </div>

		  <div class="mb-3 w-full">
			<p>Details</p>
			<textarea bind:value={new_date_details} class="textarea w-full resize-none" placeholder="Date details"></textarea>
		  </div>


		  <div class="modal-action">
			  <form method="dialog" onsubmit={() => create_date(false)}>
				  <button class="btn">Create date</button>
			  </form>
		  </div>

		</div>


		<form method="dialog" class="modal-backdrop">
		  <button>close</button>
		</form>
	</dialog>

	<dialog id="edit_date_modal" class="modal" >
		<div class="modal-box">
		  <h3 class="text-lg font-bold">Edit</h3>

		  <div class="mb-3 w-full">
			<p>User</p>
			<select disabled class="select w-full" bind:value={editing_date_user_name}>
				<option disabled selected={editing_date_user != ""} >{editing_date_user_name}</option>
			</select>
	
		  </div>
		  
		  <div class="mb-3 w-full">
			<p>Time</p>
			<input
			class="w-full"
			type="datetime-local"
			bind:value={editing_date_datetime}
			min={getCurrentDateTimeLocal()}
			max="2030-06-14T00:00" />
		  </div>

		  <div class="mb-3 w-full">
			<p>Details</p>
			<textarea bind:value={editing_date_details} class="textarea w-full resize-none" placeholder="Date details"></textarea>
		  </div>


		  <div class="modal-action">
			  <form method="dialog" onsubmit={() => create_date(true)}>
				  <button class="btn">Edit date</button>
			  </form>
		  </div>

		</div>


		<form method="dialog" class="modal-backdrop">
		  <button>close</button>
		</form>
	</dialog>

	<div class="pt-3 min-h-[90vh]">
		{#each dates_from_rest as date}
			<div class="card bg-base-100 card-xl shadow-sm mb-3">
				<figure class="px-5 pt-5">
					<img
					  src={`http://localhost:3000/${date.user.images[0]}`}
					  alt="profile"
					  class="rounded-xl" />
				  </figure>

				<div class="card-body">
					<h2 class="card-title">{date.user.displayname}</h2>
					<p>{(new Date(date.date.datetime * 1000)).toLocaleString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
						hour12: true
					  })}</p>
					<p>{date.date.details}</p>
					<div class="justify-end card-actions">
						<button class="btn btn-error btn-outline" onclick={() => delete_date(date.user.id)}>Delete date</button>
						<button class="btn btn-outline"
						onclick={() => open_edit_modal(formatTimestampToDate(date.date.datetime), date.user.id, date.user.displayname, date.date.details)}
						>Edit date</button>

					</div>
				</div>
			</div>
		{/each}
		
	</div>
</div>