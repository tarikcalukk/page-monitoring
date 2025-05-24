import React, { useEffect, useState } from "react";
import "./Statistics.css";

// Animated stat card
function AnimatedStatCard({ label, value, unit, color, max }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    setDisplay(0);
    let start = 0;
    const end = Number(value);
    if (start === end) return;
    let increment = end / 30;
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        current = end;
        clearInterval(timer);
      }
      setDisplay(current);
    }, 16);
    return () => clearInterval(timer);
  }, [value, max]);
  const percent = Math.min(100, (display / max) * 100);
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {display.toFixed(2)} <span className="stat-unit">{unit}</span>
      </div>
      <div className="stat-bar-bg">
        <div className="stat-bar" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

// Helper for generic line chart rendering
function LineChart({ data, color, title, yLabel, height = 220, width = 520 }) {
  const maxY = Math.max(...data, 1);
  const points = data.map((v, i) => ({
    x: 60 + (i / Math.max(data.length - 1, 1)) * (width - 80),
    y: height - 40 - (v / maxY) * (height - 60),
    value: v,
    index: i,
  }));

  return (
    <div className="chart-block" style={{ minWidth: width }}>
      <div className="chart-title">{title}</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="xy-plot">
        {/* Y-axis */}
        <line x1="60" y1="20" x2="60" y2={height - 40} stroke="#bbb" strokeWidth="1" />
        {/* X-axis */}
        <line x1="60" y1={height - 40} x2={width - 20} y2={height - 40} stroke="#bbb" strokeWidth="1" />
        {/* Y-labels */}
        {[0, 0.5, 1].map((p, i) => {
          const yVal = Math.round((1 - p) * maxY);
          return (
            <text key={i} x="15" y={30 + p * (height - 60)} fontSize="13" fill="#888">{yVal}</text>
          );
        })}
        {/* X-labels */}
        {data.map((_, i) => (
          <text
            key={i}
            x={60 + (i / Math.max(data.length - 1, 1)) * (width - 80)}
            y={height - 20}
            fontSize="12"
            fill="#888"
            textAnchor="middle"
          >
            {i + 1}
          </text>
        ))}
        {/* Line */}
        {points.map((pt, i, arr) =>
          i > 0 ? (
            <line
              key={i}
              x1={arr[i - 1].x}
              y1={arr[i - 1].y}
              x2={pt.x}
              y2={pt.y}
              stroke={color}
              strokeWidth="2"
            />
          ) : null
        )}
        {/* Points + value labels */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="4" fill={color} />
            {/* Y value above point */}
            <text
              x={pt.x}
              y={pt.y - 10}
              fontSize="12"
              fill="#222"
              textAnchor="middle"
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {pt.value.toFixed(0)}
            </text>
            {/* X value below point (index+1) */}
            {/* (X-labels are already shown below, so this is optional) */}
          </g>
        ))}
        {/* Y axis label */}
        <text x="10" y="15" fontSize="13" fill="#888" fontWeight="bold">{yLabel}</text>
      </svg>
    </div>
  );
}

function Statistics() {
  const [domStats, setDomStats] = useState([]);
  const [hashStats, setHashStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/statistics");
      const data = await res.json();
      setDomStats((data && Array.isArray(data.dom)) ? data.dom : []);
      setHashStats((data && Array.isArray(data.hash)) ? data.hash : []);
      setLoading(false);
    }
    fetchStats();
  }, []);

  // Priprema podataka za prikaz
  const domTimes = domStats.map(e => e.timeMs || e.lastTimeMs || 0);
  const domCpus = domStats.map(e => e.cpu || e.lastCpu || 0);
  const domMems = domStats.map(e => e.memoryMb || e.lastMemoryMb || 0);

  const hashTimes = hashStats.map(e => e.timeMs || e.lastTimeMs || 0);
  const hashCpus = hashStats.map(e => e.cpu || e.lastCpu || 0);
  const hashMems = hashStats.map(e => e.memoryMb || e.lastMemoryMb || 0);

  // Prosjeci
  const avgDomTime = domTimes.length ? domTimes.reduce((a, b) => a + b, 0) / domTimes.length : 0;
  const avgDomCpu = domCpus.length ? domCpus.reduce((a, b) => a + b, 0) / domCpus.length : 0;
  const avgDomMem = domMems.length ? domMems.reduce((a, b) => a + b, 0) / domMems.length : 0;

  const avgHashTime = hashTimes.length ? hashTimes.reduce((a, b) => a + b, 0) / hashTimes.length : 0;
  const avgHashCpu = hashCpus.length ? hashCpus.reduce((a, b) => a + b, 0) / hashCpus.length : 0;
  const avgHashMem = hashMems.length ? hashMems.reduce((a, b) => a + b, 0) / hashMems.length : 0;

  // Maksimalne vrijednosti za vizualni scale
  const maxTime = Math.max(
    Math.max(...domTimes, 0),
    Math.max(...hashTimes, 0),
    1
  ) * 1.1;
  const maxCpu = Math.max(
    Math.max(...domCpus, 0),
    Math.max(...hashCpus, 0),
    1
  ) * 1.1;
  const maxMem = Math.max(
    Math.max(...domMems, 0),
    Math.max(...hashMems, 0),
    1
  ) * 1.1;

  return (
    <div className="statistics-container">
      <h2 className="statistics-title">📊 STATISTICS</h2>
      {loading ? (
        <div className="empty-message">Loading statistics...</div>
      ) : (
        <>
          <div className="stat-cards-row">
            <div className="stat-cards-block">
              <h3 className="stat-block-title">DOM</h3>
              <AnimatedStatCard label="Avg. Time" value={avgDomTime} unit="ms" color="#3498db" max={maxTime} />
              <AnimatedStatCard label="Avg. CPU" value={avgDomCpu} unit="%" color="#27ae60" max={maxCpu} />
              <AnimatedStatCard label="Avg. Memory" value={avgDomMem} unit="MB" color="#e67e22" max={maxMem} />
            </div>
            <div className="stat-cards-block">
              <h3 className="stat-block-title">HASH</h3>
              <AnimatedStatCard label="Avg. Time" value={avgHashTime} unit="ms" color="#3498db" max={maxTime} />
              <AnimatedStatCard label="Avg. CPU" value={avgHashCpu} unit="%" color="#27ae60" max={maxCpu} />
              <AnimatedStatCard label="Avg. Memory" value={avgHashMem} unit="MB" color="#e67e22" max={maxMem} />
            </div>
          </div>

          <div className="charts-grid">
            <div className="charts-col">
              <LineChart
                data={domTimes}
                color="#3498db"
                title="DOM Time (ms)"
                yLabel="ms"
              />
              <LineChart
                data={domCpus}
                color="#27ae60"
                title="DOM CPU (%)"
                yLabel="%"
              />
              <LineChart
                data={domMems}
                color="#e67e22"
                title="DOM Memory (MB)"
                yLabel="MB"
              />
            </div>
            <div className="charts-col">
              <LineChart
                data={hashTimes}
                color="#e67e22"
                title="HASH Time (ms)"
                yLabel="ms"
              />
              <LineChart
                data={hashCpus}
                color="#8e44ad"
                title="HASH CPU (%)"
                yLabel="%"
              />
              <LineChart
                data={hashMems}
                color="#2980b9"
                title="HASH Memory (MB)"
                yLabel="MB"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Statistics;