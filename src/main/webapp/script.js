let map;
let markers = [];

const blueIconUrl = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
const orangeIconUrl = "https://maps.google.com/mapfiles/ms/icons/orange-dot.png";

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

  let infowindow = new google.maps.InfoWindow();
  let infowindowContent = document.getElementById('infowindow-pac-content');
  infowindow.setContent(infowindowContent);
  let marker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29)
  });

  // If user selects one of the locations in the autocomplete UI
  autocomplete.addListener('place_changed', function() {
    infowindow.close();
    marker.setVisible(false);
    let place = autocomplete.getPlace();
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
    let place = autocomplete.getPlace();
    if (!place || !place.geometry) {
      // User clicked submit without choosing a field from autocomplete
      // or entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("Please enter a valid location!");
      return;
    }
    resizeNavButton();
    const url = new URL('/places-list', window.location.origin),
          params = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            filter: getDieteryRestrictions()
          }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(url).then((response => {
      response.json().then((data) => {
        updateRestaurantList(data.results);
      })
    }))
  });
}

let selectedElement;
let selectedIndex;

function updateRestaurantList(restaurants) {
  let resContainerElement = document.getElementById("result-container");
  resContainerElement.style.display = "block";

  let resListElement = document.getElementById("restaurant-list");
  resListElement.innerHTML = '';

  if(restaurants.length == 0) {
    resListElement.innerHTML = "No restaurant found.";
  }

  for(let index in restaurants) {
    const { geometry: {location}, placeId, name, photos, rating } = restaurants[index];

    const resElement = document.createElement('li');

    const nameElement = document.createElement('h3');
    nameElement.innerHTML = name;
    resElement.appendChild(nameElement);
    resElement.id = placeId;

    // const ratingElement = document.createElement('p');
    // ratingElement.innerHTML = rating;
    // resElement.appendChild(ratingElement);

    if(photos) {
      const photoReference = photos[0].photoReference;
      const url = new URL('/places-photo', window.location.origin),
        params = {
          photoRef: photoReference
        }
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      const imgElement = document.createElement('img');
      imgElement.src = url;
      imgElement.onerror = function() {
        this.onerror = null;
        this.src = '';
      }
      resElement.appendChild(imgElement);
    }

    resListElement.appendChild(resElement);

    resElement.addEventListener('click', function() {
      map.panTo(location);
      map.setZoom(18);

      updateRestaurantInfo(restaurants[index], markers[index]);
      selectedElement.classList.remove("selected");
      this.classList.add("selected");
      selectedElement = this;

      markers[selectedIndex].setIcon(blueIconUrl);
      markers[index].setIcon(orangeIconUrl);
      selectedIndex = index;
    });

    let restaurantMarker = new google.maps.Marker({
      map: map,
      anchorPoint: new google.maps.Point(0, -29),
      position: location,
      title: name,
      icon: {
        url: blueIconUrl
      }
    });

    markers.push(restaurantMarker);

    if(index == 0) {
      selectedIndex = 0;
      selectedElement = resElement;
      resElement.classList.add("selected");
      restaurantMarker.setIcon(orangeIconUrl);
      map.panTo(location);
      map.setZoom(18);
      updateRestaurantInfo(restaurants[index], markers[index]);
    }
  }
}

function clearMarkers() {
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
   return '';
}

const filterButtons = document.getElementsByName("restaurant-filter");
let currentFilter;

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

let infowindow;
let infowindowContent;

function updateRestaurantInfo(restaurant, marker) {
  if (!infowindow) {
    infowindow = new google.maps.InfoWindow();
    infowindow.setZIndex(500); // Random high number so it shows on top
    infowindowContent = document.getElementById('infowindow-restaurant-content');
  }
  let { geometry: {location}, placeId, name, photos, rating } = restaurant;

  let params = {
    api: 1,
    destination: name,
    destination_place_id: placeId
  }
  const dir_url = new URL('https://www.google.com/maps/dir/');
  Object.keys(params).forEach(key => dir_url.searchParams.append(key, params[key]));

  infowindowContent.children['info-restaurant-name'].textContent = name;
  infowindowContent.children['info-restaurant-dir'].setAttribute("href", dir_url);

  infowindowContent.children['whatsapp-share'].href = `https://wa.me/?text=${encodeURIComponent(dir_url)}%0ALet's%20eat%20at%20${encodeURI(name)}!`;
  infowindowContent.children['telegram-share'].href = `https://t.me/share/url?url=${encodeURIComponent(dir_url)}&text=Let's%20eat%20at%20${encodeURI(name)}!`;

  // closes previous infowindow
  infowindow.close();
  infowindow.setContent(infowindowContent);
  infowindow.open(map, marker);
}

function clearPACInput() {
  const pacClearElem = document.getElementById('pac-input');
  pacClearElem.value = '';
}

document.getElementById("resize-nav-button").addEventListener("click", function() {
  resizeNavButton();
});


function resizeNavButton() {
  let button = document.getElementById("resize-nav-button");
  let topNavBar = document.getElementById("pac-card");
  if (!topNavBar.style.maxHeight) {
    topNavBar.style.maxHeight = "105px";
    button.textContent = "Expand";
  }
  else {
    topNavBar.style.maxHeight = null;
    button.textContent = "Collapse";
  }
}
