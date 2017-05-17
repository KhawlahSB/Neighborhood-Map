/////Model////
// These are the real estate listings that will be shown to the user.
// Normally we'd have these in a database instead.
 var initialMarkers = [
          {name: 'Chunk Bakery & Pastry', address: 'Fiorenza la piazza (at Imam Saud Bin Abdulaziz Rd)',latitude: 24.735305, longitude: 46.647120, marker: ''},
          {name: 'Tutti Cafe', address:'Tahliya St', latitude: 24.700268, longitude: 46.667983, marker: ''},
          {name: 'Al Masaa Cafe',address: 'Aluroba Street (King Fahad Road)', latitude: 24.713065, longitude: 46.673076, marker: ''},
          {name: 'Laduree', address:'Panorama Mall', latitude: 24.692380, longitude: 46.668628, marker: ''},
          {name: 'White Garden Cafe', address:'AL Haweshel Center (Tahlia & Olaya- Behind Samba Bank)', latitude: 24.694339, longitude: 46.683556, marker: ''},
          {name: 'Off White Laounge', address:'Exit 5 (King Abdulaziz St.)', latitude: 24.775940, longitude: 46.665861, marker: ''}
        ];

//Construct Place data using ko.observable so data is updated in real time when changed
var Place = function (data) {
  this.name = ko.observable(data.name);
  this.address = ko.observable(data.address);
  this.latitude = ko.observable(data.latitude);
  this.longitude = ko.observable(data.longitude);
  this.marker = '';
};

////////View Model////////

//Create global variables for use in map functions
var map;
var infoWindow;
var marker;

//Create callback function for Google map async load
function initMap () {
//Create View Model main function
var AppViewModel = function () {

  //Function to assist with filteredPlaces list by checking the beginning of string searched
  var stringStartsWith = function (string, startsWith) {
    string = string || "";
    if (startsWith.length > string.length) {
        return false;
    }
    return string.substring(0, startsWith.length) === startsWith;
  };
	
//Variable to keep references of "this" inside the View Model
  var self = this;

  //Create map centered on Riyadh
  var mapOptions = {
    zoom: 15,
    center: {lat: 24.713552, lng: 46.675296}
  };	
 map = new google.maps.Map(document.getElementById("map"),
      mapOptions);

  //Create event listener to cause map to resize and remain centered in response to a window resize
  google.maps.event.addDomListener(window, "resize", function() {
			var center = map.getCenter();
			google.maps.event.trigger(map, "resize");
			map.setCenter(center);
  });
//Create observable array for markers
  self.markerArray = ko.observableArray(initialMarkers);

  //Create markers that populate on the map and correspond to the locations identified in the initialMarkers array
  self.markerArray().forEach(function(placeItem) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(placeItem.latitude, placeItem.longitude),
      map: map,
      title: placeItem.name,
      animation: google.maps.Animation.DROP
    });

    placeItem.marker = marker;

    //Add bounce animation to markers when clicked or selected from list
    placeItem.marker.addListener('click', toggleBounce);

    function toggleBounce() {
      if (placeItem.marker.getAnimation() !== null) {
        placeItem.marker.setAnimation(null);
      } else {
        placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){ placeItem.marker.setAnimation(null); }, 2100);
      }
    }

  
    //Create variables for use in contentString for infowindows
    var windowNames = placeItem.name;
    var windowAddresses = placeItem.address;

    //Create new infowindow
    infoWindow = new google.maps.InfoWindow();

    //Create event listener to open infowindow when marker is clicked
    google.maps.event.addListener(placeItem.marker, 'click', function() {
          //Create contentString variable for infowindows
          var contentString;

          //Alter placeItem.name content to account for symbols and spaces
          var alteredName = encodeURI(placeItem.name);

          //foursquare API 
          var forSqURL = "https://api.foursquare.com/v2/venues/search?" + placeItem.name + "&query=coffee&intent=checkin&client_id=0CABCIAPRWKUPBHQXSR5CSAWILEDWP0YJOY351AKGHEHHX0X&client_secret=FZM0RV2NGP3B1YBG5IMI01YM3ZATGC0QFNKTJT43FBUJA4BJ";
          //AJAX request for foursquare API information used in infowindows
          $.ajax ({
            url: forSqURL,
            dataType: "jsonp",
            success: function ( response ){
              var venues = response[1];
              //If an article is found, populate infowindow with content string information showing foursquare response
              if (venues.length > 0) {
                for (var i=0; i<venues.length; i++) {
                 
                  var url = 'https://api.foursquare.com/v2/venues/' + placeItem.name ;
                  contentString = '<div id="content">' + windowNames + '<p>' + windowAddresses + '</p>' + '<p>' + response[2] + '</p>' + '<a href=" ' + url + '">' + url + '</a>' + '</div>';
                  infoWindow.setContent(contentString);
                  console.log(response);
                }
                console.log(forSqURL);
              //If no article is found, populate infowindow with content string reflecting no articles were found
              } else {
                contentString = '<div id="content">' + windowNames + '<p>' + windowAddresses + '</p>' + '<p>' + 'No articles found on Wikipedia'+ '</p>' + '</div>';
                console.log(forSqURL);
                infoWindow.setContent(contentString);
              }
            }
          //Communicate error when foursquare API is unable to be reached or is not available
          }).error(function(e){
            contentString = '<div id="content">' + windowNames + '<p>' + windowAddresses + '</p>' + '<p>' + 'Failed to reach Wikipedia'+ '</p>' + '</div>';
            infoWindow.setContent(contentString);
          });
      //Call to open the infowindow
      console.log("clicked");
      infoWindow.open(map, this);
    });
  });

  //Function to connect marker triggers to list selection, allows markers to animate and infowindows to open when list is clicked
  self.markerTrigger = function(marker) {
        google.maps.event.trigger(this.marker, 'click');
  };

  //Create observable for information typed into the search bar
  self.query= ko.observable('');

  //Create a ko.computed for the filtering of the list and the markers
  self.filteredPlaces = ko.computed(function(placeItem) {
    var filter = self.query().toLowerCase();
    //If there is nothing in the filter, return the full list and all markers are visible
    if (!filter) {
      self.markerArray().forEach(function(placeItem) {
          placeItem.marker.setVisible(true);
        });
      return self.markerArray();
    //If a search is entered, compare search data to place names and show only list items and markers that match the search value
    } else {
        return ko.utils.arrayFilter(self.markerArray(), function(placeItem) {
          is_filtered = stringStartsWith(placeItem.name.toLowerCase(), filter);
          //Show markers that match the search value and return list items that match the search value
           if (is_filtered) {
              placeItem.marker.setVisible(true);
              console.log("clicked");
              return is_filtered;
            }
          //Hide markers that do not match the search value
           else {
              placeItem.marker.setVisible(false);
              return is_filtered;
            }
        });
      }
  }, self);
};

//Call the AppViewModel function
ko.applyBindings(new AppViewModel());
}

