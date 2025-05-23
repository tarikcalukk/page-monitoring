import React, { useState, useEffect } from "react";
import "./Statistics.css";

function Statistics() {
  const [statistics, setStatistics] = useState([]);
  const userToken = localStorage.getItem("token");

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/statistics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch statistics");

        const data = await response.json();
        setStatistics(data.statistics);
      } catch (err) {
        console.error("Error fetching statistics:", err);
      }
    };

    fetchStatistics();
  }, [userToken]);

  return (
    <div className="statistics-container">
      <h2>Statistics</h2>
      {statistics.length === 0 ? (
        <p>No statistics available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>HASH Changes</th>
              <th>DOM Changes</th>
            </tr>
          </thead>
          <tbody>
            {statistics.map((stat, index) => (
              <tr key={index}>
                <td>{stat.url}</td>
                <td>{stat.hashChanges}</td>
                <td>{stat.domChanges}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Statistics;