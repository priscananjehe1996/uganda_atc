import React from 'react';
import { Map as MapIcon, Grid, Hexagon } from 'lucide-react';

export default function LegendRightPanel({ filters, setFilters, mapMode, setMapMode }) {
  const handleFilter = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="sidebar-right">
      
      {/* Map Mode Segment Control */}
      <div className="seg-control" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-neon)' }}>
        <button className={`seg-btn ${mapMode === 'Routes' ? 'active' : ''}`} onClick={() => setMapMode('Routes')}>
          <MapIcon size={16} /> Routes
        </button>
        <button className={`seg-btn ${mapMode === 'Heatmap' ? 'active' : ''}`} onClick={() => setMapMode('Heatmap')}>
          <Hexagon size={16} /> Heatmap
        </button>
      </div>

      {/* Embedded Legend matching explicitly active Colour Mode */}
      {(() => {
        if (filters.colorBy === 'Overload Risk') {
          return (
            <div className="filter-section" style={{ display: 'flex', border: 'none', padding: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <div style={{ flex: 1, textAlign: 'center', background: '#ff00ff', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>High (&gt;25%)</div>
              <div style={{ flex: 1, textAlign: 'center', background: '#ff69b4', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>Med (&gt;15%)</div>
              <div style={{ flex: 1, textAlign: 'center', background: '#00ffff', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>Low (&lt;15%)</div>
            </div>
          );
        } else if (filters.colorBy === 'Surface Type') {
          return (
            <div className="filter-section" style={{ display: 'flex', border: 'none', padding: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <div style={{ flex: 1, textAlign: 'center', background: '#4db6ac', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>Paved</div>
              <div style={{ flex: 1, textAlign: 'center', background: '#ff9933', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>Unsealed</div>
            </div>
          );
        } else if (filters.colorBy === 'Road Class') {
          return (
            <div className="filter-section" style={{ display: 'flex', border: 'none', padding: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <div style={{ flex: 1, textAlign: 'center', background: '#ff3366', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>Class A</div>
              <div style={{ flex: 1, textAlign: 'center', background: '#00c3ff', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>Class B</div>
              <div style={{ flex: 1, textAlign: 'center', background: '#00ea90', color: '#000', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>Class C</div>
            </div>
          );
        } else if (filters.colorBy === 'Region') {
          return (
            <div className="filter-section" style={{ display: 'flex', border: 'none', padding: 0, overflow: 'hidden', borderRadius: '8px' }}>
              <div style={{ flex: 1, textAlign: 'center', background: '#646464', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 2px' }}>All Regions (Default)</div>
            </div>
          );
        } else {
          return (
            <div className="filter-section" style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', padding: 0 }}>
              <span style={{ fontSize: '11px', color: '#fff', fontStyle: 'italic', paddingRight: '4px' }}>Fast</span>
              <div style={{ flex: 1, height: '14px', background: '#2ecc71', borderRadius: '4px' }}></div>
              <div style={{ flex: 1, height: '14px', background: '#ffcc33', borderRadius: '4px' }}></div>
              <div style={{ flex: 1, height: '14px', background: '#ff3333', borderRadius: '4px' }}></div>
              <div style={{ flex: 1, height: '14px', background: '#8b0000', borderRadius: '4px' }}></div>
              <span style={{ fontSize: '11px', color: '#fff', fontStyle: 'italic', paddingLeft: '4px' }}>Slow</span>
            </div>
          );
        }
      })()}

      {/* Main Settings */}
      <div className="filter-section">
        
        <div className="filter-header">MAP SYMBOLOGY</div>
        <div className="filter-row" style={{ marginBottom: '16px' }}>
          <select 
            className="dropdown-select" 
            value={filters.colorBy} 
            onChange={(e) => handleFilter('colorBy', e.target.value)}
            style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-neon)', borderRadius: '4px' }}
          >
            <option value="Traffic Delay">Traffic Delay (Numeric AADT)</option>
            <option value="Overload Risk">Overload Risk (HGV)</option>
            <option value="Surface Type">Surface Type (Material)</option>
            <option value="Road Class">Road Class (ABC)</option>
          </select>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }} />

        <div className="filter-header">FILTER MAP RESULTS</div>
        
        <div className="filter-row">
          <div className="filter-row-label">Surface</div>
          <div className="btn-group">
            <button className={`filter-btn ${filters.surface === 'All' ? 'active' : ''}`} onClick={() => handleFilter('surface', 'All')}>All</button>
            <button className={`filter-btn ${filters.surface === 'Paved' ? 'active' : ''}`} onClick={() => handleFilter('surface', 'Paved')}>Paved</button>
            <button className={`filter-btn ${filters.surface === 'Unsealed' ? 'active' : ''}`} onClick={() => handleFilter('surface', 'Unsealed')}>Unsealed</button>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-row-label">Class</div>
          <div className="btn-group">
            <button className={`filter-btn ${filters.class === 'All' ? 'active' : ''}`} onClick={() => handleFilter('class', 'All')}>All</button>
            <button className={`filter-btn ${filters.class === 'A' ? 'active' : ''}`} onClick={() => handleFilter('class', 'A')}>A</button>
            <button className={`filter-btn ${filters.class === 'B' ? 'active' : ''}`} onClick={() => handleFilter('class', 'B')}>B</button>
            <button className={`filter-btn ${filters.class === 'C' ? 'active' : ''}`} onClick={() => handleFilter('class', 'C')}>C</button>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-row-label">Region</div>
          <select 
            className="dropdown-select" 
            value={filters.region} 
            onChange={(e) => handleFilter('region', e.target.value)}
          >
            <option value="All Regions">All Regions</option>
            <option value="Central">Central</option>
            <option value="National">National</option>
          </select>
        </div>

      </div>

    </div>
  );
}
