let map;
let markers = [];

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 1.2839, lng: 103.8607}, // default location, marina bay
    zoom: 13,
    fullscreenControl: false,
    streetViewControl: false,
  });

  let input = document.getElementById('pac-input');

  // map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);

  let autocomplete = new google.maps.places.Autocomplete(input);

  // Set the data fields to return when the user selects a place.
  autocomplete.setFields(
      ['address_components', 'geometry', 'icon', 'name']);

  var infowindow = new google.maps.InfoWindow();
  var infowindowContent = document.getElementById('infowindow-content');
  infowindow.setContent(infowindowContent);
  var marker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29)
  });

  // If user selects one of the locations in the autocomplete UI
  autocomplete.addListener('place_changed', function() {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    // If the place has a location, then update map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17); // Apparently it looks better
    }
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

    infowindowContent.children['place-icon'].src = place.icon;
    infowindowContent.children['place-name'].textContent = place.name;
    infowindowContent.children['place-address'].textContent = address;
    infowindow.open(map, marker);
  });


  document.getElementById("submit-button").addEventListener("click", function(){
    clearMarkers();
    var place = autocomplete.getPlace();
    if (!place || !place.geometry) {
      // User clicked submit without choosing a field from autocomplete
      // or entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("Please enter a valid location!");
      return;
    }

    var url = new URL('/places-list', window.location.origin),
        params = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          filter: getDieteryRestrictions()
        }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    fetch(url).then((response => {
      response.json().then((data) => {
        getRandomRestaurant(data.results);
      })
    }))
  });
}

let selectedElement;
let selectedIndex;

function getRandomRestaurant(restaurants) {

  console.log(restaurants);

  // Pick a random restaurant.
  // const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];

  // Add it to the page.
  // const resElement = document.getElementById('restaurant-name');
  // resElement.innerHTML = "<p>" + restaurant.name + "</p><p>" + JSON.stringify(restaurant.geometry.location) + "</p>";


  let resListElement = document.getElementById("restaurant-list");
  resListElement.innerHTML = '';
  for(let index in restaurants) {
    const { geometry: {location}, placeId, name, photos, rating } = restaurants[index];
    const photoReference = photos[0].photoReference;

    const resElement = document.createElement('li');

    const nameElement = document.createElement('h3');
    nameElement.innerHTML = name;
    resElement.appendChild(nameElement);
    resElement.id = placeId;

    // const ratingElement = document.createElement('p');
    // ratingElement.innerHTML = rating;
    // resElement.appendChild(ratingElement);

    // if(photoReference) {
    //   const imgElement = document.createElement('img');
    //   imgElement.src = "https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference="
    //       + photoReference + "&key=AIzaSyCN-bDjEE_TtP8Md5Mm7RIdhpc6v9h3QoQ";
    //   resElement.appendChild(imgElement);
    // }

    resListElement.appendChild(resElement);

    resElement.addEventListener('click', function() {
      map.panTo(location);
      map.setZoom(18);

      selectedElement && selectedElement.classList.remove("selected");
      this.classList.add("selected");
      selectedElement = this;

      selectedIndex && markers[selectedIndex].setIcon("http://maps.google.com/mapfiles/ms/icons/blue-dot.png");
      markers[index].setIcon("http://maps.google.com/mapfiles/ms/icons/orange-dot.png");
      selectedIndex = index;
    });

    let restaurantMarker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29),
      position: location,
      title: name,
      icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      }
    });
    markers.push(restaurantMarker);
  }
}

function clearMarkers() {
  console.log('delete');
  for(let i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
  selectedElement = null;
  selectedIndex = null;
}

function getDieteryRestrictions() {
   const filterForm = document.getElementsByName('restaurant-filter');
   for (let filter of filterForm) {
     if (filter.checked) {
       return filter.value;
     }
   }
   return null;
}

const filterButtons = document.getElementsByName("restaurant-filter");
var currentFilter;

// Clicking checked button will make it unchecked
for (let button of filterButtons) {
    button.addEventListener('click', function(){
      if (currentFilter == button ) {
        button.checked = false;
        currentFilter = null;
      } else {
        currentFilter = button;
      }
    });
}
