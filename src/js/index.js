import $ from 'jQuery'

import L from 'leaflet'

import {config} from './config.js'

let map = L.map('map', {center:[44, -120.5], zoom: 7, minZoom: 6})

map.setMaxBounds([[41, -126], [47, -115]])

setUpLayerControl()


function setUpLayerControl() {
  var baseMaps = {}
  var overlayLayers = {}
  // Iterate through list of base layers and add to layer control
  for (var k=0; k<config.baseMapLayers.length; k++) {
    var bl = baseMaps[config.baseMapLayers[k].name] = L.tileLayer(config.baseMapLayers[k].url, config.baseMapLayers[k].options)
    if (config.baseMapLayers[k].default) {
      map.addLayer(bl)
    }
  }
  // Iterate through list of overlay layers and add to layer control
  for (k=0; k<config.overlayLayers.length; k++) {
    var oLayer
    switch (config.overlayLayers[k].type) {
      case 'geojson':
        oLayer = overlayLayers[config.overlayLayers[k].name] = L.geoJson();
        (function(l, s) {
          $.getJSON(config.overlayLayers[k].url, function(data) {
            l.addData(data)
            l.setStyle(s)
          })
        })(oLayer, config.overlayLayers[k].style)
        break
      default:
        oLayer = overlayLayers[config.overlayLayers[k].name] = L.tileLayer(config.overlayLayers[k].url, config.overlayLayers[k].options)
      }
      if (config.overlayLayers[k].checked) {
        map.addLayer(oLayer)
      }
    }

  L.control.layers(baseMaps, overlayLayers, {position: 'topleft', collapsed: true}).addTo(map)
}
