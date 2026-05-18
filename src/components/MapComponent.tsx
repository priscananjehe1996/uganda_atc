import React, { useMemo, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer, PathLayer, ScatterplotLayer, TextLayer, GeoJsonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import stationData from '../data/stations.json';
import { PathStyleExtension } from '@deck.gl/extensions';
import { formatFractionalYearToDate } from '../constants';
import { Navigation, Activity, Layers } from 'lucide-react';

const dashExtension = new PathStyleExtension({dash: true});

const INITIAL_VIEW_STATE = {
  longitude: 32.222,
  latitude: 1.341,
  zoom: 6.5,
  pitch: 45,
  bearing: 0
};

export default function MapComponent({ data, currentYear, filters, mapMode, selectedLink, selectedStation, onSelectLink, onSelectStation }: any) {
  const [time, setTime] = useState(0);
  const [districtRoads, setDistrictRoads] = useState(null);
  const [mouseMode, setMouseMode] = useState('pan'); // 'pan', 'select', 'zoom'

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}district_roads.json`)
      .then(res => res.json())
      .then(d => setDistrictRoads(d))
      .catch(e => console.log('Error loading district roads', e));
  }, []);

  useEffect(() => {
    let animationFrame: any;
    if (mapMode === 'Routes') {
      const animate = () => {
        setTime(t => (t + 40) % 10000);
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [mapMode]);

  const roadLinks = useMemo(() => {
    if (!data || !data.features || !filters) return [];

    return data.features.filter((f: any) => {
      if (!f.geometry || !f.geometry.coordinates) return false;
      if (filters.surface !== 'All' && filters.surface !== f.properties.surface_type) return false;
      if (filters.class !== 'All' && filters.class !== f.properties.road_class) return false;
      if (filters.region !== 'All Regions' && f.properties.region !== filters.region) return false;
      return true;
    }).map((f: any) => {
      const aadt2025 = f.properties.aadt_2025 || 10000;
      const compoundGrowth = Math.pow(1.15, currentYear - 2025);
      const liveVolume = aadt2025 * compoundGrowth;
      
      let delayColor = [46, 204, 113, 255];
      let delayStatus = 'Normal';
      if (liveVolume > 15000) { delayColor = [139, 0, 0, 255]; delayStatus = 'Critical Overload'; }
      else if (liveVolume > 8000) { delayColor = [255, 51, 51, 255]; delayStatus = 'Congested'; }
      else if (liveVolume > 2000) { delayColor = [255, 204, 51, 255]; delayStatus = 'Moderate'; }

      return {
        ...f.properties,
        path: f.geometry.coordinates,
        liveVolume,
        delayColor,
        delayStatus
      };
    });
  }, [data, currentYear, filters]);

  const layers = useMemo(() => {
      const finalLayers: any = [
        new PathLayer({
          id: 'road-links',
          data: roadLinks,
          getPath: d => d.path,
          getColor: d => {
            if (filters.colorBy === 'Surface Type') {
              return d.surface_type === 'Bituminous' ? [0, 195, 255] : [255, 153, 51];
            }
            if (filters.colorBy === 'Road Class') {
              const classMap: any = { 
                'A': [255, 51, 102], // #ff3366
                'B': [0, 195, 255], // #00c3ff
                'C': [0, 234, 144], // #00ea90
                'M': [255, 204, 0]   // #ffcc00
              };
              return classMap[d.road_class] || [150, 150, 150];
            }
            if (filters.colorBy === 'Region') {
              const regions = Array.from(new Set(roadLinks.map(p => p.region)));
              const idx = regions.indexOf(d.region);
              return [(idx * 40) % 255, (idx * 90) % 255, (idx * 150) % 255];
            }
            return d.delayColor;
          },
          getWidth: 20,
          widthMinPixels: 3,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 150]
        }),
        
        // Highlight layer for selected link
        selectedLink ? new PathLayer({
          id: 'selected-link-highlight',
          data: [selectedLink],
          getPath: d => d.path,
          getColor: [255, 255, 0, 255],
          getWidth: 40,
          widthMinPixels: 6,
          pickable: false
        }) : null,

        new GeoJsonLayer({
          id: 'traffic-stations',
          data: stationData,
          getFillColor: f => f.properties.type === 'ATC' ? [0, 195, 255, 200] : [255, 204, 51, 200],
          getPointRadius: 200,
          pointRadiusMinPixels: 4,
          pickable: true,
          autoHighlight: true
        }),

        // Highlight for selected station
        selectedStation ? new ScatterplotLayer({
          id: 'selected-station-highlight',
          data: [selectedStation],
          getPosition: d => d.geometry.coordinates,
          getRadius: 400,
          radiusMinPixels: 10,
          getFillColor: [255, 255, 0, 255],
          pickable: false
        }) : null,

        new TripsLayer({
          id: 'flowing-traffic',
          data: roadLinks,
          getPath: d => d.path,
          getTimestamps: d => {
            const step = 10000 / (d.path.length || 1);
            return d.path.map((_, i) => i * step);
          },
          getColor: [255, 255, 255, 255],
          opacity: 0.9,
          widthMinPixels: 4,
          trailLength: 800,
          currentTime: time
        }),

        districtRoads ? new GeoJsonLayer({
          id: 'district-roads',
          data: districtRoads,
          getLineColor: [150, 150, 150, 180],
          getLineWidth: 1,
          lineWidthMinPixels: 1,
          getDashArray: [4, 4],
          dashJustified: true,
          extensions: [dashExtension as any],
          pickable: false
        }) : null,
        

      ].filter(Boolean);

      return finalLayers;
  }, [roadLinks, mapMode, time, districtRoads, filters.colorBy, selectedLink, selectedStation]);

  const cursorStyle = mouseMode === 'select' ? 'pointer' : (mouseMode === 'zoom' ? 'zoom-in' : 'grab');

  const getTooltip = ({ object, layer }: any) => {
    if (!object) return null;
    

    
    if (layer.id === 'traffic-stations') {
      return {
        html: `
          <div class="deck-tooltip" style="border-left: 4px solid ${object.properties.type === 'ATC' ? '#00c3ff' : '#ffcc33'};">
            <h3>📡 ${object.properties.road_section || object.properties.site_id}</h3>
            <p style="margin-top: 8px;">Station Type: <strong style="color: ${object.properties.type === 'ATC' ? '#00c3ff' : '#ffcc33'}">${object.properties.type === 'ATC' ? 'Automatic Counting' : 'Manual Counting'}</strong></p>
            <p>Status: <strong>${object.properties.status}</strong></p>
          </div>
        `
      };
    }
    
    return {
      html: `
        <div class="deck-tooltip" style="border-left: 4px solid rgb(${object.delayColor.join(',')}); min-width: 250px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 18px;">🗺️</span>
            <h3 style="margin: 0; font-size: 18px; color: #fff;">${object.link_name || object.link_id || 'Network Link'}</h3>
          </div>
          <p style="margin: 4px 0; color: #8e92a4; font-size: 13px;">Analysis Date: <strong style="color: #fff;">${formatFractionalYearToDate(currentYear)}</strong></p>
          <div style="margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
            <p style="color:rgb(${object.delayColor.join(',')}); font-weight:bold; font-size: 14px; margin-bottom: 8px;">
              Traffic Status: ${object.delayStatus}
            </p>
            <p style="margin: 4px 0; font-size: 13px; color: #8e92a4;">Calculated ADT: <strong style="color: #fff;">${Math.round(object.liveVolume).toLocaleString()} veh</strong></p>
            <p style="margin: 4px 0; font-size: 13px; color: #8e92a4;">Surface: <strong style="color: #fff;">${object.surface_type || 'N/A'}</strong> | Class: <strong style="color: #fff;">${object.road_class || 'N/A'}</strong></p>
          </div>
        </div>
      `
    };
  };

  const mapStyle: any = useMemo(() => ({
    version: 8,
    name: 'Satellite Hybrid',
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics'
      },
      'carto-labels': {
        type: 'raster',
        tiles: [
          'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}@2x.png'
        ],
        tileSize: 256,
        attribution: '© CARTO, © OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'satellite-tiles',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 19
      },
      {
        id: 'label-tiles',
        type: 'raster',
        source: 'carto-labels',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }), []);

  return (
    <div className="map-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={{
          dragPan: mouseMode === 'pan',
          scrollZoom: mouseMode === 'zoom' || mouseMode === 'pan',
          doubleClickZoom: true,
          touchRotate: true
        }}
        layers={layers}
        getTooltip={getTooltip}
        getCursor={() => cursorStyle}
        onClick={(info, event) => {
          const isDoubleClick = (event as any)?.srcEvent?.detail >= 2;
          if (mouseMode !== 'select' && !isDoubleClick) return;
          if (!info.object) {
            onSelectLink(null);
            onSelectStation(null);
            return;
          }
          if (info.layer && info.layer.id === 'traffic-stations') {
            onSelectStation(info.object);
            onSelectLink(null);
          } else {
            onSelectLink(info.object);
            onSelectStation(null);
          }
        }}
      >
        <Map
          mapStyle={mapStyle}
          reuseMaps
        />

        {/* Mouse Mode Toggle UI */}
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 1000,
          background: 'rgba(10,15,30,0.8)',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid var(--border-neon)',
          backdropFilter: 'blur(10px)'
        }}>
          {[
            { id: 'pan', icon: <Navigation size={20} />, label: 'Pan' },
            { id: 'select', icon: <Activity size={20} />, label: 'Select' },
            { id: 'zoom', icon: <Layers size={20} />, label: 'Zoom' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setMouseMode(mode.id)}
              title={mode.label}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: mouseMode === mode.id ? 'var(--accent-teal)' : 'transparent',
                border: 'none',
                color: mouseMode === mode.id ? '#000' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: mouseMode === mode.id ? '0 0 15px var(--accent-teal)' : 'none'
              }}
            >
              {mode.icon}
            </button>
          ))}
        </div>
      </DeckGL>
    </div>
  );
}
