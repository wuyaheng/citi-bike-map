// Create the tile layer that will be the background of our map
var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'></a></strong>",
  tileSize: 512,
  maxZoom: 18,
  zoomOffset: -1,
  id: "mapbox/streets-v11",
  accessToken: API_KEY
});

// Initialize all of the LayerGroups we'll be using
var layers = {
  EMPTY: new L.LayerGroup(),
  LOW: new L.LayerGroup(),
  NORMAL: new L.LayerGroup()
};

// Create the map with our layers
var map = L.map("map-id", {
  center: [40.73, -74.0059],
  zoom: 14,
  layers: [
    layers.EMPTY,
    layers.LOW,
    layers.NORMAL
  ]
});

// Add our 'lightmap' tile layer to the map
lightmap.addTo(map);

// Create an overlays object to add to the layer control
var overlays = {
  "Healthy Stations": layers.NORMAL,
  "Low Stations": layers.LOW,
  "Empty Stations": layers.EMPTY
};

// Create a control for our layers, add our overlay layers to it
L.control.layers(null, overlays).addTo(map);

// Create a legend to display information about our map
var info = L.control({
  position: "bottomright"
});

// When the layer control is added, insert a div with the class of "legend"
info.onAdd = function() {
  var div = L.DomUtil.create("div", "legend");
  return div;
};
// Add the info legend to the map
info.addTo(map);

// Initialize an object containing icons for each layer group
var icons = {
  EMPTY: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "red",
    shape: "circle"
  }),
  LOW: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "orange",
    shape: "circle"
  }),
  NORMAL: L.ExtraMarkers.icon({
    icon: "ion-android-bicycle",
    iconColor: "white",
    markerColor: "green",
    shape: "circle"
  })
};

// Perform an API call to the Citi Bike Station Information endpoint
d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_information.json", function(infoRes) {

  // When the first API call is complete, perform another call to the Citi Bike Station Status endpoint
  d3.json("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", function(statusRes) {
    var updatedAt = infoRes.last_updated;
    var stationStatus = statusRes.data.stations;
    var stationInfo = infoRes.data.stations;
    console.log(stationStatus)
    console.log(stationInfo)
    // Create an object to keep of the number of markers in each layer
    var stationCount = {
      EMPTY: 0,
      LOW: 0,
      NORMAL: 0
    };

    // Initialize a stationStatusCode, which will be used as a key to access the appropriate layers, icons, and station count for layer group
    var stationStatusCode;
    var totalCitiBike = 0;
    var totalEbike = 0;
    // Loop through the stations (they're the same size and have partially matching data)
    for (var i = 0; i < stationInfo.length; i++) {

      // Create a new station object with properties of both station objects
      var station = Object.assign({}, stationInfo[i], stationStatus[i]);
      // If a station has no bikes available, it's empty
      if (!station.num_bikes_available) {
        stationStatusCode = "EMPTY";
      }
      // If a station has less than 5 bikes, it's status is low
      else if (station.num_bikes_available < 5) {
        stationStatusCode = "LOW";
        totalCitiBike += station.num_bikes_available; 
        totalEbike += station.num_ebikes_available;
      }
      // Otherwise the station is normal
      else {
        stationStatusCode = "NORMAL";
        totalCitiBike += station.num_bikes_available;
        totalEbike += station.num_ebikes_available; 
      }

      // Update the station count
      stationCount[stationStatusCode]++;
      // Create a new marker with the appropriate icon and coordinates
      var newMarker = L.marker([station.lat, station.lon], {
        icon: icons[stationStatusCode]
      });

      // Add the new marker to the appropriate layer
      newMarker.addTo(layers[stationStatusCode]);

      // Bind a popup to the marker that will  display on click. This will be rendered as HTML
      newMarker.bindTooltip(
        "<table class='table table-borderless table-sm pb-0 mb-0'><thead><tr><h6>" + 
        station.name + "</h6></tr></thead><tbody><tr><td><h3>"+ station.num_bikes_available + "</h3></td><td><h3>" + station.num_ebikes_available + "</h3></td></tr><tr><td> <i class='fas fa-bicycle'></i> Classic  </td> <td> Electric <i class='fas fa-bolt'></i> </td></tr></tbody></table>"
        );
    }

    console.log(totalCitiBike)
    console.log(totalEbike)

        // summary card begins
        var classic = document.getElementById('classic'); 
        var electric = document.getElementById('electric');
        classic.innerHTML = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(totalCitiBike);
        electric.innerHTML = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(totalEbike); 


    // Call the updateLegend function, which will... update the legend!
    updateLegend(updatedAt);

    // bar chart begins
    var ctx = document.getElementById('myChart').getContext('2d');
    var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'bar',

    // The data for our dataset
    data: {
        labels: Object.keys(stationCount),
        datasets: [{
            label: "Station Count",
            backgroundColor: ['#A12F33','#EF9228','#019549'],
            data: Object.values(stationCount)
        }]
    },

    // Configuration options go here
    options: {
      maintainAspectRatio: true,
      responsive: true,
      title: {
        display: true,
        text: 'The Number of Citi Bike Stations by Status'
    },
      legend: {
        display: false
    },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
          },            
          gridLines: {
            drawOnChartArea: false
        },
        scaleLabel: {
          display: true,
          labelString: "Station Status (If < 5 bikes, station status is LOW)"
        }
        }]
      },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'top',
          formatter: Math.round,
          font: {
            weight: 'bold'
          }
        }
      }
    }
});


  });
});

// Update the legend's innerHTML with the last updated time
function updateLegend(time) {
  document.querySelector(".legend").innerHTML = "<p class='mb-0'>Updated by " + moment.unix(time).format("h:mm:ss A") + "</p>";
}



