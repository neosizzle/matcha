<script lang="ts">
    import { ToastType } from "../../../types/toast";
    import { Gender, type User } from "../../../types/user";
    import { deserialize_user_object, showToast } from "../../../utils/globalFunctions.svelte";
    import UserSearchSkeleton from "../../../components/UserSearchSkeleton.svelte";
    import { goto } from "$app/navigation";

	let removed_user_ids: string[] = $state([])
	
	async function fetch_blocks_rest() : Promise<User[]> {
		const payload = {
			method: 'GET',
			credentials: "include" as RequestCredentials,
		}
		const response = await fetch("http://localhost:3000/users/blocks", payload);
		const body = await response.json();
		const err_msg = body['detail']
		if (err_msg)
		{
			showToast(err_msg, ToastType.ERROR)
			return [] as User[]
		}
		return body['data'].map((e: {}) => deserialize_user_object(e)) as User[]
	}

	async function unblock_user(user_id: string) {
		const payload = {
			method: 'POST',
			credentials: "include" as RequestCredentials,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				user_id,
			}),
		}
		let fetch_res = await fetch('http://localhost:3000/users/unblock', payload)
		let data = await fetch_res.json()
		let err_msg = data['detail']
		if (err_msg)
			return showToast(err_msg, ToastType.ERROR)
		showToast("User unblocked", ToastType.SUCCESS)

		removed_user_ids = [...removed_user_ids, user_id]
	}

</script>


<div class="mt-3">
	{#await fetch_blocks_rest()}
		<UserSearchSkeleton/>
	{:then items}
		<div class="min-h-[90vh]">
			{#if items.length == 0}
				<div class="flex justify-center items-center">
					<h1 class="text-center">
						No users
					</h1>
				</div>

				{:else}
					<!--Unblock-->
					{#each items.filter((e) => !removed_user_ids.includes(e.id)) as user (user.id)}
					<div class="flex items-center shadow-sm px-2 py-3 mb-3 rounded">
						<button class="avatar cursor-pointer" onclick={() => {goto(`/app/stalk/${user.id}`)}}>
							<div class="w-10 rounded-full mr-5">
								<img alt='profile' src={`http://localhost:3000/${user.images[0]}`} />
							</div>
						</button>

						<div class="text-lg mr-1">
							{user.displayname}
						</div>

						{#if user.gender == Gender.FEMALE}
						<div class="badge badge-sm bg-pink-300">
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="white" class="" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 5a5 5 0 1 1 5.5 4.975V12h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0V13h-2a.5.5 0 0 1 0-1h2V9.975A5 5 0 0 1 3 5"/>
							</svg>
						</div>
						{:else if user.gender == Gender.MALE}
						<div class="badge badge-sm bg-blue-300">
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="white" class="white" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M9.5 2a.5.5 0 0 1 0-1h5a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0V2.707L9.871 6.836a5 5 0 1 1-.707-.707L13.293 2zM6 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8"/>
							</svg>
						</div>
						{:else}
						<div class="badge badge-sm bg-gray-300">
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-gender-ambiguous" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M11.5 1a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V1.707l-3.45 3.45A4 4 0 0 1 8.5 10.97V13H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V14H6a.5.5 0 0 1 0-1h1.5v-2.03a4 4 0 1 1 3.471-6.648L14.293 1zm-.997 4.346a3 3 0 1 0-5.006 3.309 3 3 0 0 0 5.006-3.31z"/>
							</svg>
						</div>
						{/if}

						<div class="dropdown dropdown-end ml-auto">
							<div tabindex="0" role="button" class="btn btn-ghost btn-square m-1">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
									<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
								  </svg>								  
							</div>
							<ul class="dropdown-content menu bg-white rounded-box z-1 w-20 p-2 shadow-sm">
							  <button onclick={() => unblock_user(user.id)} class="mb-2 cursor-pointer hover:bg-gray-100 rounded-sm py-2">Unblock</button>
							</ul>
						</div>
				
					</div>
					{/each}
			{/if}
		</div>
	{:catch reason}
		<span>Oops! - {reason}</span>
	{/await}

</div>