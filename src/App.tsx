import React, { useState, useEffect } from 'react';
import MapComponent from './components/MapComponent';
import LegendRightPanel from './components/LegendRightPanel';
import RoadLinkDetails from './components/RoadLinkDetails';
import StationDetailsPane from './components/StationDetailsPane';
import SummaryTables from './components/SummaryTables';
import InfographicsDashboard from './components/InfographicsDashboard';
import TimePanel from './components/TimePanel';
import { Play, Pause, Calendar, Droplets, TrafficCone, Layers, Compass, BarChart2, Activity } from 'lucide-react';
import { formatFractionalYearToDate } from './constants';

export default function App() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const getRealTimeYear = () => {
    const n = new Date();
    const startOfYear = new Date(n.getFullYear(), 0, 1).getTime();
    const endOfYear = new Date(n.getFullYear() + 1, 0, 1).getTime();
    return n.getFullYear() + (n.getTime() - startOfYear) / (endOfYear - startOfYear);
  };
  const currentActualYear = new Date().getFullYear();
  const [currentYear, setCurrentYear] = useState(getRealTimeYear);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [selectedLink, setSelectedLink] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState('Map');
  
  const [mapMode, setMapMode] = useState('Routes'); // 'Routes' or 'Heatmap'

  const [filters, setFilters] = useState({
    colorBy: 'Traffic Delay', // Traffic Delay, Surface Type, Road Class, Region
    surface: 'All',
    class: 'All',
    region: 'All Regions'
  });

  const [deepAnalyticsData, setDeepAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [linksRes, deepRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}road_links.json`),
          fetch(`${import.meta.env.BASE_URL}data/multidimensional_growth_summaries.json`)
        ]);

        if (!linksRes.ok) throw new Error(`Links Fetch Error: ${linksRes.status}`);
        const linksJson = await linksRes.json();
        setData(linksJson);

        if (deepRes.ok) {
          const deepJson = await deepRes.json();
          setDeepAnalyticsData(deepJson);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("CRITICAL: Failed to load data", err);
        setIsLoading(false);
      }
    };
    loadData();
  }, []);


  // Real-time clock sync: update every second when in live mode
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      setIsLiveMode(false);
      interval = setInterval(() => {
        setCurrentYear(prev => {
          if (prev >= 2035) return 2016;
          return prev + (1/12);
        });
      }, 500);
    } else if (isLiveMode && activeTab === 'Map') {
      interval = setInterval(() => {
        setCurrentYear(getRealTimeYear());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isLiveMode, activeTab]);

  if (isLoading) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0b10', color: '#fff' }}>
        <Activity size={48} color="#00c3ff" style={{ marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', letterSpacing: '2px' }}>INITIALIZING ENGINE</h2>
        <p style={{ color: '#8e92a4', margin: 0 }}>Loading National Network Data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0b10', color: '#fff', padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#ff3366', fontSize: '48px', marginBottom: '16px' }}>⚠</div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>DATA LOAD FAILURE</h2>
        <p style={{ color: '#8e92a4', maxWidth: '400px' }}>
          Could not connect to the traffic analytics server. Please check your internet connection and refresh.
        </p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '24px', padding: '12px 24px', background: '#ff3366', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>
          Retry Initialization
        </button>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Horizontal Navigation Pane */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(10, 15, 30, 0.7)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 195, 255, 0.3)',
        borderRadius: '24px',
        display: 'flex',
        padding: '4px',
        zIndex: 100,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}>
        <button
          onClick={() => setActiveTab('Map')}
          style={{
            background: activeTab === 'Map' ? 'rgba(0,195,255,0.2)' : 'transparent',
            color: activeTab === 'Map' ? '#00c3ff' : '#8e92a4',
            border: 'none',
            padding: '8px 24px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Geospatial Map
        </button>
        <button
          onClick={() => setActiveTab('Tables')}
          style={{
            background: activeTab === 'Tables' ? 'rgba(0,195,255,0.2)' : 'transparent',
            color: activeTab === 'Tables' ? '#00c3ff' : '#8e92a4',
            border: 'none',
            padding: '8px 24px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Summary Tables
        </button>
        <button
          onClick={() => setActiveTab('Analytics')}
          style={{
            background: activeTab === 'Analytics' ? 'rgba(0,195,255,0.2)' : 'transparent',
            color: activeTab === 'Analytics' ? '#00c3ff' : '#8e92a4',
            border: 'none',
            padding: '8px 24px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
        >
          Deep Analytics
        </button>
      </div>

      {activeTab === 'Map' && (
        <>
          <MapComponent 
            data={data} 
            currentYear={currentYear} 
            filters={filters} 
            mapMode={mapMode} 
            selectedLink={selectedLink}
            selectedStation={selectedStation}
            onSelectLink={setSelectedLink} 
            onSelectStation={setSelectedStation}
          />

          <LegendRightPanel filters={filters} setFilters={setFilters} mapMode={mapMode} setMapMode={setMapMode} />
          
          <RoadLinkDetails link={selectedLink} currentActualYear={currentActualYear} onClose={() => setSelectedLink(null)} />
          <StationDetailsPane station={selectedStation} onClose={() => setSelectedStation(null)} />

          {/* Timeseries Play Panel */}
          <div className="play-panel-container" style={{ position: 'absolute', bottom: '32px', right: '24px', zIndex: 1000, display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
             <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: 'rgba(255, 51, 102, 0.95)',
                border: 'none',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                boxShadow: '0 8px 32px rgba(255, 51, 102, 0.5)',
                backdropFilter: 'blur(10px)',
                zIndex: 1001,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {isPlaying ? <Pause fill="white" size={32} /> : <Play fill="white" size={32} />}
            </button>
            <TimePanel currentYear={currentYear} setCurrentYear={setCurrentYear} isLiveMode={isLiveMode} setIsLiveMode={setIsLiveMode} />
          </div>
        </>
      )}

      {activeTab === 'Tables' && <SummaryTables data={data} />}
      
      {activeTab === 'Analytics' && <InfographicsDashboard onClose={() => setActiveTab('Map')} data={data} currentYear={currentYear} deepAnalyticsData={deepAnalyticsData} />}
    </div>
  );
}
