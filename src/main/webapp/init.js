const configUrl = new URL('/client-config', window.location.origin)
configUrl.searchParams.append("key", "clientapikey")

fetch(configUrl).then((response => {
  response.text().then(apikey => {
    var script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apikey + '&libraries=places&callback=initMap';
    script.defer = true;

    document.head.appendChild(script);
  })
}))