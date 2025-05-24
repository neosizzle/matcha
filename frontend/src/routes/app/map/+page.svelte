<script lang="ts">
    import '../../../app.css'
    // @ts-ignore
    import { LatLngExpression } from 'leaflet';
	import Leaflet from '$lib/Leaflet.svelte';
    import { onMount } from 'svelte';
    import Marker from '$lib/Marker.svelte';

    const initialView: LatLngExpression = [3.140853, 101.686855];
    const markerLocations: Array<LatLngExpression> = [
        [3.140853, 101.686855], // Example marker location
        [3.139, 101.685], // Another example nearby
        [3.142, 101.688] // Another example nearby
    ];
    let mapReady = $state(false);
    let mapInitialized = $state(false);

    function handleMapInitialized() {
        mapInitialized = true;
    }

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
    
    /* Custom marker styling */
    :global(.custom-marker) {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    
    :global(.marker-pin) {
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background: #ff5252;
        position: absolute;
        transform: rotate(-45deg);
        left: 50%;
        top: 50%;
        margin: -15px 0 0 -15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    
    :global(.marker-pin::after) {
        content: '';
        width: 20px;
        height: 20px;
        margin: 5px 0 0 5px;
        background: #fff;
        position: absolute;
        border-radius: 50%;
    }
    
    :global(.marker-number) {
        position: relative;
        z-index: 1;
        color: #000;
        font-weight: bold;
        font-size: 12px;
    }
</style>

<h1 class="text-center text-2xl font-bold mb-4">Minor Radar</h1>
<div class="map-wrapper">
    {#if mapReady}
        <Leaflet view={initialView} zoom={13} on:mapInitialized={handleMapInitialized}>
            {#if mapInitialized}
                {#each markerLocations as latLng, i}
                    <Marker {latLng} width={32} height={32}>
                        <div class="custom-marker">
                            <div class="marker-pin"></div>
                            <span class="marker-number">{i+1}</span>
                        </div>
                    </Marker>
                {/each}
            {/if}
        </Leaflet>
    {:else}
        <div class="flex items-center justify-center h-full">
            <p>Loading map...</p>
        </div>
    {/if}
</div>
