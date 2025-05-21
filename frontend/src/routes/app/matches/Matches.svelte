<script lang="ts">
  import { onDestroy } from "svelte";
	import UserSearchSkeleton from "../../../components/UserSearchSkeleton.svelte";
	import { notification_pool } from "../../../stores/globalStore.svelte";
	import { ToastType } from "../../../types/toast";
	import type { NotificationObj } from "../../../types/ws";
	import { deserialize_user_object, not_w_filter, showToast } from "../../../utils/globalFunctions.svelte";

	let local_noti_pool: NotificationObj[] = $state([]);
	notification_pool.subscribe(e => local_noti_pool = e)

	let matched_users = $derived.by(() => {
		async function promise() {
			console.log("running promimse")
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
			const matches_from_rest = body['data']
			const inter = local_noti_pool.filter(e => e.type == "notify_match")
			const matches_from_ws = inter.map((e) => deserialize_user_object(JSON.parse(JSON.stringify(e.data))))
			const res = [...new Map([...matches_from_rest, ...matches_from_ws].map(x => [x.id, x])).values()] 
			return res;
		}

		return promise()
	})

	// on destroy, delete all match related notifications
	// in pool and consume persistent notifications
	onDestroy(async () => {
		notification_pool.update(e => {
			let res = e.filter(x => x.type != "notify_match")
			return res
		})

		try {
			await not_w_filter("notify_match", true)
		} catch (error) {
			console.log(error)
		}		
	})

</script>

<div>
	{#await matched_users}
		<UserSearchSkeleton/>
	{:then items}
		<div>
			{#if items.length == 0}
				<div class="h-[100vh] flex justify-center items-center">
					<h1 class="text-center">
						No users
					</h1>
				</div>

				{:else}
					{#each items as user (user.id)}
						<div>
							{user.id}
						</div>
					{/each}
			{/if}
		</div>
	{:catch reason}
		<span>Oops! - {reason}</span>
	{/await}

</div>