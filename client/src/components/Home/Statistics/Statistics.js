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
  // Animiraj progress bar prema display, ne prema value!
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

  // Proseci
  const avgDomTime = domTimes.length ? domTimes.reduce((a, b) => a + b, 0) / domTimes.length : 0;
  const avgDomCpu = domCpus.length ? domCpus.reduce((a, b) => a + b, 0) / domCpus.length : 0;
  const avgDomMem = domMems.length ? domMems.reduce((a, b) => a + b, 0) / domMems.length : 0;

  const avgHashTime = hashTimes.length ? hashTimes.reduce((a, b) => a + b, 0) / hashTimes.length : 0;
  const avgHashCpu = hashCpus.length ? hashCpus.reduce((a, b) => a + b, 0) / hashCpus.length : 0;
  const avgHashMem = hashMems.length ? hashMems.reduce((a, b) => a + b, 0) / hashMems.length : 0;

  // Maksimalne vrednosti za vizualni scale (prilagodi po potrebi)
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
        </>
      )}
    </div>
  );
}

export default Statistics;