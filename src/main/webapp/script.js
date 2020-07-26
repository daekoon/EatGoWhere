let map;

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
    let place = autocomplete.getPlace();
    if (!place || !place.geometry) {
      // User clicked submit without choosing a field from autocomplete
      // or entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("Please enter a valid location!");
      return;
    }
    resizeNavButton(keepCollapsed=true);
    const url = new URL('/places-list', window.location.origin),
          params = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            filter: getDieteryRestrictions()
          }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(url).then((response => {
      response.json().then((data) => {
        updateRestaurant(data.results);
      })
    }))
  });
}

let restaurants;
let restaurantIndex = 0;
function updateRestaurant(result) {
  let resContainerElement = document.getElementById("result-container");
  resContainerElement.style.display = "flex";

  shuffleArray(result);
  restaurants = result;

  if(result.length === 0) {
    document.getElementById("restaurant-details").style.display = "none";
    document.getElementById("no-result-text").style.display = "block";
  } else {
    document.getElementById("restaurant-details").style.display = "flex";
    document.getElementById("no-result-text").style.display = "none";

    updateRestaurantDetails(0);

    // Show restaurant tab if hidden
    if(resultHidden) {
      resultHidden = false;
      setRestaurantTab(resultHidden);
    }

    // Hide next and previous buttons if only one restaurant
    if(result.length === 1) {
      document.getElementById("restaurant-buttons").style.display = "none";
    } else {
      document.getElementById("restaurant-buttons").style.display = "flex";
    }
  }
}

// Randomize array in-place using Durstenfeld shuffle algorith
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

let restaurantMarker;
function updateRestaurantDetails(index) {
  const { geometry: {location}, placeId, name, photos, rating, userRatingsTotal, openingHours: { openNow } } = restaurants[index];

  const nameElement = document.getElementById("restaurant-name");
  nameElement.innerHTML = name;

  const ratingElement = document.getElementById("restaurant-rating");
  ratingElement.innerHTML = "Rating: " + rating + "/5  (" + userRatingsTotal + ")";

  if(photos) {
    const photoReference = photos[0].photoReference;
    const url = new URL('/places-photo', window.location.origin),
        params = {
          photoRef: photoReference
        }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const imgElement = document.getElementById("restaurant-image");
    imgElement.src = url;
    imgElement.onerror = function() {
      this.onerror = null;
      this.src = '';
    }
  }

  map.panTo(location);
  map.setZoom(18);

  let params = {
    api: 1,
    destination: name,
    destination_place_id: placeId
  }
  const dirUrl = new URL('https://www.google.com/maps/dir/');
  Object.keys(params).forEach(key => dirUrl.searchParams.append(key, params[key]));

  const directionElement = document.getElementById("restaurant-dir");
  const whatsappElement = document.getElementById("restaurant-whatsapp-share");
  const telegramElement = document.getElementById("restaurant-telegram-share");

  directionElement.href = dirUrl;
  whatsappElement.href = `https://wa.me/?text=${encodeURIComponent(dirUrl)}%0ALet's%20eat%20at%20${encodeURI(name)}!`;
  telegramElement.href = `https://t.me/share/url?url=${encodeURIComponent(dirUrl)}&text=Let's%20eat%20at%20${encodeURI(name)}!`;


  restaurantMarker && restaurantMarker.setMap(null);
  restaurantMarker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29),
    position: location,
    title: name,
    icon: {
      url: blueIconUrl
    }
  });
  updateRestaurantInfo(restaurants[index], restaurantMarker);
}

function nextRestaurant() {
  restaurantIndex = (restaurantIndex + 1) % restaurants.length;
  updateRestaurantDetails(restaurantIndex);
}

function prevRestaurant() {
  restaurantIndex = (restaurantIndex === 0) ? restaurants.length - 1 : restaurantIndex - 1;
  updateRestaurantDetails(restaurantIndex);
}

function setRestaurantTab(hidden) {
  const resultContainerElement = document.getElementById("result-container");
  if(hidden) {
    resultContainerElement.classList.add("result-hidden");
    document.getElementById("result-hide-button").innerHTML = "<span class=\"iconify\" data-icon=\"dashicons:arrow-up-alt2\" data-inline=\"false\"></span>";
  } else {
    resultContainerElement.classList.remove("result-hidden");
    document.getElementById("result-hide-button").innerHTML = "<span class=\"iconify\" data-icon=\"dashicons:arrow-down-alt2\" data-inline=\"false\"></span>";
  }
}

document.getElementById("previous-button").addEventListener("click", function() {
  prevRestaurant();
});

document.getElementById("next-button").addEventListener("click", function() {
  nextRestaurant();
});

let resultHidden = false;
document.getElementById("result-hide-button").addEventListener("click", function() {
  resultHidden = !resultHidden;
  setRestaurantTab(resultHidden);
});

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

  infowindowContent.children['info-restaurant-name'].textContent = restaurant.name;

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

function resizeNavButton(keepCollapsed=false) {
  let button = document.getElementById("resize-nav-button");
  let topNavBar = document.getElementById("pac-card");
  if (keepCollapsed || !topNavBar.style.maxHeight) {
    topNavBar.style.maxHeight = "105px";
    button.textContent = "Expand";
  }
  else {
    topNavBar.style.maxHeight = null;
    button.textContent = "Collapse";
  }
}
