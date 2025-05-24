<script lang="ts">
    import '../../../app.css'
    // @ts-ignore
    import { LatLngExpression } from 'leaflet';
	import Leaflet from '$lib/Leaflet.svelte';
    import { onMount } from 'svelte';

    const initialView: LatLngExpression = [3.140853, 101.686855];
    let mapReady = $state(false);

    onMount(() => {
        // Set a flag when component is mounted
        mapReady = true;
    });
</script>

<style>
    .map-wrapper {
        width: 100%;
        height: calc(100vh - 60px); /* Adjust height to account for footer/header */
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: hidden; /* Prevent overflow issues */
        isolation: isolate; /* Create stacking context */
        z-index: 1; /* Ensure proper stacking context */
    }
    
    /* Ensure the map container takes full space */
    :global(.map-wrapper > div) {
        flex: 1;
        min-height: 0; /* Important for flexbox to work properly */
    }
</style>

<div class="map-wrapper">
    {#if mapReady}
        <Leaflet view={initialView} zoom={13} />
    {:else}
        <div class="flex items-center justify-center h-full">
            <p>Loading map...</p>
        </div>
    {/if}
</div>
