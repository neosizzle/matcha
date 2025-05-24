<script lang="ts">
	import { onMount, onDestroy, setContext, createEventDispatcher, tick } from 'svelte';
    // @ts-ignore
    import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';
    import './leaflet.css'; // Import our custom CSS overrides
    
    const dispatch = createEventDispatcher();

    // Fix Leaflet's icon paths for webpack
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    export let bounds: L.LatLngBoundsExpression | undefined = undefined;
	export let view: L.LatLngExpression | undefined = undefined;
	export let zoom: number | undefined = undefined;

	let map: L.Map | undefined;
	let mapElement: HTMLElement;

	onMount(async () => {
		try {
			// Wait for the DOM to be fully rendered
			await tick();
			
			if (!mapElement) {
				console.error('Map element not found');
				return;
			}
			
			// Initialize the map with specific options
			map = L.map(mapElement, {
				zoomControl: false, // Disable default zoom control, we'll add our own
				attributionControl: true
			});

			// Add custom zoom control with specific positioning
			L.control.zoom({
				position: 'topright',
				zoomInTitle: 'Zoom in',
				zoomOutTitle: 'Zoom out'
			}).addTo(map);

			// Add tile layer
			L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
				attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,&copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
				subdomains: 'abcd',
				maxZoom: 19
			}).addTo(map);
			
			// Set view after map is initialized
			if (bounds) {
				map.fitBounds(bounds);
			} else if (view && zoom) {
				map.setView(view, zoom);
			} else {
				// Default view if none provided
				map.setView([0, 0], 2);
			}
			
			// Force a redraw after initialization
			setTimeout(() => {
				map?.invalidateSize();
				// Dispatch an event to notify that the map is fully initialized
				dispatch('mapInitialized', { map });
			}, 100);
			
		} catch (error) {
			console.error('Error initializing map:', error);
		}
	});

	onDestroy(() => {
		map?.remove();
		map = undefined;
	});

    setContext('map', {
		getMap: () => map
	});

    $: if (map && map.getContainer()) {
		if (bounds) {
			map.fitBounds(bounds);
		} else if (view && zoom) {
			map.setView(view, zoom);
		}
		// Force a re-render of the map
		map.invalidateSize();
	}
</script>

<style>
    .map-container {
        width: 100%;
        height: 100%;
        position: relative;
        isolation: isolate; /* Creates a new stacking context */
    }
    
    :global(.leaflet-container) {
        width: 100%;
        height: 100%;
        position: relative;
        z-index: 1;
    }
    
    /* Ensure the zoom controls are visible and interactive */
    :global(.leaflet-control-zoom) {
        background-color: white;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
    }
    
    :global(.leaflet-control-zoom a) {
        width: 30px;
        height: 30px;
        line-height: 30px;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-decoration: none;
        color: #333;
        font-weight: bold;
    }
    
    :global(.leaflet-control-zoom-in) {
        border-bottom: 1px solid #ccc;
    }
</style>

<div class="map-container" bind:this={mapElement}>
    <slot />
</div>