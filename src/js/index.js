import bulmaCollapsible from '@creativebulma/bulma-collapsible'

import L from 'leaflet'
import leafletPip from '@mapbox/leaflet-pip'
import 'leaflet-modal'

import {config} from './config.js'

import {FeatureLayer, DynamicMapLayer} from 'esri-leaflet'

import {library, dom} from '@fortawesome/fontawesome-svg-core'
import {faArrowsRotate, faAngleDown, faAngleUp} from '@fortawesome/free-solid-svg-icons'

import {getGeoJson} from './data.js'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

import resetControl from '../templates/resetControl.hbs'
import aboutControl from '../templates/aboutControl.hbs'
import aboutModal from '../templates/aboutModal.hbs'
import populationItem from '../templates/populationItem.hbs'
import angleIcon from '../templates/angleIcon.hbs'
//import welcomeModal from '../templates/welcomeModal.hbs'

import {version} from '../../package.json'

library.add(faArrowsRotate, faAngleDown, faAngleUp)
dom.watch()

delete L.Icon.Default.prototype._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl
})

let selectedWatersheds = null

let map = L.map('map', config.mapInitialSettings)

let marker

map.setMaxBounds(config.maxBounds)

setUpCustomPanes()
setUpResetControl()
setUpLayerControl()
setUpAboutControl()
setUpWatershedsLayer()
//displayWelcome()

function setUpResetControl() {
  let control = L.control({position: 'topleft'})
  control.onAdd = function () {
    this._div = L.DomUtil.create('div', 'leaflet-control leaflet-bar reset')
    this._div.innerHTML = resetControl({title: 'Reset View'})
    return this._div
  };
  control.addTo(map)
  document.getElementById('resetControl').addEventListener('click', function(e) {
    L.DomEvent.stopPropagation(e)
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

function setUpAboutControl() {
  var about = L.control({position: 'bottomright'})
  about.onAdd = function () {
    this._div = L.DomUtil.create('div', 'leaflet-control leaflet-bar about')
    this._div.innerHTML = aboutControl({about: 'About'})
    return this._div;
  }
  about.addTo(map)

  document.getElementById('aboutControl').addEventListener('click', function() {
    map.fire('modal', {
      content: aboutModal({version: version})
    })
  })
}

async function setUpWatershedsLayer() {
  map.on('click', clearMarker)

  let wsList = document.getElementById('ws-list')
  let data = await getGeoJson('/data/watersheds.json')
  let watersheds = L.geoJSON(data, {
    style: function (f) { return watershedStyle(f) },
    attribution: config.watershedsAttribution,
    onEachFeature: function (f, l) {
      l.on('click', function(e) {
        L.DomEvent.stopPropagation(e)
        clearMarker()
        marker = L.marker(e.latlng).addTo(map)
        document.getElementById('data-container').style.display='block'


        selectedWatersheds = leafletPip.pointInLayer(e.latlng, watersheds).sort((a, b) => b.feature.properties.POP_TOTAL - a.feature.properties.POP_TOTAL)

        //document.getElementById('total-population').innerHTML = `Total: ${selectedWatersheds[0].feature.properties.POP_TOTAL.toLocaleString()}`

        selectedWatersheds.forEach((item, idx) => {
          wsList.innerHTML += populationItem(
            {
              isFirst: idx === 0,
              row: idx,
              provider: item.feature.properties.WATER_PROV,
              population: item.feature.properties.POP_EST_19.toLocaleString(),
              totalPopulation: item.feature.properties.POP_TOTAL.toLocaleString(),
              city: item.feature.properties.CITY_SERV.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
              source: item.feature.properties.SRC_LABEL,
              subbasin: item.feature.properties.SUBBASIN_N
            }
          )
          item.setStyle(selectedStyle(selectedWatersheds.length))

          selectedWatersheds[selectedWatersheds.length - idx - 1].bringToFront()
        })
        //selectedWatersheds[0].bringToFront()

        bulmaCollapsible.attach('.is-collapsible').forEach(c => {
          c.on('after:expand', (e) => {
            document.getElementById(e.element.id + '-angle').innerHTML = angleIcon({upOrDown: 'up'})
          })
          c.on('after:collapse', (e) => {
            document.getElementById(e.element.id + '-angle').innerHTML = angleIcon({upOrDown: 'down'})
          })
        })
      })
    }
  })
  watersheds.addTo(map)
}

function watershedStyle(f) {
  let style = {...config.watershedsStyle} // Clone

  if (f.properties.POP_EST_19 === f.properties.POP_TOTAL) {
    style.fillOpacity = 0.2
  }
  return style
}

function selectedStyle(n) {
  let maxOpacity = n <=3 ? 0.2 : 0.4
  let s = {...config.selectedWatershedStyle}
  s.fillOpacity = maxOpacity / n
  console.log(s.fillOpacity)

  return s
}

function clearMarker() {
  if (marker) {
    map.removeLayer(marker)

    if (selectedWatersheds) selectedWatersheds.forEach(w => w.setStyle(watershedStyle(w.feature)))

    selectedWatersheds = null

    document.getElementById('ws-list').innerHTML = ''
    //document.getElementById('total-population').innerHTML = ''
    document.getElementById('data-container').style.display='none'
  }
}

/*function displayWelcome() {
  if (!inIframe() && !localStorage.getItem('noWelcome') && !(sessionStorage.getItem('hasSeenWelcome'))) {

    setTimeout(function() {
      map.fire('modal', {
        MODAL_CONTENT_CLS: 'welcome modal-content',
        content: welcomeModal()
      });
      sessionStorage.setItem('hasSeenWelcome', true);
    }, 1000);

    setTimeout(function() {
      map.closeModal()
    }, 15000);

    map.on('modal.hide', function() {
      if (document.getElementById('welcome-optout').checked) {
        localStorage.setItem('noWelcome', true);
      }
    });

  }
}

function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
} */
