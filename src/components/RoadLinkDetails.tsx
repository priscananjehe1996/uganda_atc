import React, { useMemo } from 'react';
import { X, Navigation, Route, AlertTriangle, Layers, CalendarRange, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function RoadLinkDetails({ link, currentActualYear, onClose }) {
  if (!link) return null;

  // Synthesize history specifically for this isolated road link using the trajectory object
  const historicData = useMemo(() => {
    const data = [];
    if (link.trajectory) {
      for (const year of Object.keys(link.trajectory).sort()) {
        if (Number(year) <= currentActualYear) {
          data.push({
            year: Number(year),
            volume: link.trajectory[year]
          });
        }
      }
    }
    return data;
  }, [link, currentActualYear]);

  const liveVolume = link.trajectory && link.trajectory[currentActualYear] ? link.trajectory[currentActualYear] : link.aadt_2025;
  const aadtBase = link.aadt_2025 || 10000;
  const capacityRatio = liveVolume / (aadtBase * 1.5); // Example capacity ratio
  
  let statusColor = '#2ecc71';
  if (capacityRatio > 1.20) statusColor = '#8b0000';
  else if (capacityRatio > 0.95) statusColor = '#ff3333';
  else if (capacityRatio > 0.70) statusColor = '#ffcc33';

  return (
    <div className="glass-panel" style={{
      position: 'absolute',
      top: '24px',
      left: '380px', // Just next to the Sidebar
      width: '420px',
      bottom: '140px', // Above the playback bar
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInLeft 0.3s ease-out',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px 16px 0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Route size={24} color="var(--accent-teal)" />
          <h2 style={{ margin: 0, fontSize: '18px' }}>Link Diagnostics</h2>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8e92a4', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${statusColor}`, margin: '0 16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#fff' }}>{link.link_name}</h3>
        <p style={{ margin: 0, color: '#8e92a4', fontSize: '13px' }}>Link ID: <strong style={{ color: '#fff' }}>{link.link_id}</strong> | Road No: <strong style={{ color: '#fff' }}>{link.road_no}</strong></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', padding: '0 16px' }}>
        <div className="stat-card" style={{ padding: '12px' }}>
          <div className="stat-label">System Class</div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{link.road_class}</div>
        </div>
        <div className="stat-card" style={{ padding: '12px' }}>
          <div className="stat-label">Surface Material</div>
          <div className="stat-value" style={{ fontSize: '18px' }}>{link.surface_type}</div>
        </div>
        <div className="stat-card" style={{ padding: '12px' }}>
          <div className="stat-label">Length</div>
          <div className="stat-value" style={{ fontSize: '18px', color: '#ff69b4' }}>
            {link.length_km} km
          </div>
        </div>
        <div className="stat-card" style={{ padding: '12px' }}>
          <div className="stat-label">Est. Growth Rate</div>
          <div className="stat-value" style={{ fontSize: '18px', color: statusColor }}>{link.growth_rate}%</div>
        </div>
      </div>

      <div style={{ marginTop: '24px', flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Layers size={16} color="#ff00ff" />
          <h4 style={{ margin: 0, fontSize: '14px', color: '#ff00ff' }}>Vehicle Class Distribution (AADT)</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {link.vehicle_classes && Object.entries(link.vehicle_classes).map(([cls, vol]: any) => (
            <div key={cls} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px' }}>
              <span style={{ color: '#fff' }}>{cls}</span>
              <span style={{ color: '#00ffff', fontWeight: 'bold' }}>{Math.round(vol).toLocaleString()} v/day</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', padding: '0 16px', minHeight: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <CalendarRange size={16} color="#00c3ff" />
          <h4 style={{ margin: 0, fontSize: '14px', color: '#00c3ff' }}>Longitudinal AADT Trajectory</h4>
        </div>
        
        <div style={{ flex: 1, minHeight: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historicData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c3ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00c3ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="year" stroke="#8e92a4" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8e92a4" fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ background: 'rgba(10,11,16,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                labelStyle={{ color: '#8e92a4', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="volume" stroke="#00c3ff" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', margin: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <Info color="#8e92a4" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0, fontSize: '12px', color: '#8e92a4', lineHeight: 1.5 }}>
          This sector demonstrates a nominal base structural capacity designed for {(Math.round(aadtBase)).toLocaleString()} AADT. Current predictive loads map to {(Math.round(liveVolume)).toLocaleString()} vehicular counts representing a {Math.round(capacityRatio * 100)}% structural utilization.
        </p>
      </div>

    </div>
  );
}
