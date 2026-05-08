import React, { useMemo, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import stationData from '../data/stations.json';

const INITIAL_VIEW_STATE = {
  longitude: 32.222,
  latitude: 1.341,
  zoom: 6.5,
  pitch: 45,
  bearing: 0
};

export default function MapComponent({ data, currentYear, filters, mapMode, onSelectLink }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrame;
    if (mapMode === 'Routes') {
      const animate = () => {
        setTime(t => (t + 40) % 10000);
        animationFrame = requestAnimationFrame(animate);
      };
      animate();
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [mapMode]);

  const layers = useMemo(() => {
    if (!data || !data.features || !filters) return [];

    // Filter properties exactly as before
    let filteredFeatures = data.features.filter((f: any) => {
      const p = f.properties;
      if (filters.surface !== 'All' && p.surface_type !== filters.surface) return false;
      if (filters.class !== 'All' && p.road_class !== filters.class) return false;
      if (filters.region !== 'All Regions' && p.region !== filters.region) return false;
      return true;
    });

    // Map each LineString feature from the exact shapefiles
    const points = filteredFeatures.map((f: any) => {
      const aadt2025 = f.properties.aadt_2025 || 10000;
      const compoundGrowth = Math.pow(1.05, currentYear - 2025);
      const liveVolume = aadt2025 * compoundGrowth;
      const overloadRate = f.properties.overload_rate || 0.1;
      const overloadVehicles = liveVolume * overloadRate;
      
      // Synthesize structural capacity
      const pseudoRandomSpread = (aadt2025 % 1000) / 1000;
      const infraCapacityLimit = aadt2025 * (0.50 + pseudoRandomSpread * 0.8); 

      // Strictly map the TRAFFIC NUMERICALLY AS PER THE SOURCE DATA volume bands:
      let delayStatus = 'Fast';
      let delayColor = [46, 204, 113, 255]; // Fast (Green): < 2,000 AADT
      
      if (liveVolume > 15000) {
        delayStatus = 'Slow';
        delayColor = [139, 0, 0, 255]; // Very Slow (Dark Red): > 15,000 AADT
      } else if (liveVolume > 8000) {
        delayStatus = 'Medium delay';
        delayColor = [255, 51, 51, 255]; // Red: 8,000 - 15,000 AADT
      } else if (liveVolume > 2000) {
        delayStatus = 'Minor delay';
        delayColor = [255, 204, 51, 255]; // Yellow: 2,000 - 8,000 AADT
      }

      let overloadColor = [0, 255, 255, 255]; // Cyan (Low Risk)
      if (overloadRate > 0.25) {
        overloadColor = [255, 0, 255, 255]; // Magenta (High Risk)
      } else if (overloadRate > 0.15) {
        overloadColor = [255, 105, 180, 255]; // Hot Pink (Medium Risk)
      }

      return {
        ...f.properties,
        path: f.geometry.coordinates,
        node_position: f.properties.node_position, // Derived center point
        timestamps: f.properties.timestamps, // Synthetic array [0 ... 10000]
        aadtBase: aadt2025,
        liveVolume: liveVolume,
        infraCapacityLimit,
        overloadRate: overloadRate,
        overloadVehicles: overloadVehicles,
        delayStatus,
        delayColor,
        overloadColor
      };
    });

    if (mapMode === 'Heatmap') {
      return [
        new HexagonLayer({
          id: 'traffic-hex-heatmap',
          data: points,
          pickable: true,
          extruded: false, 
          radius: 6000,
          elevationScale: 0,
          // Cluster strictly on the node center
          getPosition: d => d.node_position,
          getWeight: d => filters.colorBy === 'Overload Risk' ? d.overloadVehicles : d.liveVolume,
          colorRange: filters.colorBy === 'Overload Risk' ? [
            [0, 255, 255], [0, 191, 255], [138, 43, 226], [255, 0, 255], [255, 20, 147], [139, 0, 0]
          ] : [
            [255, 235, 59], [255, 193, 7], [255, 152, 0], [255, 87, 34], [244, 67, 54], [211, 47, 47]
          ]
        })
      ];
    } else {
      
      const getDynamicColor = (d: any) => {
        if (filters.colorBy === 'Overload Risk') return d.overloadColor;
        if (filters.colorBy === 'Traffic Delay') return d.delayColor;
        if (filters.colorBy === 'Surface Type') return d.surface_type === 'Paved' ? [77,182,172,255] : [255,153,51,255];
        if (filters.colorBy === 'Road Class') return d.road_class === 'A' ? [255,51,102,255] : d.road_class === 'B' ? [0,195,255,255] : [0,234,144,255];
        return [100, 100, 100, 150];
      };

      const finalLayers = [];

      finalLayers.push(
        // Traffic Counting Stations plotting (Circle for manual, Hex/Square for ATCs)
        new ScatterplotLayer({
          id: 'traffic-stations',
          data: stationData.features,
          getPosition: d => d.geometry.coordinates,
          getFillColor: d => d.properties.has_atc ? [0, 195, 255, 255] : [255, 204, 51, 200], // Cyan (ATC), Yellow (Manual)
          getLineColor: [255, 255, 255],
          getLineWidth: 2,
          radiusMinPixels: 4,
          radiusMaxPixels: 12,
          getRadius: d => d.properties.has_atc ? 600 : 400,
          lineWidthMinPixels: 1,
          pickable: true
        }),
        // Reflect active Ribbon Map contextual color mode dynamically across the base geometry
        new PathLayer({
          id: 'road-network-paths',
          data: points,
          getPath: d => d.path,
          getColor: d => getDynamicColor(d),
          getWidth: 2.5,
          widthMinPixels: 2.5,
          pickable: true
        }),
        // Flowing Traffic Overlay
        new TripsLayer({
          id: 'traffic-flow-animation',
          data: points,
          getPath: d => d.path,
          getTimestamps: d => d.timestamps,
          getColor: d => [255, 255, 255, 255], // Pure white traffic particles over colored roads
          opacity: 0.9,
          widthMinPixels: 4,
          trailLength: 800,
          currentTime: time
        })
      );

      return finalLayers;
    }

  }, [data, currentYear, filters, mapMode, time]);

  const getTooltip = ({ object, layer }) => {
    if (!object) return null;
    
    if (layer.id === 'traffic-hex-heatmap') {
      return {
        html: `
          <div class="deck-tooltip" style="border-left: 4px solid #fff">
            <h3>Hexagonal Zone Load (${currentYear})</h3>
            <p style="color:var(--accent-orange); font-weight:bold; font-size: 15px;">
              ${Math.round(object.colorValue || 0).toLocaleString()} aggregated
            </p>
            <p>Monitored Node Count: <strong>${object.points.length}</strong></p>
          </div>
        `
      };
    }
    
    if (layer.id === 'traffic-stations') {
      return {
        html: `
          <div class="deck-tooltip" style="border-left: 4px solid ${object.properties.has_atc ? '#00c3ff' : '#ffcc33'};">
            <h3>📡 ${object.properties.name}</h3>
            <p style="margin-top: 8px;">Station Type: <strong style="color: ${object.properties.has_atc ? '#00c3ff' : '#ffcc33'}">${object.properties.has_atc ? 'Equipped with ATC' : 'Manual Counting'}</strong></p>
            <p>Status: <strong>${object.properties.status}</strong></p>
          </div>
        `
      };
    }
    
    if (layer.id === 'road-network-paths') {
      return {
        html: `
          <div class="deck-tooltip" style="border-left: 4px solid rgb(${object.delayColor.join(',')})">
            <h3>🚏 ${object.road_section}</h3>
            <p>Analysis Year: <strong style="font-size: 16px">${currentYear}</strong></p>
            <hr style="margin:8px 0;border-color:rgba(255,255,255,0.1)">
            <p style="color:rgb(${object.delayColor.join(',')}); font-weight:bold; font-size: 14px; margin-bottom: 4px;">
              Traffic Status: ${object.delayStatus}
            </p>
            <p style="color:rgb(${object.overloadColor.join(',')}); font-weight:bold; font-size: 14px; margin-bottom: 8px;">
              Overload Risk: ${(object.overloadRate * 100).toFixed(1)}% HGVs
            </p>
            <p>Calculated AADT: <strong>${Math.round(object.liveVolume).toLocaleString()} veh</strong></p>
            <p>Surface: <strong>${object.surface_type}</strong> | Class: <strong>${object.road_class}</strong></p>
          </div>
        `
      };
    }
    return null;
  };

  return (
    <div className="map-container">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={getTooltip}
        onClick={(info) => onSelectLink && onSelectLink(info.object || null)}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json"
          reuseMaps
        />
      </DeckGL>
    </div>
  );
}
