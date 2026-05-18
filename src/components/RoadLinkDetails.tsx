import React, { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Activity, Map as MapIcon, CalendarRange, Download, FileText, Truck, Car, Bike } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, AreaChart, Area, XAxis, YAxis, BarChart, Bar, CartesianGrid, Legend } from 'recharts';
import { getVehicleColor, VEHICLE_CLASS_COLORS, formatFractionalYearToDate } from '../constants';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function RoadLinkDetails({ link, currentActualYear, onClose }: any) {
  if (!link) return null;
  const paneRef = useRef<HTMLDivElement>(null);

  const scale = link.aadt_2025 ? (link.liveVolume / link.aadt_2025) : 1;

  const vcData = useMemo(() => {
    if (!link.vehicle_classes) return [];
    return Object.entries(link.vehicle_classes).map(([name, baseVal]: any) => ({
      name,
      value: Math.round(baseVal * scale),
      pct: link.liveVolume ? ((baseVal * scale) / link.liveVolume * 100).toFixed(1) : '0',
      fill: getVehicleColor(name)
    })).sort((a, b) => b.value - a.value);
  }, [link, scale]);

  const trajectoryData = useMemo(() => {
    if (!link.trajectory) return [];
    return Object.entries(link.trajectory).map(([year, vol]: any) => ({
      year: parseInt(year), volume: Math.round(vol)
    })).sort((a, b) => a.year - b.year);
  }, [link]);

  // ADT categories
  const motorcycleADT = link.vehicle_classes?.['Motorcycles'] ? Math.round(link.vehicle_classes['Motorcycles'] * scale) : 0;
  const totalADT = Math.round(link.liveVolume || 0);
  const adtExclMC = totalADT - motorcycleADT;
  const nmt = ((link.vehicle_classes?.['Bicycles'] || 0) + (link.vehicle_classes?.['Pedestrians'] || 0)) * scale;
  const heavyVehicles = ['Medium Trucks', 'Heavy Trucks', 'Truck Trailers', 'Truck Trailers 5ax', 'Truck Trailers 6ax', 'Truck Trailers 7ax']
    .reduce((sum, cls) => sum + ((link.vehicle_classes?.[cls] || 0) * scale), 0);
  const lightVehicles = totalADT - heavyVehicles - motorcycleADT;

  // Growth analysis
  const growthRate = link.growth_rate || 0;
  const projectedADT2035 = link.trajectory?.[2035] || (totalADT * Math.pow(1 + growthRate / 100, 2035 - currentActualYear));

  // ESA calculation
  const ESA_FACTORS: Record<string, number> = {
    'Motorcycles': 0, 'Saloon Cars & Taxis': 0.0001, 'Light Goods': 0.01,
    'Small Buses': 0.1, 'Medium Buses': 0.4, 'Large Buses': 2.0,
    'Light Trucks': 0.5, 'Medium Trucks': 3.5, 'Heavy Trucks': 6.0,
    'Truck Trailers': 8.0, 'Truck Trailers 5ax': 10.0
  };
  const dailyESA = vcData.reduce((sum, vc) => sum + (vc.value * (ESA_FACTORS[vc.name] || 0)), 0);

  const exportCSV = () => {
    const lines = [
      `Road Link Traffic Report - ${link.link_name || link.link_id}`,
      `Generated: ${new Date().toISOString()}`,
      `Analysis Date: ${formatFractionalYearToDate(currentActualYear + (new Date().getMonth() / 12))}`,
      '',
      'ROAD LINK ATTRIBUTES',
      `Link ID,${link.link_id}`,
      `Road Name,${link.link_name}`,
      `Road Number,${link.road_no || 'N/A'}`,
      `Road Class,${link.road_class || 'N/A'}`,
      `Surface Type,${link.surface_type || 'N/A'}`,
      `Region,${link.region || 'N/A'}`,
      `Length (km),${link.length_km || 'N/A'}`,
      `Growth Rate (%),${growthRate}`,
      '',
      'ADT SUMMARY',
      `Total ADT (incl. MC),${totalADT}`,
      `ADT (excl. MC),${adtExclMC}`,
      `Motorcycle ADT,${motorcycleADT}`,
      `NMT ADT,${Math.round(nmt)}`,
      `Heavy Vehicle ADT,${Math.round(heavyVehicles)}`,
      `Light Vehicle ADT,${Math.round(lightVehicles)}`,
      `Daily ESA,${Math.round(dailyESA)}`,
      `Projected ADT 2035,${Math.round(projectedADT2035)}`,
      '',
      'VEHICLE CLASS BREAKDOWN',
      'Vehicle Class,ADT,Percentage (%)',
      ...vcData.map(v => `${v.name},${v.value},${v.pct}`),
      '',
      'YEARLY TRAJECTORY',
      'Year,ADT',
      ...trajectoryData.map(t => `${t.year},${t.volume}`)
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `traffic_report_${link.link_id || 'road'}.csv`;
    a.click();
  };


  const exportPDF = async () => {
    if (!paneRef.current) return;
    try {
      const element = paneRef.current;
      // Temporarily remove overflow to capture full content
      const originalOverflow = element.style.overflowY;
      const originalHeight = element.style.height;
      element.style.overflowY = 'visible';
      element.style.height = 'auto';

      const canvas = await html2canvas(element, {
        backgroundColor: '#05080f',
        scale: 2,
        useCORS: true,
        logging: false,
        windowHeight: element.scrollHeight
      });

      // Restore original styles
      element.style.overflowY = originalOverflow;
      element.style.height = originalHeight;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`traffic_report_${link.link_id || 'road'}.pdf`);
    } catch (e) { 
      console.error('Export failed', e); 
      alert('PDF generation failed. Please try again.');
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(0,195,255,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', color: '#fff' }}>
          {payload.map((p: any, i: number) => (
            <div key={i}><span style={{ color: p.color || p.fill }}>{p.name || p.dataKey}: </span>{Number(p.value).toLocaleString()}</div>
          ))}
        </div>
      );
    }
    return null;
  };

  const StatBox = ({ label, value, color = '#fff', sub = '' }: any) => (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px', flex: 1 }}>
      <div style={{ fontSize: '10px', color: '#8e92a4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: '800', color, fontVariantNumeric: 'tabular-nums' }}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div style={{ fontSize: '10px', color: '#8e92a4', marginTop: '2px' }}>{sub}</div>}
    </div>
  );

  return (
    <AnimatePresence>
      {link && (
        <motion.div
          initial={{ x: -420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -420, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          ref={paneRef}
          className="sidebar-left glass-panel"
          style={{
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            width: '440px',
            overflow: 'hidden',
            color: '#fff'
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 16px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,195,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapIcon color="#00c3ff" size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', margin: 0, lineHeight: 1.3 }}>{link.link_name || link.link_id || 'Road Link'}</h2>
                  <div style={{ fontSize: '11px', color: '#00c3ff', fontFamily: 'monospace' }}>{link.link_id} • {link.road_no || ''} • Class {link.road_class || '?'}</div>
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8e92a4', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>
            {/* Export buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={exportCSV} style={{ flex: 1, background: 'rgba(0,234,144,0.1)', border: '1px solid #00ea90', color: '#00ea90', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Download size={12} /> Export CSV
              </button>
              <button onClick={exportPDF} style={{ flex: 1, background: 'rgba(255,51,102,0.1)', border: '1px solid #ff3366', color: '#ff3366', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FileText size={12} /> Export PDF
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Key metrics row */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <StatBox label="Total ADT" value={totalADT} color="#00ea90" sub="incl. MC" />
              <StatBox label="ADT excl. MC" value={adtExclMC} color="#b366ff" />
              <StatBox label="Growth" value={`${growthRate > 0 ? '+' : ''}${growthRate}%`} color={growthRate > 0 ? '#00ea90' : '#ff3366'} sub="per annum" />
            </div>

            {/* Road attributes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <StatBox label="Surface" value={link.surface_type || 'N/A'} color="#00c3ff" />
              <StatBox label="Length" value={`${link.length_km || '?'} km`} color="#ffcc33" />
              <StatBox label="Region" value={link.region || 'N/A'} color="#ff9933" />
            </div>

            {/* ADT Categories */}
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#00c3ff', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} /> ADT Category Summary
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                {[
                  { label: 'Motorcycles', val: motorcycleADT, icon: <Bike size={12} />, color: '#FF6347' },
                  { label: 'Heavy Vehicles', val: Math.round(heavyVehicles), icon: <Truck size={12} />, color: '#7B68EE' },
                  { label: 'Light Vehicles', val: Math.round(lightVehicles), icon: <Car size={12} />, color: '#32CD32' },
                  { label: 'NMT', val: Math.round(nmt), color: '#fcee0a' },
                  { label: 'Daily ESA', val: Math.round(dailyESA), color: '#ff3366' },
                  { label: '2035 Projection', val: Math.round(projectedADT2035), color: '#00c3ff' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ color: '#8e92a4', display: 'flex', alignItems: 'center', gap: '4px' }}>{item.icon} {item.label}</span>
                    <span style={{ fontWeight: '700', color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Class Pie Chart */}
            {vcData.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#ff00ff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Vehicle Class Distribution
                </h4>
                <div style={{ height: '160px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie isAnimationActive={false} data={vcData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} stroke="none">
                        {vcData.map((v, i) => <Cell key={i} fill={v.fill} />)}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '8px' }}>
                  {vcData.map(v => (
                    <div key={v.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#8e92a4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '2px', background: v.fill, display: 'inline-block' }} />
                        {v.name}
                      </span>
                      <span>
                        <span style={{ color: '#fff', fontWeight: '600', marginRight: '8px' }}>{v.value.toLocaleString()}</span>
                        <span style={{ color: v.fill, fontSize: '10px' }}>{v.pct}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle Class Bar Chart */}
            {vcData.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#00ff66', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ADT per Vehicle Class
                </h4>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vcData} layout="vertical" margin={{ left: 10, right: 10, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={100} fontSize={9} stroke="#8e92a4" tickLine={false} axisLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar isAnimationActive={false} dataKey="value" name="ADT" radius={[0, 4, 4, 0]}>
                        {vcData.map((v, i) => <Cell key={i} fill={v.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AADT Growth Trajectory */}
            {trajectoryData.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#00c3ff', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CalendarRange size={14} /> AADT Growth Trajectory (2016–2035)
                </h4>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trajectoryData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVolLink" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00c3ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00c3ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" stroke="#8e92a4" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#8e92a4" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => (v/1000).toFixed(0)+'k'} />
                      <Area isAnimationActive={false} type="monotone" dataKey="volume" name="ADT" stroke="#00c3ff" fill="url(#colorVolLink)" strokeWidth={2} />
                      <RechartsTooltip content={<CustomTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Year-over-Year Growth */}
            {trajectoryData.length > 1 && (
              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#b366ff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <TrendingUp size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Year-over-Year Increment
                </h4>
                <div style={{ height: '140px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trajectoryData.slice(1).map((t, i) => ({
                      year: t.year,
                      increment: t.volume - trajectoryData[i].volume
                    }))} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <XAxis dataKey="year" stroke="#8e92a4" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis stroke="#8e92a4" fontSize={9} axisLine={false} tickLine={false} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar isAnimationActive={false} dataKey="increment" name="YoY Increment" fill="#b366ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
