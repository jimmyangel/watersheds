//import $ from 'jQuery'

import L from 'leaflet'
import 'leaflet-event-forwarder'

import {config} from './config.js'

import {FeatureLayer, DynamicMapLayer} from 'esri-leaflet'

import {library, dom} from '@fortawesome/fontawesome-svg-core'
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons/faArrowsRotate'

import {getGeoJson} from './data.js'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

library.add(faArrowsRotate)
dom.watch()

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl
})

let map = L.map('map', {center:[44, -120.5], zoom: 7, minZoom: 6, doubleClickZoom: false})
let marker

map.setMaxBounds([[41, -126], [47, -115]])

const myEventForwarder = new L.eventForwarder({
  // ref to leaflet map
  map: map,
  // events to forward
  events: {
    click: true,
    mousemove: false
  }
});

// enable event forwarding
myEventForwarder.enable();

setUpCustomPanes()
setUpResetControl()
setUpLayerControl()
setUpWatershedsLayer()

function setUpResetControl() {
  let resetControl = L.control({position: 'topleft'})
  resetControl.onAdd = function () {
    this._div = L.DomUtil.create('div', 'leaflet-control leaflet-bar reset')
    this._div.innerHTML = '<a id="resetControl" style="font-size: large;" href="#" title="Reset View"><i class="fa-solid fa-arrows-rotate"></i></a>';
    return this._div
  };
  resetControl.addTo(map)
  document.getElementById('resetControl').addEventListener('click', function() {
    console.log('reset')
    map.flyToBounds(config.oregonBbox)
    return false
  })
}

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
      case 'esriimg': {
        oLayer = overlayLayers[overlayLayer.name] = new DynamicMapLayer(overlayLayer.options)
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

async function setUpWatershedsLayer() {

  let data = await getGeoJson('/data/watersheds.json')
  let watersheds = L.geoJSON(data, {
      style: function (f) {
        let style = {
          color: '#2F4F4F',
          fillColor: '#AFEEEE',
          weight: 1,
          fillOpacity: 0,
          opacity: 0.65
        }
        if (f.properties.POP_EST_19 === f.properties.POP_TOTAL) {
          style.fillOpacity = 0.3
        }
        return style
      },
      onEachFeature: function (f, l) {
        l.on('click', function(e) {
          if (l.feature.properties.POP_EST_19 === l.feature.properties.POP_TOTAL) {
            if (marker) {
              map.removeLayer(marker)
            }
            marker = L.marker(e.latlng).addTo(map)
          }
          console.log(e, l.feature.properties.WATER_PROV, l.feature.properties.POP_TOTAL)
        })
      }
    }
  )
  watersheds.addTo(map)
}
