<script lang="ts">
    import Button from "../../../components/Button.svelte";
	import { user as glob_user } from "../../../stores/globalStore.svelte"
	import type { User } from "../../../types/user";

	let local_user: User | null = null; 
	glob_user.subscribe(e => local_user = e)


</script>

<div>

	<!--Main header-->
	<div class="flex justify-center w-full">
		<div class="relative">
			<!-- gender, name, age, location display -->
			<div class="absolute p-4 bottom-0 left-0">
				<div class="flex items-center">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="pink" class="" viewBox="0 0 16 16">
						<path fill-rule="evenodd" d="M8 1a4 4 0 1 0 0 8 4 4 0 0 0 0-8M3 5a5 5 0 1 1 5.5 4.975V12h2a.5.5 0 0 1 0 1h-2v2.5a.5.5 0 0 1-1 0V13h-2a.5.5 0 0 1 0-1h2V9.975A5 5 0 0 1 3 5"/>
					</svg>
					<span class="pl-[3px] text-lg font-semibold"> Name here, 21</span>
				</div>
				<div class="max-w-48"> 
					Address, asdsadsa sd sad sa, sadasd 
				</div>
			</div>

			<!-- fame rating display -->
			<div class="absolute p-4 bottom-0 right-0 flex">
				<svg xmlns="http://www.w3.org/2000/svg" fill="yellow" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-6">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
				</svg>
				2134
			</div>

			<div class="carousel rounded-box carousel-vertical	w-[90vw] sm:w-[50vw] h-96 sm:h-120 mb-3">
				<div class="carousel-item h-full w-full bg-cover bg-center bg-[url(https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.webp)]">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="red" class="size-6 ml-auto my-3 mr-3 cursor-pointer" on:click={() => {}}>
						<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
					</svg>					  
				</div>

				<div class="carousel-item h-full w-full bg-cover bg-center bg-[url(https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp)]">
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="red" class="size-6 ml-auto my-3 mr-3 cursor-pointer" on:click={() => {}}>
						<path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
					</svg>	
				</div>


				<div class="carousel-item h-full block">
					<div class="w-full h-full  bg-radial from-pink-200 to-white flex justify-center items-center">
						<div class="flex flex-col">
							<Button> Add image </Button>
							<div class="w-50 text-center m-2">You need to have at least 1 image to start matching</div>
						</div>
					</div>
				</div>

			  </div>
		</div>

	</div>

	<!-- Basic info -->
	<div class="card bg-base-100 card-sm shadow-md mb-3">
		<div class="card-body">
			<h2 class="card-title">Basic Info</h2>
			<fieldset class="fieldset mb-1">
				<legend class="fieldset-legend">Display name</legend>
				<input type="text" class="input input-ghost input-error" placeholder="What is your display name?" />
			</fieldset>
			
			<fieldset class="fieldset mb-1">
				<legend class="fieldset-legend">Birthday</legend>
				<input type="date" class="input input-ghost"/>
			</fieldset>

			<fieldset class="fieldset mb-1">
				<legend class="fieldset-legend">Gender</legend>
					<select  class="select select-ghost">
						<option value="nb" selected>Non binary</option>
						<option value="f">Female</option>
						<option value="m">Male</option>
					</select>
			</fieldset>
		</div>
	</div>	  

	<!-- Bio -->
	<div class="card bg-base-100 card-sm shadow-md mb-3">
		<div class="card-body">
		  <h2 class="card-title">Bio</h2>
		  <textarea class="textarea textarea-ghost" placeholder="Dox yourself"></textarea>
		</div>
	</div>	 

	<!-- Tags -->
	<div class="card bg-base-100 card-sm shadow-md mb-3">
		<div class="card-body">
		  <h2 class="card-title">Tags</h2>
		  
		  <div class="join w-full">
			<div class="w-full">
			  <label class="input join-item">
				<input type="text" placeholder="Enter a new tag" />
			  </label>
			  <div class="fieldset-label text-white">Enter valid email address</div>
			</div>
			<Button customClass="join-item h-10">Add</Button>
		  </div>

		  <!-- Tag list-->
		  <div class="flex flex-wrap">
			<div class="cursor-pointer badge badge-lg bg-pink-200 m-1">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
				  </svg>
				Bkb
			</div>
			<div class="cursor-pointer badge badge-lg bg-pink-200 m-1">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
				  </svg>
				Bkb
			</div>
			<div class="cursor-pointer badge badge-lg bg-pink-200 m-1">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
				  </svg>
				Bkbasdsadas
			</div>
			<div class="cursor-pointer badge badge-lg bg-pink-200 m-1">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
				  </svg>
				Bkbsss
			</div>
			<div class="cursor-pointer badge badge-lg bg-pink-200 m-1">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
				  </svg>
				Bkbasdsad
			</div>
			<div class="cursor-pointer badge badge-lg bg-pink-200 m-1">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-[1em]">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
				  </svg>
				Bkb
			</div>
		  </div>
		  <p> Click on a tag to delete it </p>
		  
		</div>
	</div>

	<div class="flex justify-center mb-3 px-0 sm:px-10">
		<Button customClass="w-full">Save changes</Button>
	</div>

	<div class="inline-flex items-center justify-center w-full mb-5">
		<hr class="w-full h-[2px] bg-pink-200 border-0 rounded-sm">
		<div class="absolute px-4 -translate-x-1/2 bg-white left-1/2">
			<svg xmlns="http://www.w3.org/2000/svg" fill="pink" viewBox="0 0 24 24" stroke-width="1.5" stroke="pink" class="size-6">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
			  </svg>
		</div>
	</div>

	<div class="px-2">
		
		<!--Auto location-->
		<div class="flex justify-between mb-2">
			<div>Auto Location</div>
			<div>
				<input type="checkbox" class="toggle checked:border-pink-300 checked:text-pink-400" />
			</div>
		</div>

		<!--Manual location-->
		<div class="flex justify-between items-center mb-2">
			<div class="w-10 sm:w-full">Manual Location</div>
			<div>
				<select disabled={false} class="select border-pink-300 sm:w-60">
					<option disabled selected>Pick a location</option>
					<option value="1">Crimson</option>
					<option value="2">Amber</option>
					<option value="3">Velvet</option>
				  </select>
			</div>
		</div>

		<!--Verify email-->
		<div class="flex justify-between items-center mb-2">
			<div class="">Verify email</div>
			<div>
				<Button isLoading customClass="w-full">Verify</Button>
			</div>
		</div>

		<!--change email-->
		<div class="flex justify-between items-center mb-2">
			<div class="">Email</div>
			<div class="w-35 sm:w-auto">
				<label class="input validator">
					<svg class="h-[1em] opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" fill="none" stroke="currentColor"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></g></svg>
					<input type="email" placeholder="a@mail.com" required />
				</label>
				<div class="validator-hint hidden">Enter valid email address</div>
			</div>
		</div>

		<!-- Logout -->
		<button class="btn btn-error btn-outline mb-3">Log out</button>

		<div class="px-0 sm:px-3">
			<Button customClass="w-full">Save settings</Button>
		</div>


	</div>
</div>
