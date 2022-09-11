//import $ from 'jQuery'

import L from 'leaflet'

import {config} from './config.js'

import {FeatureLayer} from 'esri-leaflet'

import {library, dom} from '@fortawesome/fontawesome-svg-core'
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons/faArrowsRotate'

import {getGeoJson} from './data.js'

library.add(faArrowsRotate)
dom.watch()

let map = L.map('map', {center:[44, -120.5], zoom: 7, minZoom: 6})

map.setMaxBounds([[41, -126], [47, -115]])

setUpCustomPanes()
setUpLayerControl()


function setUpLayerControl() {
  let baseMaps = {}
  let overlayLayers = {}
  // Iterate through list of base layers and add to layer control
  config.baseMapLayers.forEach(baseMapLayer => {
    let bl = baseMaps[baseMapLayer.name] = L.tileLayer(baseMapLayer.url, baseMapLayer.options)
    if (baseMapLayer.default) {
      map.addLayer(bl)
    }
  })
  // Iterate through list of overlay layers and add to layer control
  //for (k=0; k<config.overlayLayers.length; k++) {
  config.overlayLayers.forEach(async overlayLayer => {
    let oLayer
    switch (overlayLayer.type) {
        case 'esri': {
          oLayer = overlayLayers[overlayLayer.name] = new FeatureLayer(overlayLayer.options)
          if (overlayLayer.isTownshipAndRange) {
              setUpTownshipAndRangeLabels(oLayer)
          }
          break
        }
        case 'geojson': {
          oLayer = overlayLayers[overlayLayer.name] = L.geoJson()
          let data = await getGeoJson(overlayLayer.url)
          oLayer.addData(data)
          oLayer.setStyle(overlayLayer.style)
          break
        }
        default: {
          oLayer = overlayLayers[overlayLayer.name] = L.tileLayer(overlayLayer.url, overlayLayer.options)
        }
      }
    if (overlayLayer.checked) {
      map.addLayer(oLayer)
    }
  })

  L.control.layers(baseMaps, overlayLayers, {position: 'topleft', collapsed: true}).addTo(map)
}

function setUpCustomPanes() {
  map.createPane('trgrid')
  map.getPane('trgrid').style.zIndex = 650
  let mainPane = map.createPane('mainpane')
  map.getPane('mainpane').style.zIndex = 400

  // The below is a hack to handle click throughs (https://gist.github.com/perliedman/84ce01954a1a43252d1b917ec925b3dd)
  L.DomEvent.on(mainPane, 'click', function(e) {
    if (e._stopped) { return }

    let target = e.target
    let stopped
    let removed
    let ev = new MouseEvent(e.type, e)

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
  let labels = {};

  overlayLayer.on('createfeature', function(e){
    let id = e.feature.id
    let feature = this.getFeature(id)
    let center = feature.getBounds().getCenter()
    let label = L.marker(center, {
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
    let label = labels[e.feature.id]
    if(label){
      label.addTo(map)
    }
  })

  overlayLayer.on('removefeature', function(e){
    let label = labels[e.feature.id]
    if(label){
      map.removeLayer(label)
    }
  })
}
