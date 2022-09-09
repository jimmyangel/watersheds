import $ from 'jQuery'

import L from 'leaflet'

import {config} from './config.js'

import {FeatureLayer} from 'esri-leaflet'

import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faArrowsRotate } from '@fortawesome/free-solid-svg-icons/faArrowsRotate'

library.add(faArrowsRotate)
dom.watch()

let map = L.map('map', {center:[44, -120.5], zoom: 7, minZoom: 6})

map.setMaxBounds([[41, -126], [47, -115]])

setUpCustomPanes()
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
      case 'esri':
        oLayer = overlayLayers[config.overlayLayers[k].name] = new FeatureLayer(config.overlayLayers[k].options);
        if (config.overlayLayers[k].isTownshipAndRange) {
            setUpTownshipAndRangeLabels(oLayer)
        }
        break
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

function setUpCustomPanes() {
  map.createPane('trgrid')
  map.getPane('trgrid').style.zIndex = 650
  var mainPane = map.createPane('mainpane')
  map.getPane('mainpane').style.zIndex = 400

  // The below is a hack to handle click throughs (https://gist.github.com/perliedman/84ce01954a1a43252d1b917ec925b3dd)
  L.DomEvent.on(mainPane, 'click', function(e) {
    if (e._stopped) { return }

    var target = e.target
    var stopped
    var removed
    var ev = new MouseEvent(e.type, e)

    removed = {node: target, display: target.style.display}
    target.style.display = 'none'
    target = document.elementFromPoint(e.clientX, e.clientY)

    if (target && target !== mainPane) {
      stopped = !target.dispatchEvent(ev)
      if (stopped || ev._stopped) {
        L.DomEvent.stop(e)
      }
    }

    removed.node.style.display = removed.display
  })
}

function setUpTownshipAndRangeLabels(overlayLayer) {
  var labels = {};

  overlayLayer.on('createfeature', function(e){
    var id = e.feature.id
    var feature = this.getFeature(id)
    var center = feature.getBounds().getCenter()
    var label = L.marker(center, {
      icon: L.divIcon({
        iconSize: [100,20],
        className: 'toRaLabel',
        html: e.feature.properties.TWNSHPLAB
      }),
      interactive: false
    }).addTo(map)
    labels[id] = label
  })

  overlayLayer.on('addfeature', function(e){
    var label = labels[e.feature.id]
    if(label){
      label.addTo(map)
    }
  })

  overlayLayer.on('removefeature', function(e){
    var label = labels[e.feature.id]
    if(label){
      map.removeLayer(label)
    }
  })
}
