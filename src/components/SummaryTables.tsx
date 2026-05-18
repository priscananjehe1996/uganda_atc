import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Search, Filter } from 'lucide-react';
import stationJson from '../data/stations.json'; // Small enough to import

export default function SummaryTables({ data }) {
  const [activeTable, setActiveTable] = useState('links');
  const [activeYear, setActiveYear] = useState(2025);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null as string | null, direction: 'asc' });
  const years = Array.from({ length: 20 }, (_, i) => 2016 + i);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const links = data?.features ? data.features.map((f: any) => f.properties) : [];
  const stations = stationJson.features.map((f: any) => f.properties);

  const allVehicleClasses = Array.from(new Set(links.flatMap((l: any) => Object.keys(l.vehicle_classes || {})))).slice(0, 11);

  const filteredLinks = links.filter(l => 
    (l.link_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.road_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStations = stations.filter(s => 
    (s.road_section || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (String(s.site_id) || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    // Handle dynamic vehicle class sorting
    if (sortConfig.key && sortConfig.key.startsWith('vc_')) {
      const vc = sortConfig.key.replace('vc_', '');
      const scaleA = a.aadt_2025 ? (a.trajectory && a.trajectory[activeYear] ? a.trajectory[activeYear] : 0) / a.aadt_2025 : 0;
      const scaleB = b.aadt_2025 ? (b.trajectory && b.trajectory[activeYear] ? b.trajectory[activeYear] : 0) / b.aadt_2025 : 0;
      const aVal = a.vehicle_classes && a.vehicle_classes[vc] ? a.vehicle_classes[vc] * scaleA : 0;
      const bVal = b.vehicle_classes && b.vehicle_classes[vc] ? b.vehicle_classes[vc] * scaleB : 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    }

    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const sortedStations = [...filteredStations].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const exportCSV = () => {
    const targetData = activeTable === 'links' ? sortedLinks : sortedStations;
    if (targetData.length === 0) return;
    
    const headers = Object.keys(targetData[0]).join(",");
    const rows = targetData.map(row => {
      return Object.values(row).map(v => {
        const str = String(v).replace(/"/g, '""');
        return `"${str}"`;
      }).join(",");
    });
    
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `uganda_traffic_prediction_${activeTable}_${activeYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        right: '20px',
        bottom: '20px',
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 195, 255, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setActiveTable('links')}
            style={{
              background: activeTable === 'links' ? 'rgba(0,195,255,0.2)' : 'transparent',
              border: `1px solid ${activeTable === 'links' ? '#00c3ff' : 'rgba(255,255,255,0.2)'}`,
              color: activeTable === 'links' ? '#00c3ff' : '#8e92a4',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            Road Links Data
          </button>
          <button 
            onClick={() => setActiveTable('stations')}
            style={{
              background: activeTable === 'stations' ? 'rgba(255,204,51,0.2)' : 'transparent',
              border: `1px solid ${activeTable === 'stations' ? '#ffcc33' : 'rgba(255,255,255,0.2)'}`,
              color: activeTable === 'stations' ? '#ffcc33' : '#8e92a4',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            Traffic Counting Stations
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#8e92a4" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '8px 16px 8px 32px',
                borderRadius: '8px',
                width: '250px'
              }}
            />
          </div>
          <button 
            onClick={exportCSV}
            style={{ background: 'rgba(255,51,102,0.2)', border: '1px solid #ff3366', color: '#ff3366', padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {activeTable === 'links' && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px' }}>
          {years.map(y => (
            <button
              key={y}
              onClick={() => setActiveYear(y)}
              style={{
                background: activeYear === y ? 'rgba(0, 234, 144, 0.2)' : 'rgba(0,0,0,0.4)',
                border: `1px solid ${activeYear === y ? '#00ea90' : 'rgba(255,255,255,0.1)'}`,
                color: activeYear === y ? '#00ea90' : '#8e92a4',
                padding: '6px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(10, 15, 30, 0.95)', borderBottom: '2px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
            {activeTable === 'links' ? (
              <tr>
                <th onClick={() => handleSort('link_id')} style={{ padding: '12px 16px', color: '#00c3ff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Link ID {sortConfig.key === 'link_id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('link_name')} style={{ padding: '12px 16px', color: '#00c3ff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Road Name {sortConfig.key === 'link_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('road_class')} style={{ padding: '12px 16px', color: '#00c3ff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Class {sortConfig.key === 'road_class' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('surface_type')} style={{ padding: '12px 16px', color: '#00c3ff', cursor: 'pointer', whiteSpace: 'nowrap' }}>Surface {sortConfig.key === 'surface_type' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('length_km')} style={{ padding: '12px 16px', color: '#00c3ff', textAlign: 'right', cursor: 'pointer', whiteSpace: 'nowrap' }}>Length (km) {sortConfig.key === 'length_km' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th style={{ padding: '12px 16px', color: '#00ea90', textAlign: 'right', whiteSpace: 'nowrap' }}>Total ADT ({activeYear})</th>
                <th style={{ padding: '12px 16px', color: '#4db6ac', textAlign: 'right', whiteSpace: 'nowrap' }}>ADT (incl. MC)</th>
                <th style={{ padding: '12px 16px', color: '#b366ff', textAlign: 'right', whiteSpace: 'nowrap' }}>ADT (excl. MC)</th>
                <th style={{ padding: '12px 16px', color: '#fcee0a', textAlign: 'right', whiteSpace: 'nowrap' }}>NMT</th>
                <th style={{ padding: '12px 16px', color: '#ff3366', textAlign: 'left', whiteSpace: 'nowrap' }}>Growth Alert</th>
                {allVehicleClasses.map(vc => (
                  <th key={vc} onClick={() => handleSort(`vc_${vc as string}`)} style={{ padding: '12px 16px', color: '#ffcc33', textAlign: 'right', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {vc as string} {sortConfig.key === `vc_${vc as string}` ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            ) : (
              <tr>
                <th onClick={() => handleSort('site_id')} style={{ padding: '12px 16px', color: '#ffcc33', cursor: 'pointer' }}>Station ID {sortConfig.key === 'site_id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('road_section')} style={{ padding: '12px 16px', color: '#ffcc33', cursor: 'pointer' }}>Location / Direction {sortConfig.key === 'road_section' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('type')} style={{ padding: '12px 16px', color: '#ffcc33', cursor: 'pointer' }}>Type {sortConfig.key === 'type' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('status')} style={{ padding: '12px 16px', color: '#ffcc33', cursor: 'pointer' }}>Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeTable === 'links' && sortedLinks.map((row: any, i: number) => {
              // Determine if volume dropped from previous year
              const prevVol = row.trajectory && row.trajectory[activeYear - 1] ? row.trajectory[activeYear - 1] : 0;
              const currVol = row.trajectory && row.trajectory[activeYear] ? row.trajectory[activeYear] : 0;
              const isDrop = activeYear > 2016 && currVol > 0 && prevVol > 0 && currVol < prevVol;
              
              // Or if growth rate is negative generally
              const isNegativeGrowth = row.growth_rate && row.growth_rate < 0;
              const markRed = isDrop || isNegativeGrowth;
              const justification = markRed ? (row.surface_type === 'Unsealed' ? 'Rehabilitation/Upgrade Closure' : 'Projected Decline / Route Shift') : '-';

              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: markRed ? 'rgba(255,51,102,0.1)' : (i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)') }}>
                  <td style={{ padding: '10px 16px', color: '#8e92a4', whiteSpace: 'nowrap' }}>{row.link_id}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 'bold', whiteSpace: 'nowrap', color: markRed ? '#ff3366' : '#fff' }}>{row.link_name}</td>
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>{row.road_class}</td>
                  <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>{row.surface_type}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>{row.length_km}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: markRed ? '#ff3366' : '#00ea90', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {currVol ? Math.round(currVol).toLocaleString() : '-'}
                  </td>
                  {(() => {
                    const scale = row.aadt_2025 ? (currVol / row.aadt_2025) : 0;
                    const vc = row.vehicle_classes || {};
                    const mcVal = (vc['Motorcycles'] || 0) * scale;
                    const nmt = (vc['Bicycles'] || 0) * scale + (vc['Pedestrians'] || 0) * scale;
                    const adtInclMC = currVol ? Math.round(currVol) : 0;
                    const adtExclMC = currVol ? Math.round(currVol - mcVal) : 0;
                    return (
                      <>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#4db6ac', whiteSpace: 'nowrap' }}>{adtInclMC > 0 ? adtInclMC.toLocaleString() : '-'}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#b366ff', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{adtExclMC > 0 ? adtExclMC.toLocaleString() : '-'}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#fcee0a', whiteSpace: 'nowrap' }}>{nmt > 0 ? Math.round(nmt).toLocaleString() : '-'}</td>
                      </>
                    );
                  })()}
                  <td style={{ padding: '10px 16px', textAlign: 'left', color: markRed ? '#ff3366' : '#8e92a4', whiteSpace: 'nowrap', fontStyle: 'italic', fontSize: '11px' }}>
                    {justification}
                  </td>
                  {allVehicleClasses.map(vc => {
                    const scale = row.aadt_2025 ? (currVol / row.aadt_2025) : 0;
                    const val = row.vehicle_classes && row.vehicle_classes[vc as string] ? Math.round(row.vehicle_classes[vc as string] * scale) : 0;
                    return (
                      <td key={vc as string} style={{ padding: '10px 16px', textAlign: 'right', color: markRed ? '#ff99a8' : '#fff', whiteSpace: 'nowrap' }}>
                        {val > 0 ? val.toLocaleString() : '-'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {activeTable === 'stations' && sortedStations.map((row: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '10px 16px', color: '#8e92a4' }}>{row.site_id}</td>
                <td style={{ padding: '10px 16px', fontWeight: 'bold' }}>{row.road_section}</td>
                <td style={{ padding: '10px 16px', color: row.type === 'ATC' ? '#00c3ff' : '#ffcc33' }}>{row.type === 'ATC' ? 'Automatic' : row.type}</td>
                <td style={{ padding: '10px 16px', color: row.status === 'Active' ? '#00ea90' : '#ff3366' }}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
