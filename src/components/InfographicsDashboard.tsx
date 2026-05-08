import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import infographicsData from '../data/infographics_data.json';
import { X, BarChart2 } from 'lucide-react';
import ShinyText from './ShinyText';

export default function InfographicsDashboard({ onClose }) {
  const { charts } = infographicsData;

  const NEON_COLORS = ['#39ff14', '#ff00ff', '#00ffff', '#ffff00', '#ff3366'];

  const renderChart = (chart) => {
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey={chart.xKey} tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 'bold' }} tickLine={false} axisLine={{stroke: '#39ff14'}} />
              <YAxis tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 'bold' }} tickLine={false} axisLine={{stroke: '#39ff14'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '2px solid #00ffff', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
                itemStyle={{ color: '#00ffff', fontWeight: 'bold', fontSize: '16px' }}
              />
              <Bar dataKey={chart.yKey} radius={[4, 4, 0, 0]}>
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} style={{ filter: 'drop-shadow(0px 0px 8px '+NEON_COLORS[index % NEON_COLORS.length]+')' }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey={chart.xKey} tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 'bold' }} tickLine={false} axisLine={{stroke: '#ff00ff'}} />
              <YAxis tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 'bold' }} tickLine={false} axisLine={{stroke: '#ff00ff'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '2px solid #ff00ff', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }} />
              {chart.yKeys.map((key, index) => (
                <Line type="monotone" key={key} dataKey={key} stroke={NEON_COLORS[index % NEON_COLORS.length]} strokeWidth={4} dot={{ stroke: '#fff', strokeWidth: 2, fill: NEON_COLORS[index % NEON_COLORS.length] }} style={{ filter: 'drop-shadow(0px 0px 6px '+NEON_COLORS[index % NEON_COLORS.length]+')' }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={chart.data} dataKey={chart.dataKey} nameKey={chart.nameKey} cx="50%" cy="50%" outerRadius={90} label={{fill: '#ffffff', fontWeight: 'bold', fontSize: 13}} stroke="none">
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} style={{ filter: 'drop-shadow(0px 0px 4px '+NEON_COLORS[index % NEON_COLORS.length]+')' }} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '2px solid #ffff00', borderRadius: '8px', color: '#fff', fontWeight: 'bold' }}
                itemStyle={{ color: '#ffff00', fontWeight: 'bold', fontSize: '16px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, bottom: 0,
      width: '800px', // Massive left pane
      backgroundColor: 'rgba(5, 5, 10, 0.95)',
      backdropFilter: 'blur(16px)',
      borderRight: '2px solid #00ffff',
      boxShadow: '8px 0px 32px rgba(0, 255, 255, 0.2)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      padding: '32px',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', paddingBottom: '16px', borderBottom: '2px solid #ff00ff' }}>
        <h1 style={{ fontSize: '28px', margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BarChart2 size={36} color="#39ff14" style={{ filter: 'drop-shadow(0px 0px 8px #39ff14)' }} />
          <ShinyText text="Deep Class Analytics" speed={3} className="text-4xl font-bold" shineColor="#00ffff" color="#fff" />
        </h1>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,0,255,0.1)',
            border: '2px solid #ff00ff',
            borderRadius: '50%',
            width: '48px', height: '48px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: '#ff00ff',
            boxShadow: '0 0 12px rgba(255, 0, 255, 0.5)'
          }}
        >
          <X size={24} />
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        paddingRight: '16px'
      }}>
        {charts.map((chart) => (
          <div key={chart.id} style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(0,255,255,0.3)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: 'inset 0 0 20px rgba(0,255,255,0.05)'
          }}>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#ffff00', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 0 8px rgba(255,255,0,0.5)' }}>{chart.title}</h3>
            {renderChart(chart)}
          </div>
        ))}
      </div>
    </div>
  );
}
