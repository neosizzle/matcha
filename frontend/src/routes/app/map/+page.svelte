<script lang="ts">
    import '../../../app.css'
    // @ts-ignore
    import { LatLngExpression } from 'leaflet';
	import Leaflet from '$lib/Leaflet.svelte';
    import { onMount } from 'svelte';
    import Marker from '$lib/Marker.svelte';
  	import type { Location } from "../../../types/location";

    // variables
    let curr_location: Location | null = $state(null);
    let self_marker: LatLngExpression | null = $state(null);
    let markersReady = $state(false); // New flag to track when all markers are ready
    let nearbyUsers = $state<Array<{userId: string, location_auto_lat: number, location_auto_lon: number}>>([]);
    const payload = {
        method: 'GET',
        credentials: "include" as RequestCredentials,
    }
    const initialView: LatLngExpression = [3.140853, 101.686855];
    let markerLocations: Array<LatLngExpression> = $state([]);
    let mapReady = $state(false);
    let mapInitialized = $state(false);

    function handleMapInitialized() {
        mapInitialized = true;
    }

    onMount(() => {
        // Set a flag when component is mounted
        mapReady = true;
        
        if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(async (position) => {
				let response = await fetch(`http://localhost:3000/geo/coords?lat=${position.coords.latitude}&lon=${position.coords.longitude}`, payload);
				let body = await response.json();
				curr_location = body['data'] as Location;
                console.log("Current location from geolocation:", curr_location);
                
                // Set self marker position as soon as we get the location
                if (curr_location?.latitude && curr_location?.longitude) {
                    self_marker = [curr_location.latitude, curr_location.longitude] as LatLngExpression;
                    console.log("Self marker set to:", self_marker);
                    
                    // Fetch nearby users based on current location
                    try {
                        const nearbyResponse = await fetch(`http://localhost:3000/geo/nearby?lon=${curr_location.longitude}&lat=${curr_location.latitude}`, payload);
                        if (nearbyResponse.ok) {
                            const nearbyData = await nearbyResponse.json();
                            nearbyUsers = nearbyData.data || [];
                            console.log("Nearby users:", nearbyUsers);
                            
                            // Convert nearby users to marker locations
                            if (nearbyUsers && nearbyUsers.length > 0) {
                                markerLocations = nearbyUsers
                                    .filter(user => 
                                        user.location_auto_lat && user.location_auto_lon && 
                                        user.location_auto_lat >= -90 && user.location_auto_lat <= 90 &&
                                        user.location_auto_lon >= -180 && user.location_auto_lon <= 180
                                    )
                                    .map(user => {
                                        return [user.location_auto_lat, user.location_auto_lon] as LatLngExpression;
                                    });
                                console.log("Marker locations:", markerLocations);
                            }
                        } else {
                            let errorText = "";
                            try {
                                const errorData = await nearbyResponse.json();
                                errorText = errorData.detail || "Unknown error";
                            } catch {
                                errorText = await nearbyResponse.text();
                            }
                            console.error("Failed to fetch nearby users:", errorText);
                        }
                    } catch (error) {
                        console.error("Error fetching nearby users:", error);
                    }
                } else {
                    // If we get a response but no coordinates, use the raw coordinates from browser
                    self_marker = [position.coords.latitude, position.coords.longitude] as LatLngExpression;
                    console.log("Self marker set to browser coordinates:", self_marker);
                    
                    // Fetch nearby users based on browser coordinates
                    try {
                        const nearbyResponse = await fetch(`http://localhost:3000/geo/nearby?lon=${position.coords.longitude}&lat=${position.coords.latitude}`, payload);
                        if (nearbyResponse.ok) {
                            const nearbyData = await nearbyResponse.json();
                            nearbyUsers = nearbyData.data || [];
                            console.log("Nearby users from browser location:", nearbyUsers);
                            
                            // Convert nearby users to marker locations
                            if (nearbyUsers && nearbyUsers.length > 0) {
                                markerLocations = nearbyUsers
                                    .filter(user => 
                                        user.location_auto_lat && user.location_auto_lon && 
                                        user.location_auto_lat >= -90 && user.location_auto_lat <= 90 &&
                                        user.location_auto_lon >= -180 && user.location_auto_lon <= 180
                                    )
                                    .map(user => {
                                        return [user.location_auto_lat, user.location_auto_lon] as LatLngExpression;
                                    });
                                console.log("Marker locations from browser:", markerLocations);
                            }
                        } else {
                            let errorText = "";
                            try {
                                const errorData = await nearbyResponse.json();
                                errorText = errorData.detail || "Unknown error";
                            } catch {
                                errorText = await nearbyResponse.text();
                            }
                            console.error("Failed to fetch nearby users from browser location:", errorText);
                        }
                    } catch (error) {
                        console.error("Error fetching nearby users from browser location:", error);
                    }
                }
                
                // All markers are now ready (self marker and predefined markers)
                markersReady = true;
			}, (error) => {
                console.error("Geolocation error:", error);
                // For error case, we'll still show the map but without self marker
                // Try to get location from IP as a fallback
                fetchLocationFromIP();
            });
		} else {
			console.warn("Geolocation is not available in this browser");
            // For browsers without geolocation, try IP-based location
            fetchLocationFromIP();
		}
    });
    
    // Fallback to IP-based location if geolocation fails or is unavailable
    async function fetchLocationFromIP() {
        try {
            const response = await fetch(`http://localhost:3000/geo/ip`, payload);
            if (response.ok) {
                const data = await response.json();
                const ipLocation = data.data;
                
                if (ipLocation?.latitude && ipLocation?.longitude) {
                    self_marker = [ipLocation.latitude, ipLocation.longitude] as LatLngExpression;
                    console.log("Self marker set from IP:", self_marker);
                    
                    // Fetch nearby users based on IP location
                    try {
                        const nearbyResponse = await fetch(`http://localhost:3000/geo/nearby?lon=${ipLocation.longitude}&lat=${ipLocation.latitude}`, payload);
                        if (nearbyResponse.ok) {
                            const nearbyData = await nearbyResponse.json();
                            nearbyUsers = nearbyData.data || [];
                            console.log("Nearby users from IP location:", nearbyUsers);
                            
                            // Convert nearby users to marker locations
                            if (nearbyUsers && nearbyUsers.length > 0) {
                                markerLocations = nearbyUsers
                                    .filter(user => 
                                        user.location_auto_lat && user.location_auto_lon && 
                                        user.location_auto_lat >= -90 && user.location_auto_lat <= 90 &&
                                        user.location_auto_lon >= -180 && user.location_auto_lon <= 180
                                    )
                                    .map(user => {
                                        return [user.location_auto_lat, user.location_auto_lon] as LatLngExpression;
                                    });
                                console.log("Marker locations from IP:", markerLocations);
                            }
                        } else {
                            let errorText = "";
                            try {
                                const errorData = await nearbyResponse.json();
                                errorText = errorData.detail || "Unknown error";
                            } catch {
                                errorText = await nearbyResponse.text();
                            }
                            console.error("Failed to fetch nearby users from IP location:", errorText);
                        }
                    } catch (error) {
                        console.error("Error fetching nearby users from IP location:", error);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching IP location:", error);
        } finally {
            // Even if we fail to get location, we should still show the map
            markersReady = true;
        }
    }

    // This effect ensures the map updates when all components are ready
    $effect(() => {
        if (markersReady && mapInitialized) {
            console.log("All markers are ready and map is initialized");
        }
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
    
    :global(.background-green) {
        background: #4CAF50; /* Green color for self marker */
    }
</style>

<div class="map-wrapper">
    <h1 class="text-center text-2xl font-bold mb-4">Minor Finder</h1>
    {#if mapReady && markersReady}
        <Leaflet view={self_marker || initialView} zoom={13} on:mapInitialized={handleMapInitialized}>
            {#if mapInitialized}
                {#if self_marker}
                    <Marker latLng={self_marker} width={32} height={32}>
                        <div class="custom-marker">
                            <div class="marker-pin background-green"></div>
                        </div>
                    </Marker>
                {/if}
                {#each markerLocations as latLng, i}
                    <Marker {latLng} width={32} height={32}>
                        <div class="custom-marker">
                            <div class="marker-pin"></div>
                            <!-- <span class="marker-number">{i+1}</span> -->
                        </div>
                    </Marker>
                {/each}
            {/if}
        </Leaflet>
    {:else}
        <div class="flex items-center justify-center h-full">
            <p>Loading map and location data...</p>
        </div>
    {/if}
</div>
