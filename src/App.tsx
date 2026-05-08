import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import LegendRightPanel from './components/LegendRightPanel';
import RoadLinkDetails from './components/RoadLinkDetails';
import InfographicsDashboard from './components/InfographicsDashboard';
import roadLinksData from './data/road_links.json';
import { Play, Pause, Calendar, Droplets, TrafficCone, Layers, Compass, BarChart2 } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<any>(null);
  
  const currentActualYear = new Date().getFullYear(); // 2026 based on mock system date
  const [currentYear, setCurrentYear] = useState(2016);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [showInfographics, setShowInfographics] = useState(false);
  
  const [mapMode, setMapMode] = useState('Routes'); // 'Routes' or 'Heatmap'

  const [filters, setFilters] = useState({
    colorBy: 'Traffic Delay', // Traffic Delay, Surface Type, Road Class, Region
    surface: 'All',
    class: 'All',
    region: 'All Regions'
  });

  useEffect(() => {
    setData(roadLinksData); 
    
    // Safety auto-refresh exactly every 60 seconds (60000 ms) ensuring dashboard stays pristine and memory safe
    const safeRefresh = setInterval(() => {
      window.location.reload();
    }, 60000);
    return () => clearInterval(safeRefresh);
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentYear(prev => {
          if (prev >= currentActualYear) {
            setIsPlaying(false);
            return currentActualYear;
          }
          // Increment accurately but keep it smooth with decimal years, or just integer jumps
          // Using increments of 1 year per second
          return prev + 1;
        });
      }, 1000); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentActualYear]);

  return (
    <div className="app-container">
      
      <MapComponent data={data} currentYear={currentYear} filters={filters} mapMode={mapMode} onSelectLink={setSelectedLink} />
      
      <Sidebar data={data} currentYear={currentYear} />
      <LegendRightPanel filters={filters} setFilters={setFilters} mapMode={mapMode} setMapMode={setMapMode} />
      
      <RoadLinkDetails link={selectedLink} currentActualYear={currentActualYear} onClose={() => setSelectedLink(null)} />
      
      {showInfographics && <InfographicsDashboard onClose={() => setShowInfographics(false)} />}
      
      {/* Top Left Deep Analytics Button */}
      <button 
        onClick={() => setShowInfographics(true)}
        style={{
          position: 'absolute',
          top: 32,
          left: 450,
          zIndex: 10,
          background: 'rgba(0, 195, 255, 0.1)',
          border: '1px solid #00c3ff',
          color: '#00c3ff',
          padding: '12px 24px',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 12px rgba(0, 195, 255, 0.2)'
        }}
      >
        <BarChart2 size={20} /> Deep Class Analytics (20+ Charts)
      </button>

      {/* Timeseries Play Panel */}
      <div className="glass-panel" style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        zIndex: 10,
        borderRadius: '32px',
        border: '1px solid var(--border-neon)'
      }}>
        <button 
          onClick={() => {
            if (!isPlaying) {
              if (currentYear >= currentActualYear) {
                setCurrentYear(2016);
              }
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          }}
          style={{
            background: 'var(--accent-red)',
            border: 'none',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            boxShadow: '0 4px 12px rgba(255, 51, 102, 0.4)'
          }}
        >
          {isPlaying ? <Pause fill="white" /> : <Play fill="white" />}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--accent-teal)" />
              National Network Timeline
            </span>
            <span style={{ color: 'var(--accent-red)', fontSize: '18px', fontVariantNumeric: 'tabular-nums' }}>
              {currentYear}
            </span>
          </div>
          <input 
            type="range" 
            min={2016} 
            max={currentActualYear} 
            value={currentYear} 
            onChange={(e) => {
              setCurrentYear(Number(e.target.value));
              setIsPlaying(false);
            }}
            style={{ width: '100%', accentColor: 'var(--accent-red)', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>2016</span>
            <span>{currentActualYear} (Now)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
