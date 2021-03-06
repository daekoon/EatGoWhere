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

  navigator.geolocation.getCurrentPosition(updateLocation, () => {
    window.alert("Please enter your location manually");
  }, {enableHighAccuracy: true});

  document.getElementById("resize-nav-button").click();

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
      if (!userMarker) {
        // User disabled location and didn't choose a place
        window.alert("Please enter a valid location!");
        return;
      } else {
        var originLat = userMarker.position.lat(),
          originLng =  userMarker.position.lng();
      }
    } else {
      var originLat = place.geometry.location.lat(),
          originLng =  place.geometry.location.lng();
    }

    resizeNavButton(keepCollapsed=true);
    setRestaurantTab(hidden=true);
    resultHidden=true;

    const url = new URL('/places-list', window.location.origin),
          params = {
            lat: originLat,
            lng: originLng,
            filter: getCuisineFilter(),
            price: getPriceFilter(),
            distance: getDistanceFilter()

          }

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))

    fetch(url).then((response => {
      response.json().then((data) => {
        updateRestaurant(data.results);
      })
    }))

    if (place)
      gtag('event', 'search', {'search_term': place.name});
    else
      gtag('event', 'search');
  });
}

let restaurants;
let restaurantIndex = 0;
function updateRestaurant(result) {
  let resContainerElement = document.getElementById("result-container");

  shuffleArray(result);
  restaurants = result;

  if(result.length === 0) {
    document.getElementById("restaurant-details").style.display = "none";
    document.getElementById("no-result-text").style.display = "block";
  } else {
    document.getElementById("restaurant-details").style.display = "flex";
    document.getElementById("no-result-text").style.display = "none";

    updateRestaurantDetails(0);

    // Hide next and previous buttons if only one restaurant
    if(result.length === 1) {
      document.getElementById("restaurant-buttons").style.display = "none";
    } else {
      document.getElementById("restaurant-buttons").style.display = "flex";
    }
    resContainerElement.classList.remove("hide");
    resContainerElement.scrollTop = 0;
    document.getElementById("infowindow-restaurant-content").classList.remove("hide");
  }
  resContainerElement.classList.remove("hide");
  
  // Show restaurant tab if hidden
  if(resultHidden) {
    resultHidden = false;
    setRestaurantTab(resultHidden);
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

  document.getElementById("rating-number").innerHTML = rating;
  document.getElementById("rating-users-number").innerHTML = "(" + userRatingsTotal + ")";
  updateRating(rating);

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

let resultHidden = true;
document.getElementById("result-hide-button").addEventListener("click", function() {
  resultHidden = !resultHidden;
  setRestaurantTab(resultHidden);
  if (!resultHidden) resizeNavButton(keepCollapsed=true);
});

function updateRating(rating) {
  let full_stars = Math.floor(rating);
  let half = (rating % 1) >= 0.5;
  let empty_stars = 5 - full_stars - half;

  for (let i=1; i<=full_stars; i++) {
    document.getElementById("rating-" + i).classList.remove("rating-inactive");
    document.getElementById("rating-" + i).classList.add("rating-active");
  }
  for (let i=++full_stars; i<=5 ; i++) {
    document.getElementById("rating-" + i).classList.remove("rating-active");
    document.getElementById("rating-" + i).classList.add("rating-inactive");
  }
  if (half) {
    document.getElementById("rating-half").classList.remove("rating-inactive");
    document.getElementById("rating-half").classList.add("rating-active");
  } else {
    document.getElementById("rating-half").classList.remove("rating-active");
    document.getElementById("rating-half").classList.add("rating-inactive");
  }
  for (let i=1; i<=empty_stars; i++) {
    document.getElementById("empty-rating-" + i).classList.remove("rating-inactive");
    document.getElementById("empty-rating-" + i).classList.add("rating-active");
  }
  for (let i=++empty_stars; i<=5 ; i++) {
    document.getElementById("empty-rating-" + i).classList.remove("rating-active");
    document.getElementById("empty-rating-" + i).classList.add("rating-inactive");
  }
}

function getCuisineFilter() {
   const cuisineSelect = document.getElementById("cuisine-filter");
   return cuisineSelect.value;
}

function getDistanceFilter() {
  const distanceForm = document.getElementById("distance-filter");
  if (distanceForm.value == null) {
    return 500
  }
  return distanceForm.value;
}

function getPriceFilter() {
   const priceSlider = document.getElementById("price-filter");
   return priceSlider.value
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
  const expandButton = document.getElementById("expand-top-button");
  const collapseButton = document.getElementById("collapse-top-button");
  let topNavBar = document.getElementById("pac-card");
  let filterContainer = document.getElementById("pac-container");

  if (keepCollapsed || !topNavBar.style.maxHeight) {
    topNavBar.style.maxHeight = "105px";
    filterContainer.style.overflowY = "hidden";
    expandButton.classList.replace("hide", "show");
    collapseButton.classList.replace("show", "hide");
  }
  else {
    topNavBar.style.maxHeight = null;
    filterContainer.style.overflowY = "auto";
    expandButton.classList.replace("show", "hide");
    collapseButton.classList.replace("hide", "show");
    setRestaurantTab(hidden=true);
    resultHidden = true;
  }
}

let userMarker;
let userInfowindow;

function updateLocation(result) {
  if (!userInfowindow) {
    userInfowindow = new google.maps.InfoWindow();
  }
  coords = {
    lat: result.coords.latitude,
    lng: result.coords.longitude
  }
  userMarker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29),
    position: coords,
    title: 'user-location',
    icon: {
      url: orangeIconUrl
    }
  });

  userInfowindow.setContent("Your Location");
  userInfowindow.open(map, userMarker);
  // make user location coordinates show in the lower third of screen
  coords.lat = coords.lat + 0.001;
  map.panTo(coords);
  map.setZoom(17);
  
  // auto search if user gps is enabled
  document.getElementById("submit-button").click();
  gtag('event', 'gps');
}

document.getElementById("price-filter").addEventListener("input",function() {
  let price = this.value;

  // set icons 1 ~ price to active, rest to inactive
  for (i=1; i<=price; i++) {
    let priceLevel = document.getElementById("price-filter-" + i);
    priceLevel.classList.remove("price-filter-inactive");
    priceLevel.classList.add("price-filter-active");
  }
  for (i=++price; i<=4; i++) {
    let priceLevel = document.getElementById("price-filter-" + i);
    priceLevel.classList.remove("price-filter-active");
    priceLevel.classList.add("price-filter-inactive");
  }
});

document.getElementById("distance-filter").addEventListener("input",function() {
  let distance = this.value;
  document.getElementById("distance-filter-max").innerText = distance + "m"
});

function resizeAboutButton(collapse=false) {
  const expandButton = document.getElementById("expand-about-button");
  const collapseButton = document.getElementById("collapse-about-button");
  let aboutBar = document.getElementById("about-container");
  let filterContainer = document.getElementById("pac-container");
  if (collapse) {
    expandButton.classList.replace("hide", "show");
    collapseButton.classList.replace("show", "hide");
    aboutBar.classList.remove("expand-about-container");
  }
  else {
    expandButton.classList.replace("show", "hide");
    collapseButton.classList.replace("hide", "show");
    aboutBar.classList.add("expand-about-container");
  }
}

function isTouch() {
  return 'ontouchstart' in window || navigator.msMaxTouchPoints;
}

document.getElementById("about-container").addEventListener("mouseover", function(){
  if (!isTouch()) resizeAboutButton(collapse=false); //prevent duplicate events on touchscreen
});

document.getElementById("about-container").addEventListener("mouseout", function(){
  if (!isTouch()) resizeAboutButton(collapse=true); //prevent duplicate events on touchscreen
});

document.getElementById("expand-about-button").addEventListener("click", function(){
  resizeAboutButton(collapse=false);
});

document.getElementById("collapse-about-button").addEventListener("click", function(){
  resizeAboutButton(collapse=true);
});