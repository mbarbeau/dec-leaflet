function Map() {
  this.map = L.map('mapid', {
    zoomControl: false,
    center: new L.LatLng(46.80, -71.25),
    zoom: 12,
  });
  L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  this.addCarteGouvQc();
  this.initICherche();
  this.initEvents();
}

Map.prototype.initEvents =  function() {
  var self = this;
  var $input = $('#searchDiv input');
  var $button = $("#searchDiv button");
  $button.bind( "click", function(e) {
    self.search($input.val(), function (address) {
      if (address.length) {
         // self.addMarker(address[0].data.bbox);
        self.addGeoJSON(address[0].data);
        $input.val(address[0].value);
      }
    });
  });

  $input.keyup(function(e){
    if(e.keyCode == 13) {
      $button.click();
    }
});
};

Map.prototype.addOSM =  function() {
  L.tileLayer( 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: ['a','b','c']
  }).addTo( this.map );
};

Map.prototype.addCarteGouvQc =  function() {
  var urlTmsGouv = "http://{s}.geoegl.msp.gouv.qc.ca/cgi-wms/mapcache.fcgi/tms/1.0.0/carte_gouv_qc_public@EPSG_3857/{z}/{x}/{y}.png";
  L.tileLayer(urlTmsGouv, {
    attribution: 'Gouvernement du Québec',
    tms: true,
    subdomains: ['g1', 'g2', 'g3', 'g4']
  }).addTo( this.map );
};


Map.prototype.removeMarker = function () {
  if (this.marker) {
    this.map.removeLayer(this.marker);
  }
};

Map.prototype.addMarker = function (bbox) {
  this.removeMarker();
  var point = {
    x: bbox[0] - ((bbox[0] - bbox[2]) / 2),
    y: bbox[1] - ((bbox[1] - bbox[3]) / 2)
  };
  var myIcon = L.icon({
    iconUrl: 'assets/images/markers/marker-green.png',
    iconRetinaUrl: 'assets/images/markers/marker-green-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'assets/images/markers/marker-shadow.png',
    shadowSize: [41, 41]
  });
  this.map.panTo(new L.LatLng(point.y, point.x));
  this.marker = L.marker([point.y, point.x], {
    icon: myIcon
  }).addTo(this.map);
};

Map.prototype.addGeoJSON = function(geojson) {
  if (this.geoJsonLayer) {
    this.geoJsonLayer.clearLayers();
  } else {
    this.geoJsonLayer = L.geoJSON().addTo(this.map);
  }
  var geoJsonValid = {
    geometry: geojson.geometry,
    properties: geojson.properties,
    type: "Feature"
  };
  this.geoJsonLayer.addData(geoJsonValid);
};

Map.prototype.initICherche = function () {
  var self = this;
  $('#searchDiv input').autocomplete({
    source: function(request, response) {
      $.ajax(self.searchParams(request.term)).done(function(res) {
        var adresses = self.handleSearchSuccess(res);
        response(adresses);
      });
    },
    minLength: 3,
    select: function(event, ui) {
      // self.addMarker(ui.item.data.bbox);
      self.addGeoJSON(ui.item.data);
    }
  });
};

Map.prototype.searchParams = function (term) {
  return {
    url: "https://geoegl.msp.gouv.qc.ca/icherche/geopasdecode",
    dataType: 'jsonp',
    data: {
      q: term,
      nb: 10,
      type: "region_administrative,mrc,municipalite,route,adresse",
      geometries: "geom"
    }
  };
};

Map.prototype.search = function (term, callback) {
  var self = this;
  $.ajax(this.searchParams(term)).done(function(res) {
    var adresses = self.handleSearchSuccess(res);
    callback(adresses);
  });
};

Map.prototype.handleSearchSuccess = function (res) {
  var lg = res.features.length;
  var ind = 0;
  var adresses = [];
  for (ind; ind < lg && ind < 10; ind++) {
      var value = res.features[ind].properties.recherche;
      adresses.push({label: value, value: value, data: res.features[ind]});
  }
  return adresses;
};
