let overviewData = null;

async function loadOverviewData() {
  if (overviewData) return overviewData;
  try {
    const response = await fetch("./overview_data.json");
    if (!response.ok) throw new Error("Failed to load overview data");
    overviewData = await response.json();
    return overviewData;
  } catch (err) {
    console.error("Error loading overview data:", err);
    throw err;
  }
}

function renderKPIs(data) {
  const kpi = data.kpis;
  document.getElementById("kpi-total").textContent = kpi.total_students.toLocaleString();
  document.getElementById("kpi-avg-score").textContent = kpi.avg_exam_score.toFixed(1);
  document.getElementById("kpi-avg-hours").textContent = kpi.avg_study_hours.toFixed(1);
  document.getElementById("kpi-avg-attendance").textContent = kpi.avg_attendance.toFixed(1) + "%";
}

function renderDistributionChart(data) {
  const ctx = document.getElementById("chart-distribution").getContext("2d");
  const bins = data.exam_score_distribution.bins;
  const counts = data.exam_score_distribution.counts;
  const labels = [];
  for (let i = 0; i < bins.length - 1; i++) {
    labels.push(`${bins[i]}–${bins[i + 1] - 1}`);
  }

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Students",
        data: counts,
        backgroundColor: "#4F46E5",
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toLocaleString()} students`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#526174", font: { size: 13 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
        y: {
          ticks: { color: "#526174", font: { size: 13 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
      },
    },
  });
}

function renderCategoriesChart(data) {
  const ctx = document.getElementById("chart-categories").getContext("2d");
  const cats = data.performance_categories;
  const pcts = data.performance_category_percentages || {};
  const labels = Object.keys(cats);
  const values = Object.values(cats);
  const colors = ["#DC2626", "#D97706", "#2563EB", "#059669"];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Students",
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.x;
              const pct = pcts[ctx.label] || ((val / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
              return `${val.toLocaleString()} students (${pct}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#526174", font: { size: 13 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
        y: {
          ticks: { color: "#526174", font: { size: 13, weight: 500 } },
          grid: { display: false },
        },
      },
    },
  });
}

function renderScatterChart(canvasId, dataObj, xLabel, yLabel) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const x = dataObj.x;
  const y = dataObj.y;
  const sampleSize = Math.min(500, x.length);
  const step = Math.max(1, Math.floor(x.length / sampleSize));
  const sampledX = [];
  const sampledY = [];
  for (let i = 0; i < x.length; i += step) {
    sampledX.push(x[i]);
    sampledY.push(y[i]);
  }

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [{
        label: "Students",
        data: sampledX.map((xi, idx) => ({ x: xi, y: sampledY[idx] })),
        backgroundColor: "rgba(37, 99, 235, 0.3)",
        borderColor: "rgba(37, 99, 235, 0.7)",
        pointRadius: 2.5,
        pointHoverRadius: 5,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${xLabel}: ${ctx.parsed.x}, ${yLabel}: ${ctx.parsed.y}`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: xLabel, color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 13 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
        y: {
          title: { display: true, text: yLabel, color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 13 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
      },
    },
  });
}

function renderImportanceChart(data) {
  const ctx = document.getElementById("chart-importance").getContext("2d");
  const importance = data.normalized_importance || data.feature_importance;
  const sorted = Object.entries(importance).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const labels = sorted.map(([k]) => k.replace(/_/g, " "));
  const values = sorted.map(([, v]) => v);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Relative Importance (%)",
        data: values,
        backgroundColor: "#0D9488",
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.x.toFixed(1)}% relative importance`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Relative Model Importance (%)", color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 13 }, callback: (v) => v + "%" },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
          max: Math.ceil(Math.max(...values) / 10) * 10 + 5,
        },
        y: {
          ticks: { color: "#526174", font: { size: 13 } },
          grid: { display: false },
        },
      },
    },
  });
}

function renderBenchmarkTable(data) {
  const tbody = document.querySelector("#benchmark-table tbody");
  const benchmark = data.model_benchmark;
  const winning = data.winning_model;

  tbody.innerHTML = "";
  for (const row of benchmark) {
    const tr = document.createElement("tr");
    if (row.model === winning) tr.classList.add("winner-row");

    tr.innerHTML = `
      <td>${row.model_display}</td>
      <td>${row.MAE.toFixed(4)}</td>
      <td>${row.RMSE.toFixed(4)}</td>
      <td>${row.R2.toFixed(4)}</td>
      <td>${row.model === winning ? '<span class="status-winner">Winner</span>' : ""}</td>
    `;
    tbody.appendChild(tr);
  }

  const infoDiv = document.getElementById("model-selection-info");
  infoDiv.innerHTML = `
    <div class="selection-info">
      <strong>Selected Model:</strong> ${data.winning_model_display}<br>
      <strong>Selection Basis:</strong> ${data.selection_reason}
    </div>
  `;
}

function renderInsights(data) {
  const container = document.getElementById("insights-list");
  container.innerHTML = "";

  const insights = data.insights || [];
  const insightMeta = [
    { icon: "&#128200;", accent: "blue" },
    { icon: "&#128200;", accent: "teal" },
    { icon: "&#128200;", accent: "indigo" },
    { icon: "&#128202;", accent: "amber" },
    { icon: "&#127942;", accent: "teal" },
    { icon: "&#127919;", accent: "indigo" }
  ];

  for (let i = 0; i < insights.length; i++) {
    const insight = insights[i];
    const meta = insightMeta[i] || { icon: "&#128161;", accent: "blue" };
    const text = insight.text || "";

    let title = "";
    let value = "";
    let description = "Observed relationship";

    if (insight.type === "relationship") {
      const match = text.match(/^(\w[\w\s]+?)\s+shows\s+a\s+.*?correlation\s*\(([\d.]+)\)/i);
      if (match) {
        title = match[1].trim();
        value = "+" + match[2];
      } else {
        title = text.split(" ")[0] + " " + text.split(" ")[1];
        value = "--";
      }
      description = "Observed correlation with Exam Score";
    } else if (insight.type === "distribution") {
      const match = text.match(/'(\w+)' with ([\d,]+) students \(([\d.]+)%\)/i);
      if (match) {
        title = "Largest Segment";
        value = match[1];
        description = `${parseInt(match[2]).toLocaleString()} students (${match[3]}%)`;
      }
    } else if (insight.type === "model") {
      const match = text.match(/^(.+?) achieved.*R\u00b2 = ([\d.]+)/i);
      if (match) {
        title = "Best Model";
        value = match[1];
        description = `R\u00b2 = ${match[2]}`;
      }
    } else if (insight.type === "signal") {
      const match = text.match(/'(.+?)' is the strongest/i);
      if (match) {
        title = "Strongest Signal";
        value = match[1];
        description = "Strongest model-derived predictive signal";
      }
    }

    if (!title) continue;

    const div = document.createElement("div");
    div.className = `insight-card insight-card-${meta.accent}`;
    div.innerHTML = `
      <div class="insight-card-header">
        <span class="insight-card-icon">${meta.icon}</span>
        <span class="insight-card-title">${title}</span>
      </div>
      <div class="insight-card-value">${value}</div>
      <div class="insight-card-desc">${description}</div>
    `;
    container.appendChild(div);
  }
}

async function initOverview() {
  try {
    const data = await loadOverviewData();
    try { renderKPIs(data); } catch(e) { console.error("KPI error:", e); }
    try { renderDistributionChart(data); } catch(e) { console.error("Distribution chart error:", e); }
    try { renderCategoriesChart(data); } catch(e) { console.error("Categories chart error:", e); }
    try { renderScatterChart("chart-study-score", data.study_hours_vs_score, "Hours Studied", "Exam Score"); } catch(e) { console.error("Study-score scatter error:", e); }
    try { renderScatterChart("chart-attendance-score", data.attendance_vs_score, "Attendance (%)", "Exam Score"); } catch(e) { console.error("Attendance-score scatter error:", e); }
    try { renderImportanceChart(data); } catch(e) { console.error("Importance chart error:", e); }
    try { renderBenchmarkTable(data); } catch(e) { console.error("Benchmark table error:", e); }
    try { renderInsights(data); } catch(e) { console.error("Insights error:", e); }
  } catch (err) {
    console.error("Failed to initialize overview:", err);
  }
}
