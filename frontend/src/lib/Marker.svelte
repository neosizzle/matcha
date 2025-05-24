<script lang="ts">
	import { onMount, onDestroy, getContext, setContext, tick } from 'svelte';
	import L from 'leaflet';
	import './markers.css';

	export let width: number = 25;
	export let height: number = 41;
	export let latLng: L.LatLngExpression;
	export let iconUrl: string = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
	export let iconSize: [number, number] = [width, height];

	let marker: L.Marker | undefined;
	let markerElement: HTMLElement;

	const { getMap }: { getMap: () => L.Map | undefined } = getContext('map');
	const map = getMap();

	setContext('layer', {
		// L.Marker inherits from L.Layer
		getLayer: () => marker
	});

	onMount(async () => {
		// Wait for DOM to render
		await tick();
		
		if (map) {
			// Option 1: Use a standard Leaflet icon (fallback)
			const defaultIcon = L.icon({
				iconUrl: iconUrl,
				iconSize: iconSize,
				iconAnchor: [iconSize[0]/2, iconSize[1]],
				popupAnchor: [0, -iconSize[1]]
			});
			
			// Create the marker with default icon
			marker = L.marker(latLng, { icon: defaultIcon }).addTo(map);
			
			// Option 2: If we have custom content, update to a divIcon
			if (markerElement && markerElement.children.length > 0) {
				setTimeout(() => {
					if (marker && markerElement) {
						const customIcon = L.divIcon({
							html: markerElement.cloneNode(true) as HTMLElement,
							className: 'custom-map-marker',
							iconSize: L.point(width, height),
							iconAnchor: [width/2, height]
						});
						
						// Update marker with custom icon
						marker.setIcon(customIcon);
					}
				}, 0);
			}
		}
	});

	onDestroy(() => {
		marker?.remove();
		marker = undefined;
	});
</script>

<style>
	.marker-content {
		position: relative;
		width: 100%;
		height: 100%;
		display: none; /* Hide the actual content element */
	}
	
	:global(.custom-map-marker) {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
	}
</style>

<div bind:this={markerElement} class="marker-content">
	<slot>
		<!-- Default marker content if no slot content provided -->
		<div style="width: {width}px; height: {height}px; background-color: red; border-radius: 50%;"></div>
	</slot>
</div>