import { useEffect, useMemo, useState } from "react";
import "./Statistics.css";
import { apiService } from "../../../services/apiService";
import { getFriendlyErrorMessage } from "../../../utils/errors";

function average(values) {
  const safeValues = values.filter((value) => Number.isFinite(value));
  if (!safeValues.length) return 0;
  return safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length;
}

function metricValues(entries, key, fallbackKey) {
  return entries.map((entry) => Number(entry[key] ?? entry[fallbackKey] ?? 0));
}

function AnimatedStatCard({ label, value, unit, color, max }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
    const end = Number(value || 0);
    if (!end) return undefined;

    let current = 0;
    const increment = end / 30;
    const timer = window.setInterval(() => {
      current = Math.min(end, current + increment);
      setDisplay(current);
      if (current >= end) window.clearInterval(timer);
    }, 16);

    return () => window.clearInterval(timer);
  }, [value]);

  const percent = Math.min(100, (display / Math.max(max, 1)) * 100);

  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {display.toFixed(2)} <span className="stat-unit">{unit}</span>
      </div>
      <div className="stat-bar-bg">
        <div
          className="stat-bar"
          style={{ width: `${percent}%`, background: color }}
        />
      </div>
    </div>
  );
}

function LineChart({ data, color, title, yLabel, height = 220, width = 520 }) {
  const maxY = Math.max(...data, 1);
  const points = data.map((value, index) => ({
    x: 60 + (index / Math.max(data.length - 1, 1)) * (width - 80),
    y: height - 40 - (value / maxY) * (height - 60),
    value,
  }));

  return (
    <div className="chart-block" style={{ minWidth: width }}>
      <div className="chart-title">{title}</div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="xy-plot"
        role="img"
        aria-label={`${title} chart`}
      >
        <line x1="60" y1="20" x2="60" y2={height - 40} stroke="#bbb" />
        <line
          x1="60"
          y1={height - 40}
          x2={width - 20}
          y2={height - 40}
          stroke="#bbb"
        />
        {[0, 0.5, 1].map((point) => {
          const yVal = (1 - point) * maxY;
          return (
            <text
              key={point}
              x="15"
              y={30 + point * (height - 60)}
              fontSize="13"
              fill="#888"
            >
              {yVal.toFixed(2)}
            </text>
          );
        })}
        {points.map((point, index, items) =>
          index > 0 ? (
            <line
              key={`${title}-line-${index}`}
              x1={items[index - 1].x}
              y1={items[index - 1].y}
              x2={point.x}
              y2={point.y}
              stroke={color}
              strokeWidth="2"
            />
          ) : null,
        )}
        {points.map((point, index) => (
          <g key={`${title}-point-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill={color} />
            <text
              x={point.x}
              y={point.y - 10}
              fontSize="12"
              fill="#222"
              textAnchor="middle"
            >
              {point.value.toFixed(2)}
            </text>
          </g>
        ))}
        <text x="10" y="15" fontSize="13" fill="#888" fontWeight="bold">
          {yLabel}
        </text>
      </svg>
    </div>
  );
}

function UptimeCard({ urls }) {
  const total = urls.length;
  const active = urls.filter((url) => url.active).length;
  const inactive = total - active;
  const uptime = total ? ((active / total) * 100).toFixed(2) : "0.00";
  const downtime = total ? ((inactive / total) * 100).toFixed(2) : "0.00";

  return (
    <div className="stat-card uptime-card">
      <div className="stat-label">Aktivno</div>
      <div className="stat-value" style={{ color: "#27ae60" }}>
        {uptime}%
      </div>
      <div className="stat-label">Pauzirano</div>
      <div className="stat-value" style={{ color: "#e74c3c" }}>
        {downtime}%
      </div>
    </div>
  );
}

function TopStats({ urls }) {
  const mostChanged = [...urls]
    .filter((url) => url.changes?.total)
    .sort((a, b) => b.changes.total - a.changes.total)
    .slice(0, 3);

  return (
    <div className="top-stats">
      <h4>TOP 3 STRANICE SA NAJVIŠE PROMJENA</h4>
      {mostChanged.length ? (
        <ol>
          {mostChanged.map((url) => (
            <li key={url.url}>
              {url.url} - {url.changes.total} promjena
            </li>
          ))}
        </ol>
      ) : (
        <p>Još nema zabilježenih promjena.</p>
      )}
    </div>
  );
}

function MiniLineChart({ data, color }) {
  if (!data.length) return <div>Nema podataka</div>;

  const max = Math.max(...data, 1);
  const width = 180;
  const height = 40;

  return (
    <svg width={width} height={height} role="img" aria-label="Mini trend chart">
      {data.map((value, index, items) =>
        index > 0 ? (
          <line
            key={`mini-${index}`}
            x1={(index - 1) * (width / (items.length - 1))}
            y1={height - (items[index - 1] / max) * (height - 10)}
            x2={index * (width / (items.length - 1))}
            y2={height - (value / max) * (height - 10)}
            stroke={color}
            strokeWidth="2"
          />
        ) : null,
      )}
    </svg>
  );
}

function getBiggestJump(items, key = "timeMs") {
  let maxJump = 0;
  let from = null;
  let to = null;

  for (let index = 1; index < items.length; index += 1) {
    const jump = Math.abs((items[index][key] || 0) - (items[index - 1][key] || 0));
    if (jump > maxJump) {
      maxJump = jump;
      from = items[index - 1][key] || 0;
      to = items[index][key] || 0;
    }
  }

  return { maxJump, from, to };
}

function UrlStatsBlock({ url }) {
  const domHistory = url.methods?.DOM?.history || [];
  const hashHistory = url.methods?.HASH?.history || [];
  const lastChange = domHistory.slice(-1)[0] || {};
  const domJump = getBiggestJump(domHistory);
  const hashJump = getBiggestJump(hashHistory);
  const times = domHistory
    .map((entry) => new Date(entry.time).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const avgBetween =
    times.length > 1
      ? `${(
          times.slice(1).reduce((sum, time, index) => sum + (time - times[index]), 0) /
          (times.length - 1) /
          1000
        ).toFixed(1)}s`
      : "-";
  const averageElements = average(domHistory.map((entry) => entry.elementCount || 0));
  const maxDepth = Math.max(...domHistory.map((entry) => entry.maxDepth || 0), 0);
  const averageAttributes = average(
    domHistory.map((entry) => entry.attributeCount || 0),
  );

  function downloadCsv() {
    const csv = [
      "time,timeMs,cpu,memoryMb,elementCount,maxDepth,attributeCount",
      ...domHistory.map((entry) =>
        [
          entry.time,
          entry.timeMs,
          entry.cpu,
          entry.memoryMb,
          entry.elementCount,
          entry.maxDepth,
          entry.attributeCount,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${url.url.replace(/[^a-z0-9]/gi, "_")}_dom_history.csv`;
    anchor.rel = "noopener noreferrer";
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  return (
    <div className="url-stats-block">
      <h3 className="url-title">{url.url}</h3>
      <div className="perf-trends">
        <h4>Trend performansi (DOM)</h4>
        <MiniLineChart data={domHistory.map((entry) => entry.timeMs || 0)} color="#3498db" />
        <div>
          Najveći skok: {domJump.maxJump} ms ({domJump.from} do {domJump.to})
        </div>
        <h4>Trend performansi (HASH)</h4>
        <MiniLineChart data={hashHistory.map((entry) => entry.timeMs || 0)} color="#e67e22" />
        <div>
          Najveći skok: {hashJump.maxJump} ms ({hashJump.from} do {hashJump.to})
        </div>
      </div>

      <div className="content-changes">
        <div>
          Ukupno promjena: <b>{url.changes?.total || 0}</b>
        </div>
        <div>
          Zadnja promjena:{" "}
          <b>{lastChange.time ? new Date(lastChange.time).toLocaleString() : "-"}</b>
        </div>
        <div>
          Zadnja metoda: <b>{url.changes?.lastDetectedMethod || "-"}</b>
        </div>
      </div>

      <div className="stability-stats">
        <div>
          Uspješne provjere: <b>{domHistory.length}</b>
        </div>
        <div>
          Prosječno vrijeme između promjena: <b>{avgBetween}</b>
        </div>
      </div>

      <div className="structure-stats">
        <div>
          Prosjek DOM elemenata: <b>{averageElements.toFixed(1)}</b>
        </div>
        <div>
          Maksimalna DOM dubina: <b>{maxDepth}</b>
        </div>
        <div>
          Prosjek atributa: <b>{averageAttributes.toFixed(1)}</b>
        </div>
      </div>

      <div className="advanced-analysis">
        <div>
          Maksimalno vrijeme obrade:{" "}
          <b>{Math.max(...domHistory.map((entry) => entry.timeMs || 0), 0)} ms</b>
        </div>
      </div>

      <button type="button" className="export-csv-btn" onClick={downloadCsv}>
        Izvezi CSV
      </button>
    </div>
  );
}

function Statistics() {
  const [domStats, setDomStats] = useState([]);
  const [hashStats, setHashStats] = useState([]);
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchStats() {
      setLoading(true);
      setError("");
      try {
        const data = await apiService.getStatistics();
        if (!active) return;
        setDomStats(Array.isArray(data?.dom) ? data.dom : []);
        setHashStats(Array.isArray(data?.hash) ? data.hash : []);
        setUrls(Array.isArray(data?.urls) ? data.urls : []);
      } catch (fetchError) {
        if (!active) return;
        setDomStats([]);
        setHashStats([]);
        setUrls([]);
        setError(getFriendlyErrorMessage(fetchError));
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchStats();
    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const domTimes = metricValues(domStats, "timeMs", "lastTimeMs");
    const domCpus = metricValues(domStats, "cpu", "lastCpu");
    const domMems = metricValues(domStats, "memoryMb", "lastMemoryMb");
    const hashTimes = metricValues(hashStats, "timeMs", "lastTimeMs");
    const hashCpus = metricValues(hashStats, "cpu", "lastCpu");
    const hashMems = metricValues(hashStats, "memoryMb", "lastMemoryMb");

    return {
      domTimes,
      domCpus,
      domMems,
      hashTimes,
      hashCpus,
      hashMems,
      avgDomTime: average(domTimes),
      avgDomCpu: average(domCpus),
      avgDomMem: average(domMems),
      avgHashTime: average(hashTimes),
      avgHashCpu: average(hashCpus),
      avgHashMem: average(hashMems),
      maxTime: Math.max(...domTimes, ...hashTimes, 1) * 1.1,
      maxCpu: Math.max(...domCpus, ...hashCpus, 1) * 1.1,
      maxMem: Math.max(...domMems, ...hashMems, 1) * 1.1,
    };
  }, [domStats, hashStats]);

  return (
    <div className="statistics-container">
      <h2 className="statistics-title">STATISTIKA</h2>
      {loading ? (
        <div className="empty-message">Učitavanje statistike...</div>
      ) : error ? (
        <div className="empty-message error" role="alert">
          {error}
        </div>
      ) : (
        <>
          <div className="stat-cards-row">
            <div className="stat-cards-block">
              <h3 className="stat-block-title">DOM</h3>
              <AnimatedStatCard
                label="Prosj. vrijeme"
                value={metrics.avgDomTime}
                unit="ms"
                color="#3498db"
                max={metrics.maxTime}
              />
              <AnimatedStatCard
                label="Prosj. CPU"
                value={metrics.avgDomCpu}
                unit="%"
                color="#27ae60"
                max={metrics.maxCpu}
              />
              <AnimatedStatCard
                label="Prosj. memorija"
                value={metrics.avgDomMem}
                unit="MB"
                color="#e67e22"
                max={metrics.maxMem}
              />
            </div>
            <div className="stat-cards-block">
              <h3 className="stat-block-title">HASH</h3>
              <AnimatedStatCard
                label="Prosj. vrijeme"
                value={metrics.avgHashTime}
                unit="ms"
                color="#3498db"
                max={metrics.maxTime}
              />
              <AnimatedStatCard
                label="Prosj. CPU"
                value={metrics.avgHashCpu}
                unit="%"
                color="#27ae60"
                max={metrics.maxCpu}
              />
              <AnimatedStatCard
                label="Prosj. memorija"
                value={metrics.avgHashMem}
                unit="MB"
                color="#e67e22"
                max={metrics.maxMem}
              />
            </div>
          </div>

          <div className="charts-grid">
            <div className="charts-col">
              <LineChart
                data={metrics.domTimes}
                color="#3498db"
                title="DOM Time (ms)"
                yLabel="ms"
              />
              <LineChart
                data={metrics.domCpus}
                color="#27ae60"
                title="DOM CPU (%)"
                yLabel="%"
              />
              <LineChart
                data={metrics.domMems}
                color="#e67e22"
                title="DOM Memory (MB)"
                yLabel="MB"
              />
            </div>
            <div className="charts-col">
              <LineChart
                data={metrics.hashTimes}
                color="#e67e22"
                title="HASH Time (ms)"
                yLabel="ms"
              />
              <LineChart
                data={metrics.hashCpus}
                color="#8e44ad"
                title="HASH CPU (%)"
                yLabel="%"
              />
              <LineChart
                data={metrics.hashMems}
                color="#2980b9"
                title="HASH Memory (MB)"
                yLabel="MB"
              />
            </div>
          </div>

          <UptimeCard urls={urls} />
          <TopStats urls={urls} />
          {urls.map((url) => (
            <UrlStatsBlock key={url.url} url={url} />
          ))}
        </>
      )}
    </div>
  );
}

export default Statistics;
