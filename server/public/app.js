const SENSOR_COLORS = { 1: "#34d0c4" };
const REFRESH_MS = 5000;
let activeHours = 24;
let charts = {};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const formatDateTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
  });
};

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
};

const setConnection = (online) => {
  const pill = document.getElementById("connectionPill");
  const text = document.getElementById("connectionText");
  pill.classList.toggle("online", online);
  pill.classList.toggle("offline", !online);
  text.textContent = online ? "ONLINE" : "NO DATA";
};

const renderLiveCards = (latest) => {
  const container = document.getElementById("liveCards");
  if (!latest.length) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = latest
    .sort((a, b) => a.sensorId - b.sensorId)
    .map((reading) => {
      const accent = SENSOR_COLORS[reading.sensorId] || "#34d0c4";
      const detected = reading.gasDetected;
      return `
        <div class="sensor-card ${detected ? "alert" : ""}" style="--accent:${accent}">
          <div class="card-top">
            <span class="card-label">SENSOR ${reading.sensorId}</span>
            <span class="card-badge ${detected ? "detected" : "clear"}">${detected ? "GAS DETECTED" : "CLEAR"}</span>
          </div>
          <div>
            <span class="ppm-value">${reading.ppm.toFixed(1)}</span>
            <span class="ppm-unit">ppm</span>
          </div>
          <div class="metric-grid">
            <div class="metric"><span class="m-key">Rs / Ro</span><span class="m-val">${reading.resistanceRatio.toFixed(3)}</span></div>
            <div class="metric"><span class="m-key">Rs kΩ</span><span class="m-val">${reading.resistance.toFixed(2)}</span></div>
            <div class="metric"><span class="m-key">VOLTAGE</span><span class="m-val">${reading.sensorVoltage.toFixed(3)}</span></div>
          </div>
        </div>`;
    })
    .join("");
};

const buildChart = (canvasId, label) => {
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: { color: "#6b7888", font: { family: "IBM Plex Mono", size: 10 }, boxWidth: 12 }
        },
        tooltip: {
          backgroundColor: "#161c27",
          borderColor: "#1f2733",
          borderWidth: 1,
          titleColor: "#d7e0ea",
          bodyColor: "#d7e0ea",
          titleFont: { family: "IBM Plex Mono", size: 11 },
          bodyFont: { family: "IBM Plex Mono", size: 11 }
        }
      },
      scales: {
        x: {
          ticks: { color: "#44505f", font: { family: "IBM Plex Mono", size: 9 }, maxTicksLimit: 8 },
          grid: { color: "#19202b" }
        },
        y: {
          ticks: { color: "#44505f", font: { family: "IBM Plex Mono", size: 9 } },
          grid: { color: "#19202b" }
        }
      }
    }
  });
};

const groupBySensor = (readings) => {
  const groups = {};
  readings.forEach((reading) => {
    if (!groups[reading.sensorId]) {
      groups[reading.sensorId] = [];
    }
    groups[reading.sensorId].push(reading);
  });
  return groups;
};

const buildLabels = (groups) => {
  let longest = [];
  Object.values(groups).forEach((list) => {
    if (list.length > longest.length) {
      longest = list;
    }
  });
  return longest.map((reading) => formatTime(reading.sensorTimestamp));
};

const updateChart = (chart, groups, field) => {
  const labels = buildLabels(groups);
  const datasets = Object.keys(groups)
    .sort()
    .map((sensorId) => {
      const color = SENSOR_COLORS[sensorId] || "#34d0c4";
      return {
        label: `SENSOR ${sensorId}`,
        data: groups[sensorId].map((reading) => reading[field]),
        borderColor: color,
        backgroundColor: color + "22",
        borderWidth: 1.6,
        pointRadius: 0,
        tension: 0.25,
        fill: false
      };
    });
  chart.data.labels = labels;
  chart.data.datasets = datasets;
  chart.update("none");
};

const renderEvents = (events) => {
  const tbody = document.querySelector("#eventsTable tbody");
  document.getElementById("eventCount").textContent = `${events.length} registered`;
  if (!events.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">NO DETECTION EVENTS IN RANGE</td></tr>`;
    return;
  }
  tbody.innerHTML = events
    .map((event) => {
      const color = SENSOR_COLORS[event.sensorId] || "#34d0c4";
      return `
        <tr>
          <td>${formatDateTime(event.sensorTimestamp)}</td>
          <td><span class="tag" style="color:${color}">SENSOR ${event.sensorId}</span></td>
          <td>${event.ppm.toFixed(1)}</td>
          <td>${event.resistanceRatio.toFixed(3)}</td>
          <td>${event.sensorVoltage.toFixed(3)} V</td>
        </tr>`;
    })
    .join("");
};

const refreshLive = async () => {
  try {
    const latest = await fetchJson("/api/readings/latest");
    renderLiveCards(latest);
    setConnection(latest.length > 0);
    document.getElementById("lastUpdate").textContent = new Date().toLocaleTimeString("es-MX");
  } catch (error) {
    setConnection(false);
  }
};

const refreshHistory = async () => {
  try {
    const since = new Date(Date.now() - activeHours * 60 * 60 * 1000).toISOString();
    const readings = await fetchJson(`/api/readings?from=${since}&limit=5000`);
    const groups = groupBySensor(readings);
    updateChart(charts.ppm, groups, "ppm");
    updateChart(charts.voltage, groups, "sensorVoltage");
    updateChart(charts.ratio, groups, "resistanceRatio");

    const events = await fetchJson(`/api/events?limit=200`);
    const sinceMs = Date.now() - activeHours * 60 * 60 * 1000;
    renderEvents(events.filter((event) => new Date(event.sensorTimestamp).getTime() >= sinceMs));
  } catch (error) {
    setConnection(false);
  }
};

const bindRangeButtons = () => {
  document.getElementById("rangeGroup").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
      return;
    }
    document.querySelectorAll("#rangeGroup button").forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    activeHours = parseInt(button.dataset.hours, 10);
    refreshHistory();
  });
};

const init = () => {
  charts.ppm = buildChart("ppmChart", "PPM");
  charts.voltage = buildChart("voltageChart", "Voltage");
  charts.ratio = buildChart("ratioChart", "Ratio");
  bindRangeButtons();
  refreshLive();
  refreshHistory();
  setInterval(refreshLive, REFRESH_MS);
  setInterval(refreshHistory, REFRESH_MS * 3);
};

init();
