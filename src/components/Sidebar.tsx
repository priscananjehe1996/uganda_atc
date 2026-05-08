import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Activity, Car, Truck, Wifi, AlertTriangle, Layers, Navigation, ChevronRight, ChevronLeft, CalendarRange } from 'lucide-react';
import stationData from '../data/stations.json';
import ShinyText from './ShinyText';

const COLORS = {
  accentTeal: '#4db6ac',
  accentRed: '#ff3366',
  accentYellow: '#ffcc00',
  accentBlue: '#00c3ff',
  darkBg: '#090a0f'
};

export default function Sidebar({ data, currentYear }) {

  const stats = useMemo(() => {
    if (!data || !data.features) return null;

    let totalVolume = 0;
    let overloadVol = 0;
    let pavedNodes = 0;
    
    // Numeric Banding
    let bandFast = 0; // < 2000
    let bandYellow = 0; // 2k-8k
    let bandRed = 0; // 8k-15k
    let bandDarkRed = 0; // >15k
    
    // Overload severity
    let hgvLow = 0;
    let hgvMed = 0;
    let hgvHigh = 0;

    let classA = { a: 0, v: 0 };
    let classB = { b: 0, v: 0 };
    let classC = { c: 0, v: 0 };
    
    let highestOverloads = [];

    data.features.forEach((f: any) => {
      const aadt2025 = f.properties.aadt_2025 || 10000;
      const compoundGrowth = Math.pow(1.05, currentYear - 2025);
      const liveVolume = aadt2025 * compoundGrowth;
      const overloadRate = f.properties.overload_rate || 0.1;
      const overloadVehicles = liveVolume * overloadRate;

      totalVolume += liveVolume;
      overloadVol += overloadVehicles;

      if (f.properties.surface_type === 'Paved') pavedNodes++;

      if (liveVolume > 15000) bandDarkRed++;
      else if (liveVolume > 8000) bandRed++;
      else if (liveVolume > 2000) bandYellow++;
      else bandFast++;

      if (overloadRate > 0.25) hgvHigh++;
      else if (overloadRate > 0.15) hgvMed++;
      else hgvLow++;

      if (f.properties.road_class === 'A') { classA.a++; classA.v += liveVolume; }
      if (f.properties.road_class === 'B') { classB.b++; classB.v += liveVolume; }
      if (f.properties.road_class === 'C') { classC.c++; classC.v += liveVolume; }

      highestOverloads.push({ name: f.properties.road_section || f.properties.site_code, overload: overloadVehicles });
    });

    highestOverloads.sort((a, b) => b.overload - a.overload);

    // Historic trajectory mapping
    const history = [];
    for (let y = 2016; y <= new Date().getFullYear(); y++) {
      const g = Math.pow(1.05, y - 2025);
      history.push({
        year: y,
        vol: Math.round(data.features.reduce((acc, f) => acc + (f.properties.aadt_2025 || 10000) * g, 0)),
        overload: Math.round(data.features.reduce((acc, f) => acc + ((f.properties.aadt_2025 || 10000) * g * (f.properties.overload_rate || 0.1)), 0))
      });
    }
    
    // Stations
    const stations = stationData.features || [];
    const atcCount = stations.filter(s => s.properties.has_atc).length;
    const manualCount = stations.length - atcCount;
    const activeCount = stations.filter(s => s.properties.status === 'Active').length;

    return {
      nodes: data.features.length,
      pavedRatio: (pavedNodes / data.features.length) * 100,
      totalVolume,
      overloadVol,
      overloadPercent: (overloadVol / totalVolume) * 100,
      bandData: [
        { name: 'Fast <2k', count: bandFast, fill: '#2ecc71' },
        { name: 'Warn 2k-8k', count: bandYellow, fill: '#ffcc33' },
        { name: 'Delay 8k-15k', count: bandRed, fill: '#ff3333' },
        { name: 'Gridlock >15k', count: bandDarkRed, fill: '#8b0000' }
      ],
      hgvData: [
        { name: 'Low Risk', value: hgvLow, fill: '#00ffff' },
        { name: 'Med Risk', value: hgvMed, fill: '#ff69b4' },
        { name: 'High Risk', value: hgvHigh, fill: '#ff00ff' }
      ],
      classVol: [
        { name: 'Class A', volume: classA.v, fill: '#ff3366' },
        { name: 'Class B', volume: classB.v, fill: '#00c3ff' },
        { name: 'Class C', volume: classC.v, fill: '#00ea90' }
      ],
      classCounts: [
        { name: 'Class A', count: classA.a, fill: '#ff3366' },
        { name: 'Class B', count: classB.b, fill: '#00c3ff' },
        { name: 'Class C', count: classC.c, fill: '#00ea90' }
      ],
      stations: stations.length,
      atcCount,
      manualCount,
      activeCount,
      history,
      radar: [
        { subject: 'Density', A: classA.a, fullMark: 1000 },
        { subject: 'Volume', A: classA.v / 10000, fullMark: 1000 },
        { subject: 'HGV Load', A: overloadVol / 1000, fullMark: 1000 },
        { subject: 'Bottleneck', A: bandDarkRed * 10, fullMark: 1000 },
        { subject: 'Capacity', A: bandFast * 5, fullMark: 1000 }
      ],
      topOverloads: highestOverloads.slice(0, 5)
    };
  }, [data, currentYear]);

  if (!stats) return <div className="sidebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Analytics Engines...</div>;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px', fontSize: '11px', color: '#fff' }}>
          {payload.map((p, i) => (
             <div key={i}><span style={{ color: p.color || p.fill }}>{p.name}: </span>{Number(p.value).toLocaleString()}</div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', padding: 0, width: '420px', overflow: 'hidden' }}>
      
      <div style={{ padding: '24px 24px 12px 24px', background: 'rgba(0, 0, 0, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px' }}>
          <Activity color={COLORS.accentRed} /> <ShinyText text="ATC Live Analytics" speed={3} />
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Multiparametric Network Diagnostics | Year: <strong style={{color:'#fff'}}>{currentYear}</strong></p>
      </div>

      <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
                <div className="stat-label">Total Network Demand</div>
                <div className="stat-value" style={{ fontSize: '22px' }}>{Math.round(stats.totalVolume).toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#8e92a4', marginTop: '4px' }}><Car size={10} /> Active VKT Proxy</div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
                <div className="stat-label">HGV Congestion</div>
                <div className="stat-value" style={{ fontSize: '22px', color: COLORS.accentRed }}>{Math.round(stats.overloadVol).toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#ff69b4', marginTop: '4px' }}><Truck size={10} /> {stats.overloadPercent.toFixed(1)}% Usage</div>
              </div>
            </div>

            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: COLORS.accentBlue, display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14}/> Network Trajectory Envelope (2016 - Now)</h4>
              <div style={{ height: '140px', width: '100%' }}>
                <ResponsiveContainer>
                  <AreaChart data={stats.history} margin={{ left: 0, right: 0, bottom: 0, top: 0 }}>
                    <XAxis dataKey="year" fontSize={10} tickLine={false} stroke="#8e92a4" />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="vol" name="Network Volume" stroke={COLORS.accentBlue} fill="rgba(0,195,255,0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <div className="chart-container" style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '11px' }}>ATC Station Status</h4>
                  <div style={{ height: '100px' }}>
                     <ResponsiveContainer>
                        <PieChart>
                           <Pie data={[
                              { name: 'Active ATC', value: stats.atcCount, fill: '#00c3ff' },
                              { name: 'Manual', value: stats.manualCount, fill: '#ffcc33' }
                           ]} innerRadius={25} outerRadius={40} dataKey="value" />
                           <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#8e92a4' }}>{stats.stations} Tracked Nodes</div>
               </div>

               <div className="chart-container" style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '11px' }}>Surface Paving Index</h4>
                  <div style={{ height: '100px' }}>
                     <ResponsiveContainer>
                        <PieChart>
                           <Pie data={[
                              { name: 'Paved', value: stats.pavedRatio, fill: COLORS.accentTeal },
                              { name: 'Unsealed', value: 100 - stats.pavedRatio, fill: '#ff9933' }
                           ]} innerRadius={25} outerRadius={40} dataKey="value" />
                           <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#8e92a4' }}>{stats.pavedRatio.toFixed(1)}% Sealed</div>
               </div>
            </div>
            
            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Highest Overload Geometries</h4>
              <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                {stats.topOverloads.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#fff' }}><AlertTriangle size={10} color="#ff00ff" style={{marginRight:'4px'}}/> {r.name}</span>
                    <span style={{ color: '#ff69b4', fontWeight: 'bold' }}>{Math.round(r.overload).toLocaleString()} HGV</span>
                  </div>
                ))}
              </div>
            </div>

             <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: COLORS.accentYellow }}>Source Data Banding (AADT Volumes)</h4>
              <div style={{ height: '140px' }}>
                <ResponsiveContainer>
                  <BarChart data={stats.bandData} layout="vertical" margin={{ left: -20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.bandData.map((e, index) => <Cell key={`bandcell-${index}`} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#ff00ff' }}>Heavy Goods Vehicle Abuse Vectors</h4>
              <div style={{ height: '120px' }}>
                <ResponsiveContainer>
                  <BarChart data={stats.hgvData} barCategoryGap="20%">
                    <XAxis dataKey="name" fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {stats.hgvData.map((e, index) => <Cell key={`hgvcell-${index}`} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Class Volumetric Impact</h4>
              <div style={{ height: '140px' }}>
                <ResponsiveContainer>
                  <AreaChart data={stats.classVol} margin={{ left: -10, bottom: 0, top: 10 }}>
                    <XAxis dataKey="name" fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="step" dataKey="volume" stroke="#00ea90" fill="rgba(0, 234, 144, 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
                <div className="stat-label">Active ATC Hardware</div>
                <div style={{ fontSize: '24px', color: '#00c3ff', display:'flex', alignItems: 'center', gap:'8px' }}>
                   {stats.activeCount} <Wifi size={16} />
                </div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
                <div className="stat-label">Total Survey Nodes</div>
                <div style={{ fontSize: '24px', color: '#fff' }}>{stats.nodes}</div>
              </div>
            </div>

            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Asset Vector Mapping</h4>
              <div style={{ height: '180px' }}>
                <ResponsiveContainer>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radar}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" fontSize={10} fill="#8e92a4" />
                    <PolarRadiusAxis angle={30} domain={[0, 1000]} hide />
                    <Radar name="Network Parameters" dataKey="A" stroke={COLORS.accentBlue} fill={COLORS.accentBlue} fillOpacity={0.3} />
                    <RechartsTooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Class Node Spread</h4>
              <div style={{ height: '120px' }}>
                <ResponsiveContainer>
                  <BarChart data={stats.classCounts} margin={{ left: -20 }}>
                    <XAxis dataKey="name" fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.classCounts.map((e, index) => <Cell key={`classcell-${index}`} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
      </div>
    </div>
  );
}
