/////Model////
// These are the real estate listings that will be shown to the user.
// Normally we'd have these in a database instead.
/// array of cafe (markers) 
var allMarkers = [
	{name: 'Chunk Bakery & Pastry', latitude: 24.735305, longitude: 46.647120, marker: ''},
	{name: 'Tutti Cafe',  latitude: 24.700268, longitude: 46.667983, marker: ''},
	{name: 'Al Masaa Cafe', latitude: 24.713065, longitude: 46.673076, marker: ''},
	{name: 'Laduree',  latitude: 24.692380, longitude: 46.668628, marker: ''},
	{name: 'White Garden Cafe',  latitude: 24.694339, longitude: 46.683556, marker: ''},
	{name: 'Off White Laounge', latitude: 24.775940, longitude: 46.665861, marker: ''}
];

////////View Model////////

var map;
var infoWindow;
var marker;


//create function to load google map 
function viewMap () {
	var ViewModel = function () {

		var cafe = function (data) {
			//use ko.observable from Knockout to updates automatically when the view model changes
			this.name = ko.observable(data.name);
			this.latitude = ko.observable(data.latitude);
			this.longitude = ko.observable(data.longitude);
			this.marker = '';
		};

		var self = this;

		//Create map centered on Riyadh
		var mapCenter = {
			zoom: 12,
			center: {lat: 24.713552, lng: 46.675296}
		};	
		map = new google.maps.Map(document.getElementById("map"),
								  mapCenter);




		//but the markers in observable array
		self.markerItem = ko.observableArray(allMarkers);

		//Create markers to show in the map dependent on location on array (allMarkers)
		self.markerItem().forEach(function(placeItem) {
			marker = new google.maps.Marker({
				position: new google.maps.LatLng(placeItem.latitude, placeItem.longitude),
				map: map,
				title: placeItem.name,
				animation: google.maps.Animation.DROP
			});

			placeItem.marker = marker;

			//Markers animate when clicked 
			placeItem.marker.addListener('click', toggleBounce);

			function toggleBounce() {
				if (placeItem.marker.getAnimation() !== null) {
					placeItem.marker.setAnimation(null);
				} else {
					placeItem.marker.setAnimation(google.maps.Animation.BOUNCE);
					setTimeout(function(){ placeItem.marker.setAnimation(null); }, 1400);
				}
			}

			////infowindow/////
			var windowNames = placeItem.name;
			infoWindow = new google.maps.InfoWindow();

			//when marker is clicked infowindow will appear 
			google.maps.event.addListener(placeItem.marker, 'click', function() {
				var infoContent;

				//foursquare API 
				var forSqURL = "https://api.foursquare.com/v2/venues/search?ll=" + placeItem.marker.getPosition().lat()+','+ placeItem.marker.getPosition().lng()+ "&query=coffee&intent=checkin&client_id=0CABCIAPRWKUPBHQXSR5CSAWILEDWP0YJOY351AKGHEHHX0X&client_secret=FZM0RV2NGP3B1YBG5IMI01YM3ZATGC0QFNKTJT43FBUJA4BJ&v=20170520";
				console.log(forSqURL);
				//AJAX request for foursquare API 
				$.ajax ({
					url: forSqURL,
					success: function ( JSON ){
						var venues = JSON.response.venues;

						if(placeItem.name !== null){
							
						var url = 'https://api.foursquare.com/v2/venues/' + placeItem.name ;
						infoContent = '<div id="content">' + windowNames + '<p>' + 'Location: ' + (venues[0].location.address !== undefined && venues[0].location.address !== null ? venues[0].location.address : "no address data available") + '</p>' + '<p>' +  '</p>'  + 'Phone Number: ' + (venues[0].contact.phone !== undefined && venues[0].contact.phone !== null ? venues[0].contact.phone : "no phone data available")+ '</div>';
						infoWindow.setContent(infoContent);} }


					//Communicate error when foursquare API is unable to be reached or is not available
				}).fail(function(){
					infoContent = '<div id="content">' + windowNames + '<p>' + 'Failed to reach foursquare'+ '</p>' + '</div>';
					infoWindow.setContent(infoContent);
				});
				//Call to open the infowindow
				console.log("clicked");
				infoWindow.open(map, this);
			});
		});

		//search by first letter or word in the list
		var stringStartsWith = function (string, startsWith) {
			string = string || "";
			if (startsWith.length > string.length) 
				return false;
			return string.substring(0, startsWith.length) === startsWith;
		};

		//marker show when search of specific cafe in search box	
		self.markerTrigger = function(marker) {
			google.maps.event.trigger(this.marker, 'click');
		};

		self.query= ko.observable('');
		// searching (filtering) for cafe on the list and markers by using ko.computed	
		self.searchList = ko.computed(function(placeItem) {
			var search = self.query().toLowerCase();
			if (!search) {
				self.markerItem().forEach(function(placeItem) {
					placeItem.marker.setVisible(true);
				});
				return self.markerItem();
			} else {
				return ko.utils.arrayFilter(self.markerItem(), function(placeItem) {
					is_filtered = stringStartsWith(placeItem.name.toLowerCase(), search);
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

	//Call ViewModel function
	ko.applyBindings(new ViewModel());
}

