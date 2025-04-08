<script lang=ts>
import { toasts } from "../stores/globalStore.svelte"
import type { ToastElement } from "../types/toast";

let localToastList: ToastElement[] = []

let toastsUnsub = toasts.subscribe((e) => localToastList = e)

// Automatically remove toast after a set time
$: {
    localToastList.forEach((toast, index) => {
      setTimeout(() => {
        toasts.update((t) => t.filter((_, i) => i !== index));
      }, toast.duration);
    });
}

</script>

<style>
	.toast-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 9999;
	}

	.toast {
		background: #333;
		color: #fff;
		padding: 10px 20px;
		margin: 5px;
		border-radius: 5px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
		opacity: 0.9;
		transition: opacity 0.3s;
	}
</style>

<div class="toast-container">
	{#each localToastList as toast, index (toast.id)}
		<div class="toast">
		<p>{toast.message}</p>
		</div>
	{/each}
</div>