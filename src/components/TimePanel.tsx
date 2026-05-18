import React, { useState, useRef, useEffect } from 'react';
import { formatFractionalYearToDate } from '../constants';
import { Calendar, Activity, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WEEKDAYS = ['M','T','W','T','F','S','S'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0=Sun,1=Mon...  We want Monday=0
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function dateToFractionalYear(year: number, month: number, day: number) {
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  const target = new Date(year, month, day).getTime();
  return year + (target - start) / (end - start);
}

function fractionalYearToDate(fy: number) {
  const year = Math.floor(fy);
  const frac = fy - year;
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return new Date(start + frac * (end - start));
}

export default function TimePanel({ currentYear, setCurrentYear, isLiveMode, setIsLiveMode }: any) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  const currentDate = fractionalYearToDate(currentYear);
  const [calYear, setCalYear] = useState(currentDate.getFullYear());
  const [calMonth, setCalMonth] = useState(currentDate.getMonth());

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCalendar]);

  // Sync calendar view when currentYear changes externally
  useEffect(() => {
    const d = fractionalYearToDate(currentYear);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  }, [currentYear]);

  const handleDateClick = (day: number) => {
    const fy = dateToFractionalYear(calYear, calMonth, day);
    if (fy >= 2016 && fy <= 2035) {
      setCurrentYear(fy);
    }
    setShowCalendar(false);
  };

  const handleMonthClick = (monthIdx: number) => {
    setCalMonth(monthIdx);
  };

  const navigateYear = (dir: number) => {
    const newYear = calYear + dir;
    if (newYear >= 2016 && newYear <= 2035) {
      setCalYear(newYear);
    }
  };

  const today = new Date();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const selectedDate = fractionalYearToDate(currentYear);

  // Build day cells including padding
  const dayCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) dayCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) dayCells.push(d);

  const isToday = (day: number) =>
    calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();

  const isSelected = (day: number) =>
    calYear === selectedDate.getFullYear() && calMonth === selectedDate.getMonth() && day === selectedDate.getDate();

  const yearRange = Array.from({ length: 20 }, (_, i) => 2016 + i);

  return (
    <div style={{ position: 'relative' }}>
      {/* Main slider panel */}
      <div className="glass-panel" style={{
        width: '520px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderRadius: '24px',
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 195, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#8e92a4', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <Calendar size={16} color="#00c3ff" />
            Timeline Projection
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(0,195,255,0.5)' }}>
              {formatFractionalYearToDate(currentYear)}
            </span>
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              style={{
                background: showCalendar ? 'rgba(0,195,255,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showCalendar ? '#00c3ff' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '6px 8px',
                cursor: 'pointer',
                color: showCalendar ? '#00c3ff' : '#8e92a4',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              <Calendar size={14} />
            </button>
          </div>
        </div>

        <input
          type="range"
          min="2016"
          max="2035"
          step={1/12}
          value={currentYear}
          onChange={(e) => { if (isLiveMode) setIsLiveMode(false); setCurrentYear(parseFloat(e.target.value)); }}
          style={{
            width: '100%',
            accentColor: '#00c3ff',
            cursor: 'pointer',
            height: '6px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            outline: 'none',
            WebkitAppearance: 'none'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8e92a4', fontWeight: 'bold' }}>
          <span>2016 (Historic Baseline)</span>
          {isLiveMode ? (
            <span style={{ color: '#00ea90', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ea90', boxShadow: '0 0 8px #00ea90', animation: 'pulse 1.5s infinite' }} />
              LIVE — {new Date().toLocaleTimeString()}
            </span>
          ) : (
            <button onClick={() => setIsLiveMode(true)} style={{ background: 'rgba(0,234,144,0.15)', border: '1px solid #00ea90', color: '#00ea90', padding: '3px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Activity size={12} /> Go Live
            </button>
          )}
          <span>2035 (Max Projection)</span>
        </div>
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div
          ref={calRef}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: 0,
            width: '520px',
            background: 'rgba(8, 12, 22, 0.96)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(0, 195, 255, 0.25)',
            borderRadius: '16px',
            boxShadow: '0 16px 64px rgba(0,0,0,0.7), 0 0 30px rgba(0,195,255,0.1)',
            display: 'flex',
            overflow: 'hidden',
            zIndex: 2000,
            animation: 'calSlideUp 0.25s ease-out'
          }}
        >
          <style>{`
            @keyframes calSlideUp {
              from { opacity: 0; transform: translateY(12px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Left: Month list */}
          <div style={{
            width: '140px',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            padding: '16px 0'
          }}>
            {/* Year nav */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0 12px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '8px'
            }}>
              <button onClick={() => navigateYear(-1)} style={{ background: 'none', border: 'none', color: calYear <= 2016 ? '#333' : '#00c3ff', cursor: calYear <= 2016 ? 'default' : 'pointer', padding: '4px' }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '22px', fontWeight: '300', color: '#00c3ff', letterSpacing: '2px', fontFamily: 'monospace' }}>
                {calYear}
              </span>
              <button onClick={() => navigateYear(1)} style={{ background: 'none', border: 'none', color: calYear >= 2035 ? '#333' : '#00c3ff', cursor: calYear >= 2035 ? 'default' : 'pointer', padding: '4px' }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Month list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
              {MONTHS.map((m, i) => {
                const isActive = i === calMonth;
                const isCurrent = calYear === today.getFullYear() && i === today.getMonth();
                return (
                  <button
                    key={m}
                    onClick={() => handleMonthClick(i)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: isActive ? 'rgba(0,195,255,0.1)' : 'transparent',
                      border: 'none',
                      color: isActive ? '#00c3ff' : (isCurrent ? '#4db6ac' : '#8e92a4'),
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: isActive ? '800' : '600',
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      transition: 'all 0.15s',
                      borderLeft: isActive ? '3px solid #00c3ff' : '3px solid transparent'
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Calendar grid */}
          <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#4db6ac', textTransform: 'uppercase', letterSpacing: '3px' }}>
                  {MONTHS[calMonth]}
                </div>
                <div style={{ fontSize: '11px', color: '#8e92a4', letterSpacing: '2px', fontFamily: 'monospace' }}>
                  {calYear}
                </div>
              </div>
              <button
                onClick={() => setShowCalendar(false)}
                style={{ background: 'none', border: 'none', color: '#8e92a4', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
              {WEEKDAYS.map((wd, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: '#8e92a4', fontWeight: '600', letterSpacing: '1px', padding: '4px 0' }}>
                  {wd}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', flex: 1 }}>
              {dayCells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;

                const todayMatch = isToday(day);
                const selectedMatch = isSelected(day);
                const isWeekend = ((firstDay + day - 1) % 7) >= 5;

                // Color intensity based on position in month (visual rhythm)
                const intensity = 0.08 + (day / daysInMonth) * 0.15;

                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: selectedMatch
                        ? '2px solid #8e92a4'
                        : todayMatch
                          ? '2px solid #4db6ac'
                          : 'none',
                      background: selectedMatch
                        ? 'rgba(142,146,164,0.15)'
                        : isWeekend
                          ? `rgba(0,195,255,${intensity + 0.05})`
                          : `rgba(77,182,172,${intensity})`,
                      color: selectedMatch ? '#fff' : (todayMatch ? '#4db6ac' : '#c0c4d0'),
                      fontSize: '13px',
                      fontWeight: todayMatch || selectedMatch ? '700' : '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                      boxShadow: selectedMatch ? '0 0 12px rgba(142,146,164,0.3)' : 'none',
                      margin: '0 auto'
                    }}
                    onMouseOver={(e) => {
                      if (!selectedMatch) e.currentTarget.style.background = 'rgba(0,195,255,0.3)';
                    }}
                    onMouseOut={(e) => {
                      if (!selectedMatch) {
                        e.currentTarget.style.background = isWeekend
                          ? `rgba(0,195,255,${intensity + 0.05})`
                          : `rgba(77,182,172,${intensity})`;
                      }
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Today shortcut */}
            {calYear === today.getFullYear() && calMonth === today.getMonth() && (
              <div
                style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#8e92a4', cursor: 'pointer', transition: 'color 0.2s' }}
                onClick={() => handleDateClick(today.getDate())}
                onMouseOver={(e) => (e.currentTarget.style.color = '#4db6ac')}
                onMouseOut={(e) => (e.currentTarget.style.color = '#8e92a4')}
              >
                Today
              </div>
            )}

            {/* Year dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {yearRange.map(yr => (
                <div
                  key={yr}
                  onClick={() => setCalYear(yr)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: yr === calYear ? '#00c3ff' : (yr === today.getFullYear() ? '#4db6ac' : 'rgba(255,255,255,0.15)'),
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: yr === calYear ? '0 0 8px rgba(0,195,255,0.5)' : 'none'
                  }}
                  title={String(yr)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
