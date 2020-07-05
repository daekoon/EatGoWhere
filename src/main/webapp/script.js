function getRandomRestaurant() {
  const restaurants =
      ['Din Tai Fung', 'Mcdonalds', 'KFC', 'Subway'];

  // Pick a random greeting.
  const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];

  // Add it to the page.
  const resElemenet = document.getElementById('restaurant-name');
  resElemenet.innerText = restaurant;
}