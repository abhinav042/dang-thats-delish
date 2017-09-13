import axios from "axios";
import { $ } from "./bling";

const mapOptions = {
	center: {lat: 43.2, lng: -79.8},
	zoom: 10
};

function loadPlaces(map, lat=43.2, lng=-79.8) {
	axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
		.then(res => {
			const places = res.data;
			if (!places.length) {
				alert("no places found near your location");
				return;
			}

			// create a bounds to center our data
			const bounds = new google.maps.LatLngBounds();
			// create an info window
			const infoWindow = new google.maps.InfoWindow();
			// creating the markers
			const markers = places.map(place => {
				const [placeLng, placeLat] = place.location.coordinates;
				const position = {lat: placeLat, lng: placeLng};
				// re-positioning the marker
				bounds.extend(position); 
				map.setCenter(bounds.getCenter());
				map.fitBounds(bounds);
				const marker = new google.maps.Marker({
					map,
					position
				});
				marker.place = place;
				return marker;
			});

			// when someone clicks the marker, show details of the place
			markers.forEach(marker => marker.addListener("click", function() {
				const html = `
					<div class="popup">
						<a href="/store/${this.place.slug}">
							<img src="/uploads/${this.place.photo || "store.png"}" alt="${this.place.name}"/>
							<p>${this.place.name} - ${this.place.location.address}</p>
						</a>
					</div>
				`
				infoWindow.setContent(html);
				infoWindow.open(map, this);
			}));
		});
}

function makeMap(mapDiv) {
	if(!mapDiv) return;
	// print out the map in the div
	const map = new google.maps.Map(mapDiv, mapOptions);
	// load places on the map
	loadPlaces(map);
	const input = $("[name='geolocate']");
	const autocomplete = new google.maps.places.Autocomplete(input);
	autocomplete.addListener("place_changed", () => {
		const place = autocomplete.getPlace();
		loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
	});
};

export default makeMap;