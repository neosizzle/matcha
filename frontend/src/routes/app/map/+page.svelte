<script lang="ts">
    import '../../../app.css'
    // @ts-ignore
    import { LatLngExpression } from 'leaflet';
	import Leaflet from '$lib/Leaflet.svelte';

    const initialView: LatLngExpression = [3.140853, 101.686855];
</script>

<!-- <div class="flex justify-center w-full">
    <div class="relative">
    </div>
</div> -->
<div class="w-full min-h-screen">
    <h1 class="text-3xl font-bold">Map</h1>
    <p class="text-gray-500">This is a map page.</p>
    <div class="h-[750px]">
        <Leaflet view={initialView} zoom={13} />
    </div>
</div>

