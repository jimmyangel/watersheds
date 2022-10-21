export var config = {
  baseMapLayers: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles © Esri — Source: <a href="http://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f">ArcGIS World Topographic Map</a>'
      },
      name: 'World Topographic Map',
      default: true
    },
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      },
      name: 'OpenStreetMap'
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles © Esri — Source: <a href="http://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">ArcGIS World Imagery</a>'
      },
      name: 'World Imagery'
    }
  ],
  overlayLayers: [
    {
      options: {
        url: 'https://arcgis.deq.state.or.us/arcgis/rest/services/WQ/DEQ_Streams/MapServer',
        f: 'image',
        format: 'png32',
        layers: [0],
        showLabels: true,
        minZoom: 9,
        attribution: 'Oregon DEQ',
        pane: 'trgrid'
      },
      name: 'Oregon DEQ Hydrography',
      type: 'esriimg'
    },
    {
      options: {
        url: 'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/1',
        style: function() {
          return {
            color: 'grey',
            fill: false
          }
        },
        minZoom: 11,
        opacity: 0.8,
        interactive: false,
        pane: 'trgrid'
      },
      color: '#FB3231',
      name: 'Township and Range Grid',
      isTownshipAndRange: true,
      type: 'esri'
    },
    {
      url: 'https://stable-data.oregonhowl.org/oregon/oregon.json',
      name: 'State boundary',
      type: 'geojson',
      style: {
        weight: 4,
        opacity: 0.5,
        color: 'black',
        fill: false
      }
    }
  ],
  oregonBbox: [
    [41.9918, -124.7035],
    [46.2991, -116.4635]
  ],
  mapInitialSettings: {
    center:[44, -120.5],
    zoom: 7,
    minZoom: 6,
    doubleClickZoom: false
  },
  maxBounds: [[41, -126], [47, -115]],
  watershedsStyle: {
    color: '#2F4F4F',
    fillColor: '#AFEEEE',
    weight: 1,
    fillOpacity: 1,
    opacity: 1
  },
  stripesStyleOptions: {
    angle: -45,
    color: 'purple',
    spaceColor: '#aaaaaa',
    height: 7,
    weight: 2,
    opacity: 1,
    spaceWeight: 5,
    spaceOpacity: 1
  },
  defaultLayerOpacity: 0.5,
  selectedWatershedStyle: {fillOpacity: 1, fillColor: '#aaaaaa', color: '#834C24', weight: 1.5, opacity: 1},
  watershedsAttribution: 'Oregon Wild'
}
