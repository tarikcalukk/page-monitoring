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
          const yVal = ((1 - p) * maxY);
          return (
            <text key={i} x="15" y={30 + p * (height - 60)} fontSize="13" fill="#888">
              {yVal.toFixed(2)}
            </text>
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
              {pt.value.toFixed(2)}
            </text>
          </g>
        ))}
        {/* Y axis label */}
        <text x="10" y="15" fontSize="13" fill="#888" fontWeight="bold">{yLabel}</text>
      </svg>
    </div>
  );
}

// UptimeCard
function UptimeCard({ urls }) {
  let urlList = Array.isArray(urls) ? urls : [];
  if (urlList.length === 1 && Array.isArray(urlList[0]?.urls)) {
    urlList = urlList[0].urls;
  }
  const total = urlList.length;
  const up = urlList.filter(u => u && u.active).length;
  const down = total - up;
  const uptime = total ? ((up / total) * 100).toFixed(2) : 0;
  const downtime = total ? ((down / total) * 100).toFixed(2) : 0;
  return (
    <div className="stat-card uptime-card">
      <div className="stat-label">Uptime</div>
      <div className="stat-value" style={{ color: "#27ae60" }}>{uptime}%</div>
      <div className="stat-label">Downtime</div>
      <div className="stat-value" style={{ color: "#e74c3c" }}>{downtime}%</div>
    </div>
  );
}

// TopStats - prikazuje top 3 najsporije, najčešće mijenjane i najzahtjevnije stranice
function TopStats({ urls }) {

  // Najčešće mijenjane
  const mostChanged = [...urls]
    .filter(u => u.changes?.total)
    .sort((a, b) => b.changes.total - a.changes.total)
    .slice(0, 3);

  return (
    <div className="top-stats">
      <h4>TOP 3 MOST FREQUENTLY CHANGED PAGES</h4>
      <ol>
        {mostChanged.map((u, i) => (
          <li key={i}>{u.url} - {u.changes.total} promjena</li>
        ))}
      </ol>
    </div>
  );
}

// Trend performansi kroz vrijeme + najveći skok/pad
function PerformanceTrends({ url }) {
  const domHistory = url.methods?.DOM?.history || [];
  const hashHistory = url.methods?.HASH?.history || [];

  function getBiggestJump(arr, key = "timeMs") {
    let maxJump = 0, from = null, to = null;
    for (let i = 1; i < arr.length; i++) {
      const jump = Math.abs(arr[i][key] - arr[i - 1][key]);
      if (jump > maxJump) {
        maxJump = jump;
        from = arr[i - 1][key];
        to = arr[i][key];
      }
    }
    return { maxJump, from, to };
  }

  const domJump = getBiggestJump(domHistory, "timeMs");
  const hashJump = getBiggestJump(hashHistory, "timeMs");

  return (
    <div className="perf-trends">
      <h4>Performance Trend (DOM)</h4>
      <MiniLineChart data={domHistory.map(h => h.timeMs)} color="#3498db" label="DOM timeMs" />
      <div>Biggest jump: {domJump.maxJump} ms ({domJump.from} → {domJump.to})</div>
      <h4>Performance Trend (HASH)</h4>
      <MiniLineChart data={hashHistory.map(h => h.timeMs)} color="#e67e22" label="HASH timeMs" />
      <div>Biggest jump: {hashJump.maxJump} ms ({hashJump.from} → {hashJump.to})</div>
    </div>
  );
}

function MiniLineChart({ data, color, label }) {
  if (!data.length) return <div>No data</div>;
  const max = Math.max(...data, 1);
  const width = 180, height = 40;
  return (
    <svg width={width} height={height}>
      {data.map((v, i, arr) =>
        i > 0 ? (
          <line
            key={i}
            x1={(i - 1) * (width / (arr.length - 1))}
            y1={height - (arr[i - 1] / max) * (height - 10)}
            x2={i * (width / (arr.length - 1))}
            y2={height - (v / max) * (height - 10)}
            stroke={color}
            strokeWidth="2"
          />
        ) : null
      )}
    </svg>
  );
}

