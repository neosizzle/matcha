<script lang=ts>
import { toasts } from "../stores/globalStore.svelte"
import { ToastType, type ToastElement } from "../types/toast";

let localToastList: ToastElement[] = []

let toastsUnsub = toasts.subscribe((e) => localToastList = e)

// Automatically remove toast after a set time
$: {
    localToastList.forEach((toast, index) => {
      setTimeout(() => {
		toasts.update((t) => t.filter((ct, _) => ct.id !== toast.id));
      }, toast.duration);
    });

}

</script>


<div class="fixed px-10 top-[20px] z-10 w-full sm:w-md">
	{#each localToastList as toast, index (toast.id)}
		<div class="animate-jump-in animate-duration-[400ms]">
			<div class="
			w-full px-5 py-2.5 mb-2 rounded-sm shadow-md animate-jump-out animate-delay-[3000ms] animate-duration-[400ms]
			{
			toast.type == ToastType.SUCCESS?
			'bg-white text-green-600 border-1':
			toast.type == ToastType.ERROR?
			'bg-white text-red-600 border-1':
			toast.type == ToastType.HAPPY?
			'bg-pink-400 text-white border-1':
			'bg-gray-500 text-white'
			}
			
			">
			<div class="flex items-center">
				{#if toast.type == ToastType.SUCCESS}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 inline mr-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
				  </svg>
				{:else if toast.type == ToastType.ERROR}
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 inline mr-4">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
					</svg>
				{:else if toast.type == ToastType.HAPPY}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 inline mr-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
				</svg>
				{:else}
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6 inline mr-4">
					<path stroke-linecap="round" stroke-linejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
				  </svg>
				{/if}
				  
				{toast.message}
			</div>
			</div>
		</div>
	{/each}
</div>