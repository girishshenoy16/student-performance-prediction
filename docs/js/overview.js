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

/* ── Data-labels plugin: renders value text above vertical bars ── */
const datalabelsPlugin = {
  id: "datalabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        if (value == null) return;
        const fmtCtx = { chart, dataIndex: index, dataset, datasetIndex: dsIndex };
        const label = dataset.datalabels && dataset.datalabels.formatter
          ? dataset.datalabels.formatter(value, fmtCtx)
          : typeof value === "number" ? value.toLocaleString() : value;
        const color = (dataset.datalabels && dataset.datalabels.color) || "#172033";
        const font = (dataset.datalabels && dataset.datalabels.font) || { size: 11, weight: "bold" };
        const lines = String(label).split("\n");
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `${font.weight} ${font.size}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const lineHeight = font.size + 2;
        const startY = element.y - 4 - (lines.length - 1) * lineHeight;
        lines.forEach((line, li) => {
          ctx.fillText(line, element.x, startY + li * lineHeight);
        });
        ctx.restore();
      });
    });
  }
};

/* ── Horizontal datalabels plugin: renders value text after horizontal bars ── */
const hbarDatalabelsPlugin = {
  id: "hbarDatalabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, dsIndex) => {
      const meta = chart.getDatasetMeta(dsIndex);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        if (value == null) return;
        const fmtCtx = { chart, dataIndex: index, dataset, datasetIndex: dsIndex };
        const label = dataset.datalabels && dataset.datalabels.formatter
          ? dataset.datalabels.formatter(value, fmtCtx)
          : typeof value === "number" ? value.toLocaleString() : value;
        const color = (dataset.datalabels && dataset.datalabels.color) || "#172033";
        const font = (dataset.datalabels && dataset.datalabels.font) || { size: 11, weight: "bold" };
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `${font.weight} ${font.size}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(label, element.x + 6, element.y);
        ctx.restore();
      });
    });
  }
};

function renderDistributionChart(data) {
  const ctx = document.getElementById("chart-distribution").getContext("2d");
  const bins = data.exam_score_distribution.bins;
  const counts = data.exam_score_distribution.counts;
  const labels = [];
  for (let i = 0; i < bins.length - 1; i++) {
    labels.push(`${bins[i]}\u2013${bins[i + 1] - 1}`);
  }

  const barColors = ["#DC2626", "#D97706", "#2563EB", "#0D9488", "#4F46E5", "#818CF8", "#A78BFA", "#C4B5FD", "#DDD6FE"];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Students",
        data: counts,
        backgroundColor: barColors.slice(0, counts.length),
        borderColor: "white",
        borderWidth: 0.5,
        borderRadius: 4,
        barPercentage: 0.7,
        datalabels: {
          formatter: (v) => v.toLocaleString(),
          color: "#172033",
          font: { size: 11, weight: "bold" }
        }
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
          title: { display: true, text: "Score Range", color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 } },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: "Number of Students", color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 }, callback: (v) => v.toLocaleString() },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
      },
    },
    plugins: [datalabelsPlugin],
  });
}

function renderCategoriesChart(data) {
  const ctx = document.getElementById("chart-categories").getContext("2d");
  const cats = data.performance_categories;
  const pcts = data.performance_category_percentages || {};
  const labels = Object.keys(cats);
  const values = Object.values(cats);
  const colors = ["#DC2626", "#D97706", "#2563EB", "#0D9488"];

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
        datalabels: {
          formatter: (v, ctx) => {
            const pct = pcts[ctx.chart.data.labels[ctx.dataIndex]] || ((v / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            return `${v.toLocaleString()} (${pct}%)`;
          },
          color: "#172033",
          font: { size: 11, weight: "bold" },
          anchor: (ctx) => ctx.dataset.data[ctx.dataIndex] < 500 ? "end" : "center",
          align: (ctx) => ctx.dataset.data[ctx.dataIndex] < 500 ? "end" : "center",
          offset: (ctx) => ctx.dataset.data[ctx.dataIndex] < 500 ? 4 : 0
        }
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
          title: { display: true, text: "Number of Students", color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 }, callback: (v) => v.toLocaleString() },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
        y: {
          ticks: { color: "#526174", font: { size: 12, weight: 600 } },
          grid: { display: false },
        },
      },
    },
    plugins: [hbarDatalabelsPlugin],
  });
}

function renderScatterChart(canvasId, dataObj, xLabel, yLabel, trendLabel, trendColor) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  const x = dataObj.x;
  const y = dataObj.y;

  // Compute linear regression for trend line
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  let xMin = x[0], xMax = x[0];
  for (let i = 1; i < n; i++) {
    if (x[i] < xMin) xMin = x[i];
    if (x[i] > xMax) xMax = x[i];
  }

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Students",
          data: x.map((xi, idx) => ({ x: xi, y: y[idx] })),
          backgroundColor: trendColor === "#DC2626"
            ? "rgba(37, 99, 235, 0.15)"
            : "rgba(13, 148, 136, 0.15)",
          borderColor: "transparent",
          pointRadius: 3,
          pointHoverRadius: 5,
          showLine: false,
        },
        {
          label: trendLabel,
          data: [
            { x: xMin, y: slope * xMin + intercept },
            { x: xMax, y: slope * xMax + intercept }
          ],
          borderColor: "#DC2626",
          borderWidth: 2,
          borderDash: [6, 3],
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
          showLine: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: trendLabel.includes("0.581") ? "top-left" : "top-right",
          labels: { color: "#526174", font: { size: 12 }, usePointStyle: true, boxWidth: 0 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === 1) return null;
              return `${xLabel}: ${ctx.parsed.x}, ${yLabel}: ${ctx.parsed.y}`;
            }
          },
          filter: (item) => item.datasetIndex === 0
        }
      },
      scales: {
        x: {
          title: { display: true, text: xLabel, color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
        },
        y: {
          title: { display: true, text: yLabel, color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 } },
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

  // Multi-color gradient: TEAL for #1, BLUE for #2-4, INDIGO for #5+
  const barColors = sorted.map((_, i) => {
    if (i === 0) return "#0D9488";
    if (i < 4) return "#2563EB";
    return "#4F46E5";
  });

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Relative Importance (%)",
        data: values,
        backgroundColor: barColors,
        borderRadius: 4,
        datalabels: {
          formatter: (v) => v.toFixed(1) + "%",
          color: "#172033",
          font: { size: 11, weight: "bold" }
        }
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
          title: { display: true, text: "Relative Importance (%)", color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 }, callback: (v) => v + "%" },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
          max: 25,
        },
        y: {
          ticks: { color: "#526174", font: { size: 12 } },
          grid: { display: false },
        },
      },
    },
    plugins: [hbarDatalabelsPlugin],
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

function renderModelComparisonChart(data) {
  const ctx = document.getElementById("chart-model-comparison").getContext("2d");
  const benchmark = data.model_benchmark;
  const winning = data.winning_model;
  const models = benchmark.map(b => b.model_display);
  const r2 = benchmark.map(b => b.R2);
  const mae = benchmark.map(b => b.MAE);

  const barColors = benchmark.map(b => b.model === winning ? "#0D9488" : "#94A3B8");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: models,
      datasets: [
        {
          label: "R\u00b2",
          data: r2,
          backgroundColor: barColors,
          borderColor: "white",
          borderWidth: 0.5,
          borderRadius: 6,
          barPercentage: 0.6,
          categoryPercentage: 0.8,
          datalabels: {
            anchor: "end",
            align: "end",
            formatter: (v, ctx) => {
              const maeVal = mae[ctx.dataIndex];
              return `R\u00b2 = ${v.toFixed(4)}\nMAE = ${maeVal.toFixed(4)}`;
            },
            color: "#172033",
            font: { size: 11, weight: "bold" },
            textAlign: "center"
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const b = benchmark[ctx.dataIndex];
              return [`R\u00b2: ${b.R2.toFixed(4)}`, `MAE: ${b.MAE.toFixed(4)}`, `RMSE: ${b.RMSE.toFixed(4)}`];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#526174", font: { size: 12 } },
          grid: { display: false },
        },
        y: {
          title: { display: true, text: "R\u00b2 (Test Set)", color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
          min: 0,
          max: 0.85,
        },
      },
    },
    plugins: [datalabelsPlugin],
  });
}

function renderTopSignalsChart(data) {
  const ctx = document.getElementById("chart-top-signals").getContext("2d");
  const importance = data.feature_importance;
  const sorted = Object.entries(importance)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 8);
  const labels = sorted.map(([k]) => k.replace(/_/g, " "));
  const values = sorted.map(([, v]) => Math.abs(v));

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Absolute Coefficient Weight",
        data: values,
        backgroundColor: "#0D9488",
        borderRadius: 4,
        datalabels: {
          formatter: (v) => v.toFixed(3),
          color: "#172033",
          font: { size: 11, weight: "bold" }
        }
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
            label: (ctx) => `${ctx.parsed.x.toFixed(3)} absolute weight`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Absolute Coefficient Weight", color: "#526174", font: { size: 13 } },
          ticks: { color: "#526174", font: { size: 12 } },
          grid: { color: "rgba(217, 226, 240, 0.6)" },
          suggestedMax: 4.5,
        },
        y: {
          ticks: { color: "#526174", font: { size: 12 } },
          grid: { display: false },
        },
      },
    },
    plugins: [hbarDatalabelsPlugin],
  });
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
    try { renderScatterChart("chart-study-score", data.study_hours_vs_score, "Hours Studied per Week", "Exam Score", "Trend (r = +0.445)", "#DC2626"); } catch(e) { console.error("Study-score scatter error:", e); }
    try { renderScatterChart("chart-attendance-score", data.attendance_vs_score, "Attendance (%)", "Exam Score", "Trend (r = +0.581)", "#0D9488"); } catch(e) { console.error("Attendance-score scatter error:", e); }
    try { renderImportanceChart(data); } catch(e) { console.error("Importance chart error:", e); }
    try { renderModelComparisonChart(data); } catch(e) { console.error("Model comparison chart error:", e); }
    try { renderTopSignalsChart(data); } catch(e) { console.error("Top signals chart error:", e); }
    try { renderBenchmarkTable(data); } catch(e) { console.error("Benchmark table error:", e); }
    try { renderInsights(data); } catch(e) { console.error("Insights error:", e); }
  } catch (err) {
    console.error("Failed to initialize overview:", err);
  }
}
