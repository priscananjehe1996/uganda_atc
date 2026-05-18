import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Activity, Car, Truck, Wifi, AlertTriangle, Layers, Navigation, ChevronRight, ChevronLeft, CalendarRange } from 'lucide-react';
import stationData from '../data/stations.json';
import ShinyText from './ShinyText';
import { getVehicleColor, formatFractionalYearToDate } from '../constants';

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
    let classM = { m: 0, v: 0 };
    
    let highestOverloads = [];

    data.features.forEach((f: any) => {
      const aadt2025 = f.properties.aadt_2025 || 10000;
      const compoundGrowth = Math.pow(1 + (f.properties.growth_rate || 5)/100, currentYear - 2025);
      const liveVolume = aadt2025 * compoundGrowth;

      totalVolume += liveVolume;

      const surf = String(f.properties.surface_type || '').toLowerCase();
      if (surf.includes('paved') || surf === 'sealed' || surf === 'tarmac' || surf.includes('bitum')) pavedNodes++;

      if (liveVolume > 15000) bandDarkRed++;
      else if (liveVolume > 8000) bandRed++;
      else if (liveVolume > 2000) bandYellow++;
      else bandFast++;

      if (f.properties.road_class === 'A') { classA.a++; classA.v += liveVolume; }
      if (f.properties.road_class === 'B') { classB.b++; classB.v += liveVolume; }
      if (f.properties.road_class === 'C') { classC.c++; classC.v += liveVolume; }
      if (f.properties.road_class === 'M') { classM.m++; classM.v += liveVolume; }
    });

    // Historic trajectory mapping
    const history = [];
    for (let y = 2016; y <= new Date().getFullYear(); y++) {
      let yrTotal = 0;
      data.features.forEach(f => {
        const aadt2025 = f.properties.aadt_2025 || 10000;
        const compoundGrowth = Math.pow(1 + (f.properties.growth_rate || 5)/100, y - 2025);
        yrTotal += aadt2025 * compoundGrowth;
      });
      history.push({ year: y, vol: Math.round(yrTotal) });
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
      bandData: [
        { name: 'Fast <2k', count: bandFast, fill: '#2ecc71' },
        { name: 'Warn 2k-8k', count: bandYellow, fill: '#ffcc33' },
        { name: 'Delay 8k-15k', count: bandRed, fill: '#ff3333' },
        { name: 'Gridlock >15k', count: bandDarkRed, fill: '#8b0000' }
      ],
      classVol: [
        { name: 'Class A', volume: classA.v, fill: getVehicleColor('Heavy Trucks') },
        { name: 'Class B', volume: classB.v, fill: getVehicleColor('Light Goods') },
        { name: 'Class C', volume: classC.v, fill: getVehicleColor('Motorcycles') },
        { name: 'Class M', volume: classM.v, fill: getVehicleColor('Small Buses') }
      ],
      classCounts: [
        { name: 'Class A', count: classA.a, fill: getVehicleColor('Heavy Trucks') },
        { name: 'Class B', count: classB.b, fill: getVehicleColor('Light Goods') },
        { name: 'Class C', count: classC.c, fill: getVehicleColor('Motorcycles') },
        { name: 'Class M', count: classM.m, fill: getVehicleColor('Small Buses') }
      ],
      stations: stations.length,
      atcCount,
      manualCount,
      activeCount,
      history,
      radar: [
        { subject: 'Density', A: classA.a, fullMark: 1000 },
        { subject: 'Volume', A: classA.v / 10000, fullMark: 1000 },
        { subject: 'Congestion', A: bandDarkRed * 10, fullMark: 1000 },
        { subject: 'Capacity', A: bandFast * 5, fullMark: 1000 }
      ]
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
    <div className="sidebar-left glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: 0, width: '420px', overflow: 'hidden' }}>
      <svg width="0" height="0">
        <defs>
          <linearGradient id="colorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4db6ac" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#090a0f" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffcc33" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#ff3366" stopOpacity={0.9} />
          </linearGradient>
        </defs>
      </svg>
      
      <div style={{ padding: '24px 24px 12px 24px', background: 'rgba(0, 0, 0, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', color: '#ffffff' }}>
          <Activity color={COLORS.accentRed} /> National Traffic Prediction
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Multiparametric Network Diagnostics | Year: <strong style={{color:'#fff'}}>{formatFractionalYearToDate(currentYear)}</strong></p>
      </div>

      <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
                <div className="stat-label">Total Network ADT</div>
                <div className="stat-value" style={{ fontSize: '22px' }}>{Math.round(stats.totalVolume).toLocaleString()}</div>
                <div style={{ fontSize: '11px', color: '#8e92a4', marginTop: '4px' }}><Car size={10} /> Active VKT Proxy</div>
              </div>
              <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
                <div className="stat-label">Network Growth Ratio</div>
                <div className="stat-value" style={{ fontSize: '22px', color: COLORS.accentTeal }}>+{Math.round((stats.totalVolume / (stats.history[0]?.vol || 1) - 1) * 100)}%</div>
                <div style={{ fontSize: '11px', color: '#ff69b4', marginTop: '4px' }}><Activity size={10} /> Since 2016 Base</div>
              </div>
            </div>

            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: COLORS.accentBlue, display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14}/> Network Trajectory Envelope (2016 - Now)</h4>
              <div style={{ height: '140px', width: '100%' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={stats.history} margin={{ left: 0, right: 0, bottom: 0, top: 0 }}>
                    <XAxis dataKey="year" fontSize={10} tickLine={false} stroke="#8e92a4" />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area isAnimationActive={false} type="monotone" dataKey="vol" name="Network Volume" stroke={COLORS.accentBlue} fill="url(#colorGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <div className="chart-container" style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '11px' }}>Automatic Station Ratio</h4>
                  <div style={{ height: '100px' }}>
                     <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                           <Pie isAnimationActive={false} data={[
                              { name: 'Active Automatic', value: stats.atcCount, fill: '#00c3ff' },
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
                     <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                           <Pie isAnimationActive={false} data={[
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
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: COLORS.accentYellow }}>Source Data Banding (AADT Volumes)</h4>
              <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.bandData} layout="vertical" margin={{ left: 0, right: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={90} fontSize={10} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar isAnimationActive={false} dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.bandData.map((e, index) => <Cell key={`bandcell-${index}`} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>



            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Class Volumetric Impact</h4>
              <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.classVol} margin={{ left: -10, bottom: 0, top: 10 }}>
                    <Area isAnimationActive={false} type="step" dataKey="volume" stroke="#00ea90" fill="url(#colorGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="stat-card" style={{ flex: 1, padding: '16px' }}>
                <div className="stat-label">Active Automatic Stations</div>
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
                <ResponsiveContainer width='100%' height='100%'>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radar}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" fontSize={10} fill="#8e92a4" />
                    <PolarRadiusAxis angle={30} domain={[0, 1000]} hide />
                    <Radar isAnimationActive={false} name="Network Parameters" dataKey="A" stroke={COLORS.accentBlue} fill={COLORS.accentBlue} fillOpacity={0.3} />
                    <RechartsTooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container">
              <h4 style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Class Node Spread</h4>
              <div style={{ height: '120px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={stats.classCounts} margin={{ left: -20 }}>
                    <XAxis dataKey="name" fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} stroke="#8e92a4" tickLine={false} axisLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar isAnimationActive={false} dataKey="count" radius={[4, 4, 0, 0]}>
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
