import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, Radio, Battery, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function StationDetailsPane({ station, onClose }) {
  if (!station) return null;
  const p = station.properties;

  // Mock some station health data for the chart
  const healthData = React.useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: i,
      uptime: p.status === 'Active' ? 95 + Math.random() * 5 : 40 + Math.random() * 20
    }));
  }, [p.status]);

  return (
    <AnimatePresence>
      {station && (
        <motion.div
          initial={{ opacity: 0, x: -50, y: 50 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -50, y: 50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="sidebar-left glass-panel"
          style={{
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {p.type === 'ATC' ? <Wifi color="#00c3ff" size={20} /> : <Radio color="#ffcc33" size={20} />}
                <h3 style={{ margin: 0, fontSize: '18px', color: p.type === 'ATC' ? '#00c3ff' : '#ffcc33' }}>
                  {p.road_section || 'Traffic Station'}
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#8e92a4', marginTop: '4px', display: 'block' }}>ID: {p.site_id || 'N/A'}</span>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#8e92a4', cursor: 'pointer' }}>
              <motion.div whileHover={{ scale: 1.1, color: '#fff' }}><CheckCircle2 size={20} /></motion.div>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#8e92a4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Battery size={12} /> Type
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
                {p.type === 'ATC' ? 'Automatic Station' : 'Manual Station'}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#8e92a4', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> Status
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px', color: p.status === 'Active' ? '#00ea90' : '#ff3366' }}>
                {p.status || 'Unknown'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#8e92a4', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> 24h Telemetry Health
            </div>
            <div style={{ height: '80px', width: '100%' }}>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={healthData} margin={{ left: 0, right: 0, top: 5, bottom: 0 }}>
                  <XAxis dataKey="hour" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ background: '#000', border: 'none', fontSize: '11px', borderRadius: '4px' }}
                  />
                  <Area isAnimationActive={false} type="monotone" dataKey="uptime" stroke={p.type === 'ATC' ? '#00c3ff' : '#ffcc33'} fill={p.type === 'ATC' ? 'rgba(0,195,255,0.2)' : 'rgba(255,204,51,0.2)'} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </motion.div>
      )}
    </AnimatePresence>
  );
}