function ContentChanges({ url }) {
  const lastChange = url.methods?.DOM?.history?.slice(-1)[0] || {};
  return (
    <div className="content-changes">
      <div>Total changes: <b>{url.changes?.total || 0}</b></div>
      <div>Last change: <b>{lastChange.time ? new Date(lastChange.time).toLocaleString() : "-"}</b></div>
      <div>Last method: <b>{url.changes?.lastDetectedMethod || "-"}</b></div>
    </div>
  );
}

function StabilityStats({ url }) {
  const domHistory = url.methods?.DOM?.history || [];
  const totalChecks = domHistory.length;
  let avgBetween = "-";
  if (domHistory.length > 1) {
    const times = domHistory.map(h => new Date(h.time).getTime()).sort();
    let sum = 0;
    for (let i = 1; i < times.length; i++) sum += (times[i] - times[i - 1]);
    avgBetween = (sum / (times.length - 1) / 1000).toFixed(1) + "s";
  }
  return (
    <div className="stability-stats">
      <div>Successful checks: <b>{totalChecks}</b></div>
      <div>Average time between changes: <b>{avgBetween}</b></div>
    </div>
  );
}

// 4. Strukturalna kompleksnost
function StructureStats({ url }) {
  const domHistory = url.methods?.DOM?.history || [];
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const avgElem = avg(domHistory.map(h => h.elementCount || 0));
  const maxDepth = Math.max(...domHistory.map(h => h.maxDepth || 0), 0);
  const avgAttr = avg(domHistory.map(h => h.attributeCount || 0));
  return (
    <div className="structure-stats">
      <div>Average number of DOM elements: <b>{avgElem.toFixed(1)}</b></div>
      <div>Maximum DOM depth: <b>{maxDepth}</b></div>
      <div>Average number of attributes: <b>{avgAttr.toFixed(1)}</b></div>
    </div>
  );
}

function AdvancedAnalysis({ url }) {
  const domHistory = url.methods?.DOM?.history || [];
  const timeMsArr = domHistory.map(h => h.timeMs || 0);
  const maxTime = Math.max(...timeMsArr, 0);
  return (
    <div className="advanced-analysis">
      <div>Max load time: <b>{maxTime} ms</b></div>
    </div>
  );
}

// 10. Export/Download (CSV)
function ExportCSV({ url }) {
  function download() {
    const domHistory = url.methods?.DOM?.history || [];
    const csv = [
      "time,timeMs,cpu,memoryMb,elementCount,maxDepth,attributeCount",
      ...domHistory.map(h =>
        [h.time, h.timeMs, h.cpu, h.memoryMb, h.elementCount, h.maxDepth, h.attributeCount].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${url.url.replace(/[^a-z0-9]/gi, "_")}_dom_history.csv`;
    a.click();
  }
  return <button className="export-csv-btn" onClick={download}>Export CSV</button>;
}


function Statistics() {
  const [domStats, setDomStats] = useState([]);
  const [hashStats, setHashStats] = useState([]);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/statistics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      const data = await res.json();
      setDomStats(Array.isArray(data.dom) ? data.dom : []);
      setHashStats(Array.isArray(data.hash) ? data.hash : []);
      setLoading(false);
    }
    async function fetchUrls() {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/get-urls`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const data = await res.json();
        setUrls(Array.isArray(data) ? data : []);
      } catch (e) {
        setUrls([]);
      }
    }
    fetchStats();
    fetchUrls();
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
          <UptimeCard urls={urls} />
          <TopStats urls={urls} />
          {urls.map((url, index) => (
            <div key={index} className="url-stats-block">
              <h3 className="url-title">{url.url}</h3>
              <PerformanceTrends url={url} />
              <ContentChanges url={url} />
              <StabilityStats url={url} />
              <StructureStats url={url} />
              <AdvancedAnalysis url={url} />
              <ExportCSV url={url} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default Statistics;