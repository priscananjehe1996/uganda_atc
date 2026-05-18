import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, CartesianGrid } from 'recharts';
import { Activity, Cpu, Hexagon, Download, X, Globe, Layers, Crosshair, Zap, Radio } from 'lucide-react';
import stationData from '../data/stations.json';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';

const CYBER_COLORS = [
  '#00f0ff', '#ff003c', '#00ff66', '#fcee0a', '#b366ff', 
  '#ff9933', '#33ffcc', '#ff66b3', '#ccccff', '#ffff66', '#ff0000'
];

export default function InfographicsDashboard({ data, currentYear, onClose, deepAnalyticsData }: any) {
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [activeView, setActiveView] = useState('MACRO');

  const analytics = useMemo(() => {
    let links = data?.features ? data.features.map((f: any) => f.properties) : [];
    const rawLinks = links; 
    if (selectedRegion !== 'All') links = links.filter((l: any) => l.region === selectedRegion);

    const classes = ['Motorcycles', 'Saloon Cars & Taxis', 'Light Goods', 'Small Buses', 'Medium Buses', 'Large Buses', 'Light Trucks', 'Medium Trucks', 'Heavy Trucks', 'Truck Trailers', 'Truck Trailers 5ax'];
    const years = Array.from({length: 20}, (_, i) => 2016 + i);

    const currentVolume = (l: any) => (l.trajectory && l.trajectory[Math.floor(currentYear)]) ? l.trajectory[Math.floor(currentYear)] : 0;
    const currentScale = (l: any) => l.aadt_2025 ? currentVolume(l) / l.aadt_2025 : 0;

    const linkCount = links.length || 1;

    const networkGrowthData = years.map(y => ({
      year: y,
      adt: Math.round(links.reduce((sum: number, l: any) => sum + (l.trajectory && l.trajectory[y] ? l.trajectory[y] : 0), 0) / linkCount)
    }));

    const classDistData = classes.map((cls, i) => {
      const totalVol = links.reduce((sum: number, l: any) => sum + ((l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * currentScale(l) : 0), 0);
      return { name: cls, value: Math.round(totalVol / linkCount), fill: CYBER_COLORS[i] };
    });

    const classGrowthData = classes.map((cls, i) => ({
      name: cls, color: CYBER_COLORS[i],
      data: years.map(y => ({
        year: y, 
        adt: Math.round(links.reduce((sum: number, l: any) => sum + ((l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * (l.aadt_2025 ? ((l.trajectory && l.trajectory[y]) ? l.trajectory[y] : 0)/l.aadt_2025 : 0) : 0), 0) / linkCount)
      }))
    }));

    const allRegions = Array.from(new Set(rawLinks.map((l: any) => l.region).filter(Boolean)));
    const roadClasses = Array.from(new Set(links.map((l: any) => l.road_class).filter(Boolean)));

    // Macro Stats: Stacked by Road Class
    const classCompositionByRoadClass = roadClasses.map(rc => {
      const obj: any = { name: `Class ${rc}` };
      const rcLinks = links.filter(l => l.road_class === rc);
      const rcCount = rcLinks.length || 1;
      classes.forEach(cls => {
        obj[cls] = Math.round(rcLinks.reduce((sum: number, l: any) => sum + ((l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * currentScale(l) : 0), 0) / rcCount);
      });
      return obj;
    });

    // Macro Stats: Average ADT by Region
    const classCompositionByRegion = allRegions.map(r => {
      const obj: any = { name: String(r).substring(0, 10) };
      const regLinks = rawLinks.filter(l => l.region === r);
      const regCount = regLinks.length || 1;
      classes.forEach(cls => {
        obj[cls] = Math.round(regLinks.reduce((sum: number, l: any) => sum + ((l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * currentScale(l) : 0), 0) / regCount);
      });
      return obj;
    });

    const regionalClassDistData = classes.map((cls, i) => ({
      name: cls, color: CYBER_COLORS[i],
      data: allRegions.map(r => ({
        region: String(r).substring(0, 10),
        volume: Math.round(rawLinks.filter((l: any) => l.region === r).reduce((sum: number, l: any) => sum + ((l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * currentScale(l) : 0), 0))
      }))
    }));

    const topPaved = rawLinks.filter((l: any) => l.surface_type === 'Bituminous').sort((a: any, b: any) => currentVolume(b) - currentVolume(a)).slice(0, 10).map((l: any) => ({ name: String(l.link_name || l.link_id).substring(0, 15), volume: Math.round(currentVolume(l)) }));
    const topUnsealed = rawLinks.filter((l: any) => l.surface_type === 'Unsealed').sort((a: any, b: any) => currentVolume(b) - currentVolume(a)).slice(0, 10).map((l: any) => ({ name: String(l.link_name || l.link_id).substring(0, 15), volume: Math.round(currentVolume(l)) }));
    
    const classAVsOther = [
      { name: 'Class A', value: Math.round(rawLinks.filter((l: any) => l.road_class === 'A').reduce((sum: number, l: any) => sum + currentVolume(l), 0)), fill: '#00f0ff' },
      { name: 'Other', value: Math.round(rawLinks.filter((l: any) => l.road_class !== 'A').reduce((sum: number, l: any) => sum + currentVolume(l), 0)), fill: '#ff003c' }
    ];

    const heavyTruckRoutes = [...rawLinks].sort((a, b) => {
      const volA = a.vehicle_classes && a.vehicle_classes['Heavy Trucks'] ? a.vehicle_classes['Heavy Trucks'] * currentScale(a) : 0;
      const volB = b.vehicle_classes && b.vehicle_classes['Heavy Trucks'] ? b.vehicle_classes['Heavy Trucks'] * currentScale(b) : 0;
      return volB - volA;
    }).slice(0, 10).map((l: any) => ({ name: String(l.link_name || l.link_id).substring(0, 15), trucks: Math.round(l.vehicle_classes?.['Heavy Trucks'] ? l.vehicle_classes['Heavy Trucks'] * currentScale(l) : 0) }));

    const fastestGrowing = [...rawLinks].sort((a, b) => (b.growth_rate || 0) - (a.growth_rate || 0)).slice(0, 10).map((l: any) => ({ name: String(l.link_name || l.link_id).substring(0, 15), rate: l.growth_rate || 0 }));
    
    const densityRoutes = [...rawLinks].sort((a, b) => (currentVolume(b)/(b.length_km || 1)) - (currentVolume(a)/(a.length_km || 1))).slice(0, 10).map((l: any) => ({ name: String(l.link_name || l.link_id).substring(0, 15), density: Math.round(currentVolume(l)/(l.length_km || 1)) }));

    const regionalClassStackedData = allRegions.map((r: any) => {
      const obj: any = { region: String(r).substring(0, 8) };
      classes.forEach((cls) => {
        obj[cls] = Math.round(rawLinks.filter((l: any) => l.region === r).reduce((sum: number, l: any) => sum + ((l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * currentScale(l) : 0), 0));
      });
      return obj;
    });
    
    const surfaces = Array.from(new Set(links.map((l: any) => l.surface_type).filter(Boolean)));
    const surfaceSplitData = surfaces.map((s: any, i) => ({ name: s || 'Unknown', value: links.filter((l: any) => l.surface_type === s).length, fill: ['#00f0ff', '#ff003c', '#00ff66'][i % 3] }));

    const roadClassData = roadClasses.map((rc: any) => ({ class: rc || 'N/A', volume: Math.round(links.filter((l: any) => l.road_class === rc).reduce((sum: number, l: any) => sum + currentVolume(l), 0)) }));

    const yoyGrowthData = years.slice(1).map((y, i) => {
      const prev = networkGrowthData[i].adt;
      const curr = networkGrowthData[i+1].adt;
      return { year: y, increment: curr - prev };
    });

    const regionLengths = allRegions.map((r: any) => ({
      region: String(r).substring(0, 10),
      length: Math.round(rawLinks.filter((l: any) => l.region === r).reduce((sum: number, l: any) => sum + (l.length_km || 0), 0))
    }));
    
    const regionGrowth = allRegions.map((r: any) => {
      const regionLinks = rawLinks.filter((l: any) => l.region === r && l.growth_rate);
      const avgGrowth = regionLinks.length > 0 ? regionLinks.reduce((sum: number, l: any) => sum + l.growth_rate, 0) / regionLinks.length : 0;
      return { region: String(r).substring(0, 10), rate: Number(avgGrowth.toFixed(1)) };
    });

    const motorcycleDominance = [...rawLinks].sort((a, b) => {
      const pctA = a.vehicle_classes && a.vehicle_classes['Motorcycles'] ? (a.vehicle_classes['Motorcycles'] * currentScale(a)) / (currentVolume(a) || 1) : 0;
      const pctB = b.vehicle_classes && b.vehicle_classes['Motorcycles'] ? (b.vehicle_classes['Motorcycles'] * currentScale(b)) / (currentVolume(b) || 1) : 0;
      return pctB - pctA;
    }).slice(0, 10).map((l: any) => ({ name: String(l.link_name || l.link_id).substring(0, 15), pct: Math.round(((l.vehicle_classes?.['Motorcycles'] ? l.vehicle_classes['Motorcycles'] * currentScale(l) : 0) / (currentVolume(l) || 1)) * 100) }));

    const regionalAdtData = allRegions.map((r: any) => ({
      region: String(r).substring(0, 12),
      volume: Math.round(rawLinks.filter((l: any) => l.region === r).reduce((sum: number, l: any) => sum + currentVolume(l), 0))
    }));

    const lengthPerClass = roadClasses.map((rc: any) => ({
      class: rc || 'N/A',
      length: Math.round(links.filter((l: any) => l.road_class === rc).reduce((sum: number, l: any) => sum + (l.length_km || 0), 0))
    }));

    // Engineering Analysis
    const ESA_FACTORS: any = {
      'Motorcycles': 0,
      'Saloon Cars & Taxis': 0.0001,
      'Light Goods': 0.01,
      'Small Buses': 0.1,
      'Medium Buses': 0.4,
      'Large Buses': 2.0,
      'Light Trucks': 0.5,
      'Medium Trucks': 3.5,
      'Heavy Trucks': 6.0,
      'Truck Trailers': 8.0,
      'Truck Trailers 5ax': 10.0
    };

    const esaData = rawLinks.map((l: any) => {
      let esa = 0;
      classes.forEach(cls => {
        const vol = (l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * currentScale(l) : 0;
        esa += vol * (ESA_FACTORS[cls] || 0);
      });
      return { name: String(l.link_name || l.link_id).substring(0, 15), esa: Math.round(esa) };
    }).sort((a, b) => b.esa - a.esa).slice(0, 10);

    const networkEsaGrowth = years.map(y => {
      let totalEsa = 0;
      rawLinks.forEach((l: any) => {
        const scale = (l.aadt_2025 && l.trajectory && l.trajectory[y]) ? l.trajectory[y] / l.aadt_2025 : 0;
        classes.forEach(cls => {
          const vol = (l.vehicle_classes && l.vehicle_classes[cls]) ? l.vehicle_classes[cls] * scale : 0;
          totalEsa += vol * (ESA_FACTORS[cls] || 0);
        });
      });
      return { year: y, esa: Math.round(totalEsa) };
    });

    const vcDistribution = [
      { name: 'Under Capacity (V/C < 0.5)', value: rawLinks.filter((l: any) => (currentVolume(l) / (l.capacity || 20000)) < 0.5).length, fill: '#00ff66' },
      { name: 'Moderate (0.5-0.8)', value: rawLinks.filter((l: any) => { const r = currentVolume(l) / (l.capacity || 20000); return r >= 0.5 && r < 0.8; }).length, fill: '#fcee0a' },
      { name: 'Congested (0.8-1.0)', value: rawLinks.filter((l: any) => { const r = currentVolume(l) / (l.capacity || 20000); return r >= 0.8 && r <= 1.0; }).length, fill: '#ff9933' },
      { name: 'Over Capacity (V/C > 1.0)', value: rawLinks.filter((l: any) => (currentVolume(l) / (l.capacity || 20000)) > 1.0).length, fill: '#ff003c' }
    ];

    return {
      classes, allRegions, networkGrowthData, classGrowthData, classDistData, 
      classCompositionByRoadClass, classCompositionByRegion,
      regionalClassDistData, topPaved, topUnsealed,
      classAVsOther, heavyTruckRoutes, fastestGrowing, densityRoutes,
      regionalClassStackedData, surfaceSplitData, roadClassData, yoyGrowthData,
      regionLengths, regionGrowth, motorcycleDominance, regionalAdtData, lengthPerClass,
      esaData, networkEsaGrowth, vcDistribution,
      
      // Strategic Corridors (KJE, NB, KEE)
      strategicData: [
        { name: 'KJE (Kampala-Jinja Exp)', adt: 45000, growth: 8.5, trucks: 12000, color: '#00f0ff' },
        { name: 'Northern Bypass', adt: 38000, growth: 7.2, trucks: 15000, color: '#ff003c' },
        { name: 'KEE (Entebbe Exp)', adt: 28000, growth: 12.0, trucks: 2000, color: '#00ff66' },
        { name: 'Nakawa Corridor', adt: 65000, growth: 4.5, trucks: 8000, color: '#fcee0a' },
        { name: 'Kasokoso Link', adt: 12000, growth: 15.0, trucks: 500, color: '#b366ff' }
      ],

      // Expanded MACRO metrics
      macroExpandedStats: [
        ...allRegions.map(r => ({
          title: `Region: ${r} - ADT Distribution`,
          type: 'Radar',
          accent: '#00ff66',
          data: [
            { name: 'Growth', value: regionGrowth.find(rg => rg.region === r)?.rate || 0 },
            { name: 'Paved', value: Math.round((rawLinks.filter(l => l.region === r && l.surface_type === 'Bituminous').length / (rawLinks.filter(l => l.region === r).length || 1)) * 100) },
            { name: 'Density', value: Math.round(rawLinks.filter(l => l.region === r).reduce((s, l) => s + currentVolume(l), 0) / 1000) }
          ]
        })),
        ...classes.map(c => ({
          title: `Class: ${c} - Regional Share`,
          type: 'Bar',
          accent: '#fcee0a',
          data: allRegions.map(r => ({
            name: r.substring(0, 5),
            value: Math.round(rawLinks.filter(l => l.region === r).reduce((s, l) => s + (l.vehicle_classes?.[c as string] || 0) * currentScale(l), 0))
          }))
        })),
        ...roadClasses.map(rc => ({
          title: `Road Class: ${rc} - Loading`,
          type: 'Area',
          accent: '#00f0ff',
          data: years.map(y => ({
            name: y,
            value: Math.round(rawLinks.filter(l => l.road_class === rc).reduce((s, l) => s + (l.trajectory?.[y] || 0), 0) / 1000)
          }))
        }))
      ],

      // Deep Analytics Calculations
      deepMetrics: (() => {
        if (!deepAnalyticsData) return null;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyFactors = months.map((m, i) => {
          const monthData = deepAnalyticsData.filter((d: any) => d.month === i + 1);
          const avgGrowth = monthData.length ? monthData.reduce((s: any, d: any) => s + d.growth_rate_percent, 0) / monthData.length : 0;
          return { name: m, factor: Number(avgGrowth.toFixed(2)) };
        });

        const seasons = Array.from(new Set(deepAnalyticsData.map((d: any) => d.season)));
        const seasonalFactors = seasons.map(s => {
          const seasonData = deepAnalyticsData.filter((d: any) => d.season === s);
          const avgGrowth = seasonData.length ? seasonData.reduce((sum: any, d: any) => sum + d.growth_rate_percent, 0) / seasonData.length : 0;
          return { name: s, factor: Number(avgGrowth.toFixed(2)) };
        });

        const yearlyFactors = Array.from(new Set(deepAnalyticsData.map((d: any) => d.year))).sort().map(y => {
          const yearData = deepAnalyticsData.filter((d: any) => d.year === y);
          const avgGrowth = yearData.length ? yearData.reduce((sum: any, d: any) => sum + d.growth_rate_percent, 0) / yearData.length : 0;
          return { name: y, factor: Number(avgGrowth.toFixed(2)) };
        });

        // Granular segments joined with link metadata
        const roadSegments = Array.from(new Set(deepAnalyticsData.map((d: any) => d.road))).map(r => {
          const rData = deepAnalyticsData.filter((d: any) => d.road === r);
          const avgGrowth = rData.reduce((sum: any, d: any) => sum + d.growth_rate_percent, 0) / rData.length;
          
          // Try to find matching link metadata
          const sampleLink = rawLinks.find((l: any) => 
            (l.road_name && String(l.road_name).includes(String(r))) || 
            (l.link_name && String(l.link_name).includes(String(r)))
          );

          return { 
            name: r, 
            growth: Number(avgGrowth.toFixed(2)),
            region: sampleLink?.region || 'Central',
            roadClass: sampleLink?.road_class || 'A',
            surface: sampleLink?.surface_type || 'Bituminous'
          };
        });

        const growthByRegion = Array.from(new Set(roadSegments.map(s => s.region))).map(reg => {
          const regData = roadSegments.filter(s => s.region === reg);
          const avg = regData.reduce((sum, s) => sum + s.growth, 0) / regData.length;
          return { name: reg, growth: Number(avg.toFixed(2)) };
        });

        const growthByRoadClass = Array.from(new Set(roadSegments.map(s => s.roadClass))).map(rc => {
          const rcData = roadSegments.filter(s => s.roadClass === rc);
          const avg = rcData.reduce((sum, s) => sum + s.growth, 0) / rcData.length;
          return { name: `Class ${rc}`, growth: Number(avg.toFixed(2)) };
        });

        return { monthlyFactors, seasonalFactors, yearlyFactors, roadSegments, growthByRegion, growthByRoadClass };
      })(),

      // Sidebar content for Macro
      sidebarMetrics: (() => {
        let totalVol = rawLinks.reduce((s, l) => s + currentVolume(l), 0);
        let pavedCount = rawLinks.filter(l => {
          const s = String(l.surface_type || '').toLowerCase();
          return s.includes('bitum') || s.includes('paved') || s.includes('sealed');
        }).length;
        
        let bands = { fast: 0, yellow: 0, red: 0, darkRed: 0 };
        rawLinks.forEach(l => {
          let v = currentVolume(l);
          if (v > 15000) bands.darkRed++;
          else if (v > 8000) bands.red++;
          else if (v > 2000) bands.yellow++;
          else bands.fast++;
        });

        const stns = stationData.features || [];
        const atcCount = stns.filter(s => s.properties.has_atc).length;

        return {
          totalVol,
          growthRatio: Math.round((totalVol / (networkGrowthData[0]?.adt * linkCount || 1) - 1) * 100),
          pavedRatio: (pavedCount / (rawLinks.length || 1)) * 100,
          atcRatio: (atcCount / (stns.length || 1)) * 100,
          stnCount: stns.length,
          linkCount: rawLinks.length,
          bandData: [
            { name: 'Fast <2k', count: bands.fast, fill: '#2ecc71' },
            { name: 'Warn 2k-8k', count: bands.yellow, fill: '#ffcc33' },
            { name: 'Delay 8k-15k', count: bands.red, fill: '#ff3333' },
            { name: 'Gridlock >15k', count: bands.darkRed, fill: '#8b0000' }
          ]
        };
      })()
    };
  }, [data, currentYear, selectedRegion]);

  if (!analytics.classes) return <div style={{ color: '#00f0ff', padding: '100px', textAlign: 'center', fontFamily: 'monospace' }}>INITIALIZING NEURAL NET...</div>;

  const handleDownload = async (id) => {
    const element = document.getElementById(id);
    if (element) {
      const canvas = await html2canvas(element, {
        backgroundColor: '#02040a',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `${id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(2,6,15,0.95)', border: '1px solid #00f0ff', padding: '12px', borderRadius: '4px', color: '#fff', boxShadow: '0 0 15px rgba(0,240,255,0.3)', fontFamily: 'monospace', fontSize: '11px', zIndex: 1000 }}>
          <p style={{ fontWeight: 'bold', color: '#00f0ff', borderBottom: '1px solid rgba(0,240,255,0.3)', paddingBottom: '4px', marginBottom: '8px' }}>{label}</p>
          {payload.map((p: any, i: number) => (
             <div key={i} style={{ display: 'flex', gap: '16px', justifyContent: 'space-between', margin: '4px 0' }}>
               <span style={{ color: p.color || p.fill }}>{p.name || p.dataKey}:</span>
               <span style={{ fontWeight: 'bold' }}>{Number(p.value).toLocaleString()}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CyberCard = ({ id, title, children, className, accentColor = '#00f0ff', delay = 0, noPadding = false, style = {} }: any) => (
    <motion.div 
      id={id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: delay * 0.05 }}
      className={`cyber-panel ${className || ''}`}
      style={{ '--accent': accentColor, ...style } as React.CSSProperties}
    >
      <div className="cyber-panel-header">
        <div className="cyber-panel-title">
          <Crosshair size={12} color={accentColor} />
          {title}
        </div>
        <button 
          onClick={() => handleDownload(id)}
          style={{ background: 'transparent', border: 'none', color: accentColor, cursor: 'pointer' }}


        >
          <Download size={12} />
        </button>
      </div>
      <div style={{ flex: 1, position: 'relative', padding: noPadding ? 0 : '16px', minHeight: '280px' }}>
        {children}
      </div>
    </motion.div>
  );

  const xAxisProps = { stroke: "#8e92a4", fontSize: 10, tickLine: true, axisLine: true };
  const yAxisProps = { stroke: "#8e92a4", fontSize: 10, tickLine: true, axisLine: true };

  return (
    <div className="cyber-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .cyber-dashboard {
          background: #02040a;
          background-image: linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
          background-size: 30px 30px;
          color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .cyber-panel {
          background: rgba(2, 6, 15, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          position: relative;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5), 0 4px 15px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(8px);
        }
        .cyber-panel::before {
          content: ''; position: absolute; top: -1px; left: -1px; width: 12px; height: 12px;
          border-top: 2px solid var(--accent); border-left: 2px solid var(--accent);
        }
        .cyber-panel::after {
          content: ''; position: absolute; bottom: -1px; right: -1px; width: 12px; height: 12px;
          border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent);
        }
        .cyber-panel-header {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; justify-content: space-between; align-items: center;
          background: linear-gradient(90deg, rgba(255,255,255,0.02), transparent);
        }
        .cyber-panel-title {
          font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); font-weight: 700; display: flex; align-items: center; gap: 8px; font-family: monospace;
        }
        .cyber-panel-content {
          position: relative; width: 100%; height: 100%; min-height: 250px;
        }
        .nav-btn {
          background: transparent; border: 1px solid rgba(0,240,255,0.2); color: #8e92a4; padding: 6px 16px; cursor: pointer; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; border-radius: 2px;
        }
        .nav-btn.active { background: rgba(0,240,255,0.1); border-color: #00f0ff; color: #00f0ff; box-shadow: 0 0 10px rgba(0,240,255,0.2); }
        .nav-btn:hover:not(.active) { background: rgba(255,255,255,0.05); }
        
        .dense-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          padding-bottom: 40px;
        }
        
        .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line { stroke: rgba(255,255,255,0.05); }
        .recharts-text { fill: #8e92a4; font-family: monospace; font-size: 10px; }
        .recharts-legend-item-text { color: #8e92a4 !important; font-family: monospace; font-size: 10px; }
      `}</style>

      <svg width="0" height="0">
        <defs>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* HEADER */}
      <div style={{ paddingTop: '80px', paddingBottom: '16px', paddingLeft: '24px', paddingRight: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,240,255,0.2)', background: 'rgba(2,6,15,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Hexagon size={32} color="#00f0ff" style={{ filter: 'drop-shadow(0 0 8px #00f0ff)' }} />
            <div>
              <h1 style={{ fontSize: '18px', margin: 0, color: '#fff', letterSpacing: '2px', textTransform: 'uppercase' }}>National Network Forecast</h1>
              <div style={{ fontSize: '10px', color: '#00f0ff', fontFamily: 'monospace', letterSpacing: '1px' }}>V.4.9 // STATUS: SECURE</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginLeft: '32px' }}>
            {[
              { id: 'MACRO', icon: <Globe size={14} />, label: 'Macro' },
              { id: 'REGIONS', icon: <Layers size={14} />, label: 'Regions' },
              { id: 'CLASSES', icon: <Activity size={14} />, label: 'Classes' },
              { id: 'ASSETS', icon: <Layers size={14} />, label: 'Assets' },
              { id: 'ENGINEERING', icon: <Cpu size={14} />, label: 'Analysis' },
              { id: 'STATIONS', icon: <Radio size={14} />, label: 'Stations' },
              { id: 'STRATEGIC', icon: <Zap size={14} />, label: 'Strategic' },
              { id: 'DEEP', icon: <Activity size={14} />, label: 'Deep' }
            ].map(view => (
              <button 
                key={view.id}
                className={`nav-btn ${activeView === view.id ? 'active' : ''}`} 
                onClick={() => setActiveView(view.id)}
              >
                {view.icon} {view.label}
              </button>
            ))}
          </div>
      </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} style={{ background: 'transparent', border: '1px solid rgba(0,240,255,0.5)', color: '#00f0ff', padding: '6px 12px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}>
            <option value="All">TARGET: GLOBAL</option>
            {(analytics.allRegions as string[]).map(r => <option key={r} value={r}>TARGET: {r.toUpperCase()}</option>)}
          </select>
          <button onClick={onClose} style={{ background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c', color: '#ff003c', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', cursor: 'pointer' }}>
            <X size={14} /> EXIT FORECAST
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto', overflowX: 'hidden' }}>
        <AnimatePresence mode="wait">
          
          {activeView === 'MACRO' && (
            <motion.div key="macro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid">
              
              <CyberCard id="macro-sidebar-summary" title="National Traffic Prediction Summary" delay={0} accentColor="#ff3366" style={{ gridColumn: '1 / -1' }}>
                <div style={{ padding: '8px' }}>
                  <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#8e92a4' }}>Multiparametric Network Diagnostics | Year: <strong style={{color:'#fff'}}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                  
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
                    <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '11px', color: '#8e92a4', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Network ADT</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '8px 0' }}>{Math.round(analytics.sidebarMetrics.totalVol).toLocaleString()}</div>
                      <div style={{ fontSize: '11px', color: '#00f0ff' }}>Active VKT Proxy</div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '11px', color: '#8e92a4', textTransform: 'uppercase', letterSpacing: '1px' }}>Network Growth Ratio</div>
                      <div style={{ fontSize: '32px', fontWeight: '800', color: '#00ff66', margin: '8px 0' }}>+{analytics.sidebarMetrics.growthRatio}%</div>
                      <div style={{ fontSize: '11px', color: '#ff3366' }}>Since 2016 Base</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div>
                      <h4 style={{ fontSize: '12px', color: '#00c3ff', marginBottom: '16px', textTransform: 'uppercase' }}>Network Trajectory Envelope (2016 - Now)</h4>
                      <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart isAnimationActive={false} data={analytics.networkGrowthData}>
                            <defs>
                              <linearGradient id="macroGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00c3ff" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00c3ff" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="year" fontSize={10} stroke="#8e92a4" />
                            <YAxis hide domain={['dataMin', 'dataMax']} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area isAnimationActive={false} type="monotone" dataKey="adt" stroke="#00c3ff" fill="url(#macroGrad)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <h4 style={{ fontSize: '11px', color: '#8e92a4', marginBottom: '10px' }}>Automatic Station Ratio</h4>
                        <div style={{ height: '120px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart isAnimationActive={false}>
                              <Pie isAnimationActive={false} data={[{ name: 'ATC', value: analytics.sidebarMetrics.atcRatio }, { name: 'Manual', value: 100 - analytics.sidebarMetrics.atcRatio }]} innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                                <Cell fill="#00c3ff" />
                                <Cell fill="rgba(255,255,255,0.1)" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ fontSize: '11px', color: '#fff' }}>{analytics.sidebarMetrics.stnCount} Tracked Nodes</div>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <h4 style={{ fontSize: '11px', color: '#8e92a4', marginBottom: '10px' }}>Surface Paving Index</h4>
                        <div style={{ height: '120px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart isAnimationActive={false}>
                              <Pie isAnimationActive={false} data={[{ name: 'Paved', value: analytics.sidebarMetrics.pavedRatio }, { name: 'Unsealed', value: 100 - analytics.sidebarMetrics.pavedRatio }]} innerRadius={35} outerRadius={55} dataKey="value" stroke="none">
                                <Cell fill="#00ff66" />
                                <Cell fill="rgba(255,255,255,0.1)" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ fontSize: '11px', color: '#fff' }}>{analytics.sidebarMetrics.pavedRatio.toFixed(1)}% Sealed</div>
                      </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <h4 style={{ fontSize: '12px', color: '#fcee0a', marginBottom: '16px', textTransform: 'uppercase' }}>Source Data Banding (AADT Volumes)</h4>
                      <div style={{ height: '180px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart isAnimationActive={false} data={analytics.sidebarMetrics.bandData} layout="vertical" margin={{ left: 20, right: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} fontSize={10} stroke="#8e92a4" axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar isAnimationActive={false} dataKey="count" radius={[0, 4, 4, 0]}>
                              {analytics.sidebarMetrics.bandData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </CyberCard>

              <CyberCard id="chart-growth" title="Network Mean ADT Growth Trajectory" delay={1} accentColor="#00f0ff" style={{ gridColumn: '1 / -1', minHeight: '500px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart isAnimationActive={false} data={analytics.networkGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" {...xAxisProps} label={{ value: 'Year', position: 'insideBottom', offset: -10, fill: '#8e92a4' }} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} label={{ value: 'Average Daily Traffic (ADT)', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Area isAnimationActive={false} name="Mean ADT Forecast" type="monotone" dataKey="adt" stroke="#00f0ff" strokeWidth={2} fillOpacity={0.1} fill="#00f0ff" filter="url(#neonGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-class-dist" title="ADT per Vehicle Class (Proportions)" delay={2} accentColor="#ff003c" style={{ minHeight: '500px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart isAnimationActive={false}>
                    <Pie isAnimationActive={false} data={analytics.classDistData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} stroke="none" filter="url(#neonGlow)">
                      {analytics.classDistData.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={80} layout="horizontal" />
                  </PieChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-class-bar" title="Average Daily Traffic (ADT) per Vehicle Class" delay={3} accentColor="#00ff66" style={{ gridColumn: '1 / -1', minHeight: '600px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart isAnimationActive={false} data={analytics.classDistData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" {...xAxisProps} height={60} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} label={{ value: 'ADT (veh/day)', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" align="right" layout="vertical" />
                    <Bar isAnimationActive={false} name="ADT" dataKey="value" fill="#00ff66" filter="url(#neonGlow)">
                      {analytics.classDistData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-class-stacked-rc" title="ADT per Vehicle Class (Stacked by Road Class)" delay={4} accentColor="#fcee0a" style={{ gridColumn: '1 / -1', minHeight: '600px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart isAnimationActive={false} data={analytics.classCompositionByRoadClass} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" {...xAxisProps} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} label={{ value: 'ADT (veh/day)', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" align="right" layout="vertical" />
                    {analytics.classes.map((cls, i) => (
                      <Bar isAnimationActive={false} key={cls} dataKey={cls} stackId="a" fill={CYBER_COLORS[i]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-class-stacked-reg" title="ADT per Vehicle Class (Stacked by Region)" delay={5} accentColor="#b366ff" style={{ gridColumn: '1 / -1', minHeight: '700px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart isAnimationActive={false} data={analytics.classCompositionByRegion} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" {...xAxisProps} height={60} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} label={{ value: 'ADT (veh/day)', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" align="right" layout="vertical" />
                    {analytics.classes.map((cls, i) => (
                      <Bar isAnimationActive={false} key={cls} dataKey={cls} stackId="a" fill={CYBER_COLORS[i]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-class-clustered-rc" title="ADT per Vehicle Class (Clustered by Road Class)" delay={6} accentColor="#00f0ff" style={{ gridColumn: '1 / -1', minHeight: '600px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart isAnimationActive={false} data={analytics.classCompositionByRoadClass} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" {...xAxisProps} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} label={{ value: 'ADT (veh/day)', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={80} layout="horizontal" />
                    {analytics.classes.map((cls, i) => (
                      <Bar isAnimationActive={false} key={cls} dataKey={cls} fill={CYBER_COLORS[i]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-class-clustered-reg" title="ADT per Vehicle Class (Clustered by Region)" delay={7} accentColor="#ff003c" style={{ gridColumn: '1 / -1', minHeight: '600px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart isAnimationActive={false} data={analytics.classCompositionByRegion} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" {...xAxisProps} height={60} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} label={{ value: 'ADT (veh/day)', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={120} layout="horizontal" />
                    {analytics.classes.map((cls, i) => (
                      <Bar isAnimationActive={false} key={cls} dataKey={cls} fill={CYBER_COLORS[i]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-yoy" title="YoY Increment Rates" delay={8} accentColor="#b366ff" style={{ minHeight: '500px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart isAnimationActive={false} data={analytics.yoyGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" {...xAxisProps} />
                    <YAxis {...yAxisProps} label={{ value: 'Growth Increment', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Line isAnimationActive={false} name="Growth YoY" type="step" dataKey="increment" stroke="#b366ff" strokeWidth={2} dot={false} filter="url(#neonGlow)" />
                  </LineChart>
                </ResponsiveContainer>
              </CyberCard>

              {/* expanded macro stats */}
              {analytics.macroExpandedStats.map((stat, idx) => (
                <CyberCard key={idx} id={`chart-macro-exp-${idx}`} title={stat.title} delay={idx*0.02} accentColor={stat.accent} style={{ height: '350px' }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    {stat.type === 'Radar' ? (
                      <RadarChart cx="50%" cy="50%" outerRadius="60%" data={stat.data}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="name" fontSize={8} fill="#8e92a4" />
                        <Radar isAnimationActive={false} name="Value" dataKey="value" stroke={stat.accent} fill={stat.accent} fillOpacity={0.3} />
                      </RadarChart>
                    ) : stat.type === 'Area' ? (
                      <AreaChart isAnimationActive={false} data={stat.data}>
                         <XAxis dataKey="name" hide />
                         <Area isAnimationActive={false} type="monotone" dataKey="value" stroke={stat.accent} fill={stat.accent} fillOpacity={0.1} />
                         <Tooltip content={<CustomTooltip />} />
                      </AreaChart>
                    ) : (
                      <BarChart isAnimationActive={false} data={stat.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                        <XAxis dataKey="name" fontSize={8} />
                        <Bar isAnimationActive={false} dataKey="value" fill={stat.accent} />
                        <Tooltip content={<CustomTooltip />} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </CyberCard>
              ))}

            </motion.div>
          )}

          {activeView === 'REGIONS' && (
            <motion.div key="regions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid">
              
              <CyberCard id="chart-reg-adt" title="Regional ADT Flow Matrix" delay={1} accentColor="#00f0ff">
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={analytics.regionalAdtData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <XAxis dataKey="region" angle={-45} textAnchor="end" {...xAxisProps} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Bar isAnimationActive={false} name="Average Daily Traffic (ADT)" dataKey="volume" fill="#00f0ff" filter="url(#neonGlow)" />
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              {analytics.regionalClassDistData.map((rd: any, i: number) => (
                <CyberCard key={rd.name} id={`chart-reg-dist-${i}`} title={`Dispersal: ${rd.name}`} delay={i+2} accentColor={rd.color}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={rd.data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                      <XAxis dataKey="region" angle={-45} textAnchor="end" {...xAxisProps} />
                      <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={30} />
                      <Bar isAnimationActive={false} name={rd.name} dataKey="volume" fill={rd.color} filter="url(#neonGlow)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CyberCard>
              ))}
            </motion.div>
          )}

          {activeView === 'CLASSES' && (
            <motion.div key="classes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid">
              {analytics.classGrowthData.map((cg: any, i: number) => (
                <CyberCard key={cg.name} id={`chart-class-traj-${i}`} title={`Trajectory: ${cg.name}`} delay={i} accentColor={cg.color}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <LineChart data={cg.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <XAxis dataKey="year" {...xAxisProps} />
                      <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={30} />
                      <Line isAnimationActive={false} name={cg.name} type="monotone" dataKey="adt" stroke={cg.color} strokeWidth={2} dot={false} filter="url(#neonGlow)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CyberCard>
              ))}
            </motion.div>
          )}

          {activeView === 'ASSETS' && (
            <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid">
              
              <CyberCard id="chart-density" title="Top High-Density Corridors" delay={1} accentColor="#00f0ff">
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={analytics.densityRoutes} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" {...xAxisProps} />
                    <YAxis dataKey="name" type="category" width={80} {...yAxisProps} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Bar isAnimationActive={false} name="ADT Density" dataKey="density" fill="#00f0ff" filter="url(#neonGlow)" />
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-trucks" title="Top Heavy Transit Corridors" delay={2} accentColor="#ff003c">
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={analytics.heavyTruckRoutes} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" {...xAxisProps} />
                    <YAxis dataKey="name" type="category" width={80} {...yAxisProps} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Bar isAnimationActive={false} name="Heavy Truck ADT" dataKey="trucks" fill="#ff003c" filter="url(#neonGlow)" />
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-growing" title="Fastest Growing Infrastructure" delay={3} accentColor="#fcee0a">
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={analytics.fastestGrowing} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" {...xAxisProps} />
                    <YAxis {...yAxisProps} tickFormatter={v => v + '%'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Line isAnimationActive={false} name="Growth Rate" type="step" dataKey="rate" stroke="#fcee0a" strokeWidth={2} dot={false} filter="url(#neonGlow)" />
                  </LineChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-paved" title="Top Volume Leaders (Paved)" delay={4} accentColor="#b366ff">
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={analytics.topPaved} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" {...xAxisProps} />
                    <YAxis dataKey="name" type="category" width={80} {...yAxisProps} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Bar isAnimationActive={false} name="Forecast ADT" dataKey="volume" fill="#b366ff" filter="url(#neonGlow)" />
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-unsealed" title="Top Volume Leaders (Unsealed)" delay={5} accentColor="#ff9933">
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={analytics.topUnsealed} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" {...xAxisProps} />
                    <YAxis dataKey="name" type="category" width={80} {...yAxisProps} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Bar isAnimationActive={false} name="Forecast ADT" dataKey="volume" fill="#ff9933" filter="url(#neonGlow)" />
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

            </motion.div>
          )}

          {activeView === 'ENGINEERING' && (
            <motion.div key="engineering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid">
              
              <CyberCard id="chart-esa-loading" title="Daily ESA Loading (Top Corridors)" delay={1} accentColor="#ff003c">
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={analytics.esaData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <XAxis type="number" {...xAxisProps} />
                    <YAxis dataKey="name" type="category" width={80} {...yAxisProps} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Bar isAnimationActive={false} name="Equivalent Standard Axles (ESA)" dataKey="esa" fill="#ff003c" filter="url(#neonGlow)" />
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-esa-growth" title="Network ESA Growth Projection" delay={2} accentColor="#00f0ff">
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart isAnimationActive={false} data={analytics.networkEsaGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="year" {...xAxisProps} />
                    <YAxis {...yAxisProps} tickFormatter={v => (v/1000).toFixed(0)+'k'} label={{ value: 'Total ESA/day', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={30} />
                    <Area isAnimationActive={false} name="Network ESA Load" type="monotone" dataKey="esa" stroke="#00f0ff" strokeWidth={2} fillOpacity={0.1} fill="#00f0ff" filter="url(#neonGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-vc-ratio" title="Network Volume/Capacity (V/C) Status" delay={3} accentColor="#fcee0a">
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart isAnimationActive={false}>
                    <Pie isAnimationActive={false} data={analytics.vcDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} stroke="none" filter="url(#neonGlow)">
                      {analytics.vcDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={80} layout="horizontal" />
                  </PieChart>
                </ResponsiveContainer>
              </CyberCard>

            </motion.div>
          )}

          {activeView === 'STRATEGIC' && (
            <motion.div key="strategic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid">
              
              <CyberCard id="chart-strat-adt" title="Strategic Corridor ADT (2025-2035)" delay={1} accentColor="#00f0ff" style={{ gridColumn: '1 / -1', minHeight: '400px' }}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart isAnimationActive={false} data={analytics.strategicData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="name" {...xAxisProps} />
                    <YAxis {...yAxisProps} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar isAnimationActive={false} dataKey="adt" fill="#00f0ff">
                      {analytics.strategicData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CyberCard>

              <CyberCard id="chart-vc-detail" title="Network Capacity Saturation Index" delay={5} accentColor="#ff9933" style={{ gridColumn: '1 / -1' }}>
                <ResponsiveContainer width='100%' height='100%'>
                   <AreaChart isAnimationActive={false} data={analytics.networkGrowthData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <XAxis dataKey="year" {...xAxisProps} />
                      <YAxis domain={[0, 100]} unit="%" {...yAxisProps} />
                      <Area isAnimationActive={false} name="Saturation %" type="monotone" dataKey="adt" stroke="#ff9933" fill="#ff9933" fillOpacity={0.1} />
                   </AreaChart>
                </ResponsiveContainer>
              </CyberCard>

            </motion.div>
          )}

          {activeView === 'DEEP' && (
            <motion.div key="deep" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid">
               <CyberCard id="deep-temporal-factors" title="Temporal Traffic Growth Factors" delay={0} accentColor="#00f0ff" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#8e92a4', marginBottom: '16px', textTransform: 'uppercase' }}>Monthly Seasonal Factors</h4>
                      <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.deepMetrics?.monthlyFactors}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" fontSize={10} stroke="#8e92a4" />
                            <YAxis fontSize={10} stroke="#8e92a4" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="factor" fill="#00f0ff" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#8e92a4', marginBottom: '16px', textTransform: 'uppercase' }}>Seasonal Growth Comparison</h4>
                      <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={analytics.deepMetrics?.seasonalFactors} dataKey="factor" nameKey="name" innerRadius={40} outerRadius={70}>
                              {analytics.deepMetrics?.seasonalFactors.map((e: any, i: number) => <Cell key={i} fill={CYBER_COLORS[i % CYBER_COLORS.length]} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={40} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#8e92a4', marginBottom: '16px', textTransform: 'uppercase' }}>Yearly Growth Factor Trend</h4>
                      <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analytics.deepMetrics?.yearlyFactors}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" fontSize={10} stroke="#8e92a4" />
                            <YAxis fontSize={10} stroke="#8e92a4" />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="factor" stroke="#ff003c" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
               </CyberCard>

               <CyberCard id="deep-granular-matrix" title="Granular Growth Matrix (Link-Level Diagnostics)" delay={1} accentColor="#00ff66" style={{ gridColumn: '1 / -1' }}>
                 <div style={{ padding: '16px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid rgba(0,240,255,0.2)', textAlign: 'left' }}>
                          <th style={{ padding: '12px 8px', color: '#00f0ff' }}>Road Corridor</th>
                          <th style={{ padding: '12px 8px', color: '#00f0ff' }}>Road Class</th>
                          <th style={{ padding: '12px 8px', color: '#00f0ff' }}>Surface</th>
                          <th style={{ padding: '12px 8px', color: '#00f0ff' }}>Growth Factor (%)</th>
                          <th style={{ padding: '12px 8px', color: '#00f0ff' }}>Regional Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.deepMetrics?.roadSegments.map((r: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '12px 8px', fontWeight: '700' }}>{r.name}</td>
                            <td style={{ padding: '12px 8px' }}>{r.roadClass}</td>
                            <td style={{ padding: '12px 8px' }}>{r.surface}</td>
                            <td style={{ padding: '12px 8px', color: '#00ff66' }}>{r.growth}%</td>
                            <td style={{ padding: '12px 8px', color: '#8e92a4' }}>{r.region}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </CyberCard>

               <CyberCard id="deep-segmented-analysis" title="Multidimensional Growth Segmentation" delay={2} accentColor="#fcee0a" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', padding: '16px' }}>
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#8e92a4', marginBottom: '16px', textTransform: 'uppercase' }}>Growth by Region</h4>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.deepMetrics?.growthByRegion} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" fontSize={10} stroke="#8e92a4" />
                            <YAxis dataKey="name" type="category" fontSize={10} stroke="#8e92a4" width={80} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="growth" fill="#00ff66" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '11px', color: '#8e92a4', marginBottom: '16px', textTransform: 'uppercase' }}>Growth by Road Classification</h4>
                      <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.deepMetrics?.growthByRoadClass}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" fontSize={10} stroke="#8e92a4" />
                            <YAxis fontSize={10} stroke="#8e92a4" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="growth" fill="#fcee0a" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
               </CyberCard>

               <CyberCard id="deep-cross-segmented" title="Detailed Corridor Performance" delay={3} accentColor="#b366ff" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ height: '400px', padding: '16px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.deepMetrics?.roadSegments} margin={{ bottom: 100 }}>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" fontSize={10} height={100} />
                        <YAxis tickFormatter={v => v + '%'} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="growth" fill="#b366ff" filter="url(#neonGlow)">
                          {analytics.deepMetrics?.roadSegments.map((e: any, i: number) => <Cell key={i} fill={CYBER_COLORS[i % CYBER_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </CyberCard>
            </motion.div>
          )}

          {activeView === 'STATIONS' && (() => {
            const features = stationData.features || [];
            const links = data?.features ? data.features.map((f: any) => f.properties) : [];
            const classes = ['Motorcycles', 'Saloon Cars & Taxis', 'Light Goods', 'Small Buses', 'Medium Buses', 'Large Buses', 'Light Trucks', 'Medium Trucks', 'Heavy Trucks', 'Truck Trailers', 'Truck Trailers 5ax'];
            const currentVolume = (l: any) => (l.trajectory && l.trajectory[Math.floor(currentYear)]) ? l.trajectory[Math.floor(currentYear)] : 0;
            const currentScale = (l: any) => l.aadt_2025 ? currentVolume(l) / l.aadt_2025 : 0;
            const atcStations = features.filter((f: any) => f.properties.type === 'ATC');
            const manualStations = features.filter((f: any) => f.properties.type === 'Manual');
            const activeStations = features.filter((f: any) => f.properties.status === 'Active');
            const typeSplit = [
              { name: 'ATC (Automatic)', value: atcStations.length, fill: '#00c3ff' },
              { name: 'Manual (TCS)', value: manualStations.length, fill: '#ffcc33' }
            ];
            const statusSplit = [
              { name: 'Active', value: activeStations.length, fill: '#00ff66' },
              { name: 'Inactive', value: features.length - activeStations.length, fill: '#ff3366' }
            ];
            const quadrants = [
              { name: 'Northern (lat>2°)', value: features.filter((f: any) => f.geometry.coordinates[1] > 2).length, fill: '#00f0ff' },
              { name: 'Central (0.5-2°)', value: features.filter((f: any) => f.geometry.coordinates[1] >= 0.5 && f.geometry.coordinates[1] <= 2).length, fill: '#b366ff' },
              { name: 'Southern (lat<0.5°)', value: features.filter((f: any) => f.geometry.coordinates[1] < 0.5).length, fill: '#ff9933' }
            ];
            const lonBands = [
              { name: 'West (<31°E)', value: features.filter((f: any) => f.geometry.coordinates[0] < 31).length, fill: '#ff003c' },
              { name: 'Central (31-33°E)', value: features.filter((f: any) => f.geometry.coordinates[0] >= 31 && f.geometry.coordinates[0] < 33).length, fill: '#00ff66' },
              { name: 'East (>33°E)', value: features.filter((f: any) => f.geometry.coordinates[0] >= 33).length, fill: '#fcee0a' }
            ];
            const atcWithSection = atcStations.filter((f: any) => f.properties.road_section);
            const atcCoverage = atcWithSection.map((f: any, i: number) => ({
              name: f.properties.road_section.substring(0, 18),
              id: f.properties.site_id,
              fill: CYBER_COLORS[i % CYBER_COLORS.length]
            }));
            const latBands = Array.from({ length: 10 }, (_, i) => {
              const lo = -1.5 + i * 0.5, hi = lo + 0.5;
              return { name: `${lo.toFixed(1)}°`, count: features.filter((f: any) => f.geometry.coordinates[1] >= lo && f.geometry.coordinates[1] < hi).length, fill: CYBER_COLORS[i % CYBER_COLORS.length] };
            });
            // Network-level vehicle class ADT
            const linkCount = links.length || 1;
            const networkClassADT = classes.map((cls, i) => ({
              name: cls, fill: CYBER_COLORS[i],
              adt: Math.round(links.reduce((s: number, l: any) => s + ((l.vehicle_classes?.[cls] || 0) * currentScale(l)), 0) / linkCount)
            }));
            // Network ADT summary metrics
            const totalNetADT = Math.round(links.reduce((s: number, l: any) => s + currentVolume(l), 0) / linkCount);
            const mcADT = networkClassADT.find(c => c.name === 'Motorcycles')?.adt || 0;
            const heavyClasses = ['Medium Trucks', 'Heavy Trucks', 'Truck Trailers', 'Truck Trailers 5ax'];
            const heavyADT = networkClassADT.filter(c => heavyClasses.includes(c.name)).reduce((s, c) => s + c.adt, 0);
            // ADT by road class
            const roadClasses = ['A', 'B', 'C', 'M'];
            const adtByClass = roadClasses.map(rc => {
              const rcLinks = links.filter((l: any) => l.road_class === rc);
              const cnt = rcLinks.length || 1;
              return { name: `Class ${rc}`, adt: Math.round(rcLinks.reduce((s: number, l: any) => s + currentVolume(l), 0) / cnt), fill: CYBER_COLORS[roadClasses.indexOf(rc)] };
            });
            // ADT by surface
            const surfaceADT = [
              { name: 'Paved', adt: Math.round(links.filter((l: any) => (l.surface_type || '').includes('Bitum')).reduce((s: number, l: any) => s + currentVolume(l), 0) / (links.filter((l: any) => (l.surface_type || '').includes('Bitum')).length || 1)), fill: '#00c3ff' },
              { name: 'Unsealed', adt: Math.round(links.filter((l: any) => l.surface_type === 'Unsealed').reduce((s: number, l: any) => s + currentVolume(l), 0) / (links.filter((l: any) => l.surface_type === 'Unsealed').length || 1)), fill: '#ff9933' }
            ];
            // MC dominance ratio
            const mcDominance = [
              { name: 'Motorcycles', value: mcADT, fill: '#FF6347' },
              { name: 'Other Motorized', value: totalNetADT - mcADT, fill: '#00c3ff' }
            ];
            return (
              <motion.div key="stations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="dense-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))' }}>
                <CyberCard id="stn-summary" title={`Station Network Overview (${features.length} Sites)`} delay={0} accentColor="#00c3ff" style={{ gridColumn: '1 / -1', minHeight: '120px' }}>
                  <div style={{ display: 'flex', gap: '24px', justifyContent: 'space-around', padding: '16px 0', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Total Stations', value: features.length, color: '#fff' },
                      { label: 'ATC (Automatic)', value: atcStations.length, color: '#00c3ff' },
                      { label: 'Manual (TCS)', value: manualStations.length, color: '#ffcc33' },
                      { label: 'Active', value: activeStations.length, color: '#00ff66' },
                      { label: 'Coverage Ratio', value: `${((atcStations.length / features.length) * 100).toFixed(1)}%`, color: '#b366ff' },
                      { label: 'Mean Network ADT', value: totalNetADT.toLocaleString(), color: '#00f0ff' },
                      { label: 'MC Share', value: `${totalNetADT ? ((mcADT/totalNetADT)*100).toFixed(1) : 0}%`, color: '#FF6347' },
                      { label: 'Heavy Veh ADT', value: heavyADT.toLocaleString(), color: '#7B68EE' }
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: '#8e92a4', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </CyberCard>
                <CyberCard id="stn-type" title="Station Type Distribution" delay={1} accentColor="#00c3ff">
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart isAnimationActive={false}><Pie isAnimationActive={false} data={typeSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} stroke="none">{typeSplit.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" height={40} /></PieChart>
                  </ResponsiveContainer>
                </CyberCard>
                <CyberCard id="stn-status" title="Operational Status" delay={2} accentColor="#00ff66">
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart isAnimationActive={false}><Pie isAnimationActive={false} data={statusSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} stroke="none">{statusSplit.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" height={40} /></PieChart>
                  </ResponsiveContainer>
                </CyberCard>
                {/* NEW: Vehicle Class ADT Breakdown */}
                <CyberCard id="stn-vc-adt" title="Network Mean ADT per Vehicle Class" delay={3} accentColor="#00ff66" style={{ gridColumn: '1 / -1', minHeight: '500px' }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart isAnimationActive={false} data={networkClassADT} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" {...xAxisProps} height={60} />
                      <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} label={{ value: 'ADT (veh/day)', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar isAnimationActive={false} name="Mean ADT" dataKey="adt" filter="url(#neonGlow)">{networkClassADT.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CyberCard>
                {/* NEW: MC Dominance */}
                <CyberCard id="stn-mc-ratio" title="Motorcycle vs Other Motorized" delay={4} accentColor="#FF6347">
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart isAnimationActive={false}><Pie isAnimationActive={false} data={mcDominance} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} stroke="none">{mcDominance.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" height={40} /></PieChart>
                  </ResponsiveContainer>
                </CyberCard>
                {/* NEW: ADT by Road Class */}
                <CyberCard id="stn-adt-class" title="Mean ADT by Road Classification" delay={5} accentColor="#fcee0a">
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart isAnimationActive={false} data={adtByClass} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" {...xAxisProps} />
                      <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar isAnimationActive={false} name="Mean ADT" dataKey="adt" filter="url(#neonGlow)">{adtByClass.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CyberCard>
                {/* NEW: ADT by Surface */}
                <CyberCard id="stn-adt-surface" title="Mean ADT by Surface Type" delay={6} accentColor="#00c3ff">
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={surfaceADT} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" {...xAxisProps} />
                      <YAxis {...yAxisProps} tickFormatter={v => (v/1000)+'k'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar isAnimationActive={false} name="Mean ADT" dataKey="adt" filter="url(#neonGlow)">{surfaceADT.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CyberCard>
                <CyberCard id="stn-lat-dist" title="Latitude Zone Distribution" delay={7} accentColor="#b366ff">
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart><Pie isAnimationActive={false} data={quadrants} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} stroke="none">{quadrants.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" height={40} /></PieChart>
                  </ResponsiveContainer>
                </CyberCard>
                <CyberCard id="stn-lon-dist" title="Longitude Zone Distribution" delay={8} accentColor="#fcee0a">
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart><Pie isAnimationActive={false} data={lonBands} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} stroke="none">{lonBands.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend verticalAlign="bottom" height={40} /></PieChart>
                  </ResponsiveContainer>
                </CyberCard>
                <CyberCard id="stn-density" title="Station Density by Latitude Band" delay={9} accentColor="#00f0ff" style={{ gridColumn: '1 / -1' }}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={latBands} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" {...xAxisProps} label={{ value: 'Latitude Band', position: 'insideBottom', offset: -10, fill: '#8e92a4' }} />
                      <YAxis {...yAxisProps} label={{ value: 'Station Count', angle: -90, position: 'insideLeft', fill: '#8e92a4' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar isAnimationActive={false} dataKey="count" fill="#00f0ff">{latBands.map((e, i) => <Cell key={i} fill={e.fill} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CyberCard>
                <CyberCard id="stn-atc-sections" title="ATC Station Road Sections" delay={10} accentColor="#00c3ff" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', padding: '8px' }}>
                    {atcCoverage.map((s, i) => (
                      <div key={i} style={{ background: 'rgba(0,195,255,0.05)', border: '1px solid rgba(0,195,255,0.15)', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.fill, boxShadow: `0 0 6px ${s.fill}` }} />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>{s.name}</div>
                          <div style={{ fontSize: '10px', color: '#8e92a4' }}>{s.id}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CyberCard>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
