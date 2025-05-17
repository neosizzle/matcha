<script lang="ts">
	import { onMount, onDestroy, setContext, createEventDispatcher, tick } from 'svelte';
    // @ts-ignore
    import L from 'leaflet';
	import 'leaflet/dist/leaflet.css';

    export let bounds: L.LatLngBoundsExpression | undefined = undefined;
	export let view: L.LatLngExpression | undefined = undefined;
	export let zoom: number | undefined = undefined;

	let map: L.Map | undefined;
	let mapElement: HTMLElement;

	onMount(() => {
		map = L.map(mapElement);

        // so we dont get sued
		L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
			attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,&copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`
		}).addTo(map);
	});

	onDestroy(() => {
		map?.remove();
		map = undefined;
	});

    setContext('map', {
		getMap: () => map
	});

    $: if (map) {
		if (bounds) {
			map.fitBounds(bounds);
		} else if (view && zoom) {
			map.setView(view, zoom);
		}
	}
</script>

<div class="w-full h-full" bind:this={mapElement}>
    <slot />
</div>