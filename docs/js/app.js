document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  initTabs();
  initLiveSimulation();
  initCSVHandler();

  await loadArtifacts();
  await initOverview();
  updateLiveModelInfo();
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab, tabs, panels));
    tab.addEventListener("keydown", (e) => {
      const tabList = Array.from(tabs);
      const idx = tabList.indexOf(tab);

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = tabList[(idx + 1) % tabList.length];
        next.focus();
        switchTab(next, tabs, panels);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = tabList[(idx - 1 + tabList.length) % tabList.length];
        prev.focus();
        switchTab(prev, tabs, panels);
      }
    });
  });
}

function switchTab(selectedTab, tabs, panels) {
  tabs.forEach((tab) => {
    tab.classList.remove("active");
    tab.setAttribute("aria-selected", "false");
    tab.setAttribute("tabindex", "-1");
  });

  panels.forEach((panel) => {
    panel.classList.remove("active");
    panel.hidden = true;
  });

  selectedTab.classList.add("active");
  selectedTab.setAttribute("aria-selected", "true");
  selectedTab.setAttribute("tabindex", "0");

  const panelId = selectedTab.getAttribute("aria-controls");
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.add("active");
    panel.hidden = false;
  }
}

const SCENARIOS = {
  high_performer: {
    Hours_Studied: 30,
    Attendance: 95,
    Previous_Scores: 88,
    Sleep_Hours: 8,
    Tutoring_Sessions: 3,
    Physical_Activity: 4,
    Parental_Involvement: "High",
    Access_to_Resources: "High",
    Extracurricular_Activities: "Yes",
    Motivation_Level: "High",
    Internet_Access: "Yes",
    Family_Income: "High",
    Teacher_Quality: "High",
    School_Type: "Private",
    Peer_Influence: "Positive",
    Learning_Disabilities: "No",
    Parental_Education_Level: "Postgraduate",
    Distance_from_Home: "Near",
    Gender: "Female"
  },
  average_performer: {
    Hours_Studied: 20,
    Attendance: 80,
    Previous_Scores: 75,
    Sleep_Hours: 7,
    Tutoring_Sessions: 1,
    Physical_Activity: 3,
    Parental_Involvement: "Medium",
    Access_to_Resources: "Medium",
    Extracurricular_Activities: "No",
    Motivation_Level: "Medium",
    Internet_Access: "Yes",
    Family_Income: "Medium",
    Teacher_Quality: "Medium",
    School_Type: "Public",
    Peer_Influence: "Neutral",
    Learning_Disabilities: "No",
    Parental_Education_Level: "College",
    Distance_from_Home: "Moderate",
    Gender: "Male"
  },
  at_risk: {
    Hours_Studied: 8,
    Attendance: 65,
    Previous_Scores: 58,
    Sleep_Hours: 5,
    Tutoring_Sessions: 0,
    Physical_Activity: 1,
    Parental_Involvement: "Low",
    Access_to_Resources: "Low",
    Extracurricular_Activities: "No",
    Motivation_Level: "Low",
    Internet_Access: "No",
    Family_Income: "Low",
    Teacher_Quality: "Low",
    School_Type: "Public",
    Peer_Influence: "Negative",
    Learning_Disabilities: "Yes",
    Parental_Education_Level: "High School",
    Distance_from_Home: "Far",
    Gender: "Male"
  },
  strong_attendance_low_study: {
    Hours_Studied: 10,
    Attendance: 95,
    Previous_Scores: 70,
    Sleep_Hours: 7,
    Tutoring_Sessions: 2,
    Physical_Activity: 4,
    Parental_Involvement: "High",
    Access_to_Resources: "Medium",
    Extracurricular_Activities: "Yes",
    Motivation_Level: "Medium",
    Internet_Access: "Yes",
    Family_Income: "Medium",
    Teacher_Quality: "Medium",
    School_Type: "Public",
    Peer_Influence: "Positive",
    Learning_Disabilities: "No",
    Parental_Education_Level: "College",
    Distance_from_Home: "Near",
    Gender: "Female"
  },
  high_study_low_attendance: {
    Hours_Studied: 35,
    Attendance: 65,
    Previous_Scores: 80,
    Sleep_Hours: 6,
    Tutoring_Sessions: 1,
    Physical_Activity: 2,
    Parental_Involvement: "Medium",
    Access_to_Resources: "Medium",
    Extracurricular_Activities: "No",
    Motivation_Level: "High",
    Internet_Access: "Yes",
    Family_Income: "Medium",
    Teacher_Quality: "Medium",
    School_Type: "Public",
    Peer_Influence: "Neutral",
    Learning_Disabilities: "No",
    Parental_Education_Level: "College",
    Distance_from_Home: "Moderate",
    Gender: "Male"
  }
};

function initLiveSimulation() {
  const form = document.getElementById("prediction-form");
  const formFields = document.getElementById("form-fields");
  const resultCard = document.getElementById("result-card");

  const fieldGroups = [
    {
      label: "Academic Profile",
      fields: [
        { name: "Hours_Studied", label: "Hours Studied", type: "number", min: 0, max: 50, step: 1, placeholder: "e.g. 20" },
        { name: "Attendance", label: "Attendance (%)", type: "number", min: 0, max: 100, step: 1, placeholder: "e.g. 85" },
        { name: "Previous_Scores", label: "Previous Scores", type: "number", min: 0, max: 100, step: 1, placeholder: "e.g. 75" },
      ]
    },
    {
      label: "Study & Well-being",
      fields: [
        { name: "Sleep_Hours", label: "Sleep Hours", type: "number", min: 0, max: 24, step: 1, placeholder: "e.g. 7" },
        { name: "Tutoring_Sessions", label: "Tutoring Sessions", type: "number", min: 0, max: 20, step: 1, placeholder: "e.g. 2" },
        { name: "Physical_Activity", label: "Physical Activity (hrs/week)", type: "number", min: 0, max: 20, step: 1, placeholder: "e.g. 3" },
      ]
    },
    {
      label: "Support & Resources",
      fields: [
        { name: "Parental_Involvement", label: "Parental Involvement", type: "select", options: ["Low", "Medium", "High"] },
        { name: "Access_to_Resources", label: "Access to Resources", type: "select", options: ["Low", "Medium", "High"] },
        { name: "Parental_Education_Level", label: "Parental Education Level", type: "select", options: ["High School", "College", "Postgraduate"] },
        { name: "Family_Income", label: "Family Income", type: "select", options: ["Low", "Medium", "High"] },
      ]
    },
    {
      label: "Learning Environment",
      fields: [
        { name: "Teacher_Quality", label: "Teacher Quality", type: "select", options: ["Low", "Medium", "High"] },
        { name: "Peer_Influence", label: "Peer Influence", type: "select", options: ["Negative", "Neutral", "Positive"] },
        { name: "School_Type", label: "School Type", type: "select", options: ["Private", "Public"] },
        { name: "Internet_Access", label: "Internet Access", type: "select", options: ["No", "Yes"] },
        { name: "Extracurricular_Activities", label: "Extracurricular Activities", type: "select", options: ["No", "Yes"] },
        { name: "Motivation_Level", label: "Motivation Level", type: "select", options: ["Low", "Medium", "High"] },
        { name: "Learning_Disabilities", label: "Learning Disabilities", type: "select", options: ["No", "Yes"] },
        { name: "Distance_from_Home", label: "Distance from Home", type: "select", options: ["Near", "Moderate", "Far"] },
        { name: "Gender", label: "Gender", type: "select", options: ["Female", "Male"] },
      ]
    }
  ];

  const allFields = fieldGroups.flatMap(g => g.fields);

  for (const group of fieldGroups) {
    const section = document.createElement("div");
    section.className = "form-section";

    const header = document.createElement("div");
    header.className = "form-section-header";
    header.textContent = group.label;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "form-section-grid";

    for (const field of group.fields) {
      const groupEl = document.createElement("div");
      groupEl.className = "form-group";

      const label = document.createElement("label");
      label.setAttribute("for", `field-${field.name}`);
      label.textContent = field.label;
      groupEl.appendChild(label);

      if (field.type === "select") {
        const select = document.createElement("select");
        select.id = `field-${field.name}`;
        select.name = field.name;
        select.required = true;

        const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "Select...";
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        select.appendChild(defaultOpt);

        for (const opt of field.options) {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        }
        groupEl.appendChild(select);
      } else {
        const input = document.createElement("input");
        input.id = `field-${field.name}`;
        input.name = field.name;
        input.type = field.type;
        input.min = field.min;
        input.max = field.max;
        input.step = field.step;
        input.placeholder = field.placeholder;
        input.required = true;
        groupEl.appendChild(input);
      }

      const error = document.createElement("span");
      error.className = "field-error";
      error.id = `error-${field.name}`;
      groupEl.appendChild(error);

      grid.appendChild(groupEl);
    }

    section.appendChild(grid);
    formFields.appendChild(section);
  }

  document.querySelectorAll(".btn-scenario").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.scenario;
      const scenario = SCENARIOS[key];
      if (!scenario) return;
      clearErrors();
      document.querySelectorAll(".btn-scenario").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      for (const [name, value] of Object.entries(scenario)) {
        const el = document.getElementById(`field-${name}`);
        if (el) el.value = value;
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors();

    let isValid = true;
    for (const field of allFields) {
      const el = document.getElementById(`field-${field.name}`);
      const errorEl = document.getElementById(`error-${field.name}`);
      const val = el.value.trim();

      if (!val) {
        errorEl.textContent = "Required";
        el.classList.add("input-error");
        isValid = false;
      } else if (field.type === "number") {
        const num = parseFloat(val);
        if (isNaN(num) || num < field.min || num > field.max) {
          errorEl.textContent = `Must be ${field.min}-${field.max}`;
          el.classList.add("input-error");
          isValid = false;
        }
      }
    }

    if (!isValid) return;
    runPrediction();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    resultCard.hidden = true;
    clearErrors();
    document.querySelectorAll(".btn-scenario").forEach(b => b.classList.remove("active"));
    const helper = document.getElementById("re-predict-helper");
    if (helper) helper.hidden = true;
    const recList = document.getElementById("recommendations-list");
    if (recList) recList.innerHTML = "";
  });
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
}

function runPrediction() {
  const form = document.getElementById("prediction-form");
  const formData = new FormData(form);
  const input = {};
  const predictBtn = document.getElementById("predict-btn");

  for (const [key, value] of formData.entries()) {
    input[key] = value;
  }

  predictBtn.disabled = true;
  predictBtn.textContent = "Predicting...";

  try {
    const result = predict(input);

    document.getElementById("result-score").textContent = result.score.toFixed(1);

    const categoryDiv = document.getElementById("result-category");
    const catClass = `category-${result.category.toLowerCase().replace(/\s+/g, "-")}`;
    categoryDiv.innerHTML = `<span class="category-badge ${catClass}">${result.category}</span>`;

    const verdict = document.getElementById("result-verdict");
    const rangeMap = {
      "At Risk": "below 60",
      "Average": "60–74",
      "Good": "75–84",
      "Excellent": "85 or above"
    };
    verdict.textContent = `Expected performance: ${result.category}. This profile is currently estimated within the ${rangeMap[result.category]} score range.`;

    document.querySelectorAll(".range-segment").forEach(seg => {
      seg.classList.remove("active");
      if (seg.dataset.category === result.category.toLowerCase().replace(/\s+/g, "-")) {
        seg.classList.add("active");
      }
    });

    renderQuickAssessment(input);
    renderTopSignals(result.topSignals);
    renderRecommendations(input, result);

    document.getElementById("result-card").hidden = false;
    document.getElementById("re-predict-helper").hidden = false;
  } catch (err) {
    console.error("Prediction error:", err);
    const resultCard = document.getElementById("result-card");
    document.getElementById("result-score").textContent = "--";
    document.getElementById("result-category").innerHTML = `<span class="category-badge category-error">Error</span>`;
    document.getElementById("result-verdict").textContent = err.message;
    document.getElementById("assessment-list").innerHTML = "";
    resultCard.hidden = false;
  } finally {
    predictBtn.disabled = false;
    predictBtn.textContent = "Predict Exam Score";
  }
}

function renderQuickAssessment(input) {
  const container = document.getElementById("assessment-list");
  container.innerHTML = "";

  const overviewAvgs = overviewData?.kpis || {};
  const datasetAvgs = {
    Attendance: Math.round((overviewAvgs.avg_attendance || 80) * 10) / 10,
    Hours_Studied: Math.round((overviewAvgs.avg_study_hours || 20) * 10) / 10,
    Previous_Scores: Math.round((overviewAvgs.avg_exam_score || 67) * 10) / 10
  };

  const units = {
    Attendance: "%",
    Hours_Studied: " hrs",
    Previous_Scores: ""
  };

  const diffUnits = {
    Attendance: "pts",
    Hours_Studied: "hrs",
    Previous_Scores: "pts"
  };

  const labels = {
    Attendance: "Attendance",
    Hours_Studied: "Hours Studied",
    Previous_Scores: "Previous Score"
  };

  const keys = ["Attendance", "Hours_Studied", "Previous_Scores"];

  for (const key of keys) {
    const val = Math.round((parseFloat(input[key]) || 0) * 10) / 10;
    const avg = datasetAvgs[key];
    const diff = Math.round((val - avg) * 10) / 10;
    const absDiff = Math.abs(diff);
    const status = diff > 0 ? "above" : diff < 0 ? "below" : "at";
    const statusClass = diff > 0 ? "assessment-above" : diff < 0 ? "assessment-below" : "assessment-at";
    const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";

    const div = document.createElement("div");
    div.className = "assessment-item";
    div.innerHTML = `
      <div class="assessment-main">
        <span class="assessment-label">${labels[key]}</span>
        <span class="assessment-value">${val.toFixed(1)}${units[key]}</span>
      </div>
      <div class="assessment-compare ${statusClass}">
        ${arrow} ${absDiff.toFixed(1)} ${diffUnits[key]} ${status} dataset avg (${avg.toFixed(1)}${units[key]})
      </div>
    `;
    container.appendChild(div);
  }
}

function renderTopSignals(signals) {
  const canvas = document.getElementById("top-signals-canvas");
  if (!canvas || !signals || signals.length === 0) return;

  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const rowHeight = 30;
  const labelWidth = 150;
  const valueWidth = 50;
  const barGap = 10;
  const paddingTop = 4;
  const paddingBottom = 4;
  const chartHeight = paddingTop + signals.length * (rowHeight + barGap) - barGap + paddingBottom;

  const cssWidth = canvas.parentElement.clientWidth - 18;
  canvas.style.width = cssWidth + "px";
  canvas.style.height = chartHeight + "px";
  canvas.width = cssWidth * dpr;
  canvas.height = chartHeight * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, cssWidth, chartHeight);

  const maxContrib = Math.max(...signals.map(s => s.contribution), 0.001);
  const barMaxWidth = cssWidth - labelWidth - valueWidth - 20;

  signals.forEach((signal, i) => {
    const y = paddingTop + i * (rowHeight + barGap);
    const barWidth = Math.max(2, (signal.contribution / maxContrib) * barMaxWidth);

    ctx.font = "500 12px Inter, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#172033";
    ctx.textAlign = "right";
    ctx.fillText(signal.feature, labelWidth - 12, y + rowHeight / 2);

    const barX = labelWidth;
    const barY = y + 6;
    const barH = rowHeight - 12;

    ctx.fillStyle = signal.direction === "positive" ? "#0D9488" : "#DC2626";
    ctx.beginPath();
    const r = 3;
    ctx.moveTo(barX + r, barY);
    ctx.lineTo(barX + barWidth - r, barY);
    ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + r);
    ctx.lineTo(barX + barWidth, barY + barH - r);
    ctx.quadraticCurveTo(barX + barWidth, barY + barH, barX + barWidth - r, barY + barH);
    ctx.lineTo(barX + r, barY + barH);
    ctx.quadraticCurveTo(barX, barY + barH, barX, barY + barH - r);
    ctx.lineTo(barX, barY + r);
    ctx.quadraticCurveTo(barX, barY, barX + r, barY);
    ctx.fill();

    ctx.font = "600 11px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = signal.direction === "positive" ? "#0D9488" : "#DC2626";
    ctx.fillText(signal.contribution.toFixed(2), barX + barWidth + 8, y + rowHeight / 2);
  });
}

function renderRecommendations(input, result) {
  const container = document.getElementById("recommendations-list");
  if (!container) return;
  container.innerHTML = "";

  const hours = parseFloat(input.Hours_Studied) || 0;
  const attendance = parseFloat(input.Attendance) || 0;
  const prevScores = parseFloat(input.Previous_Scores) || 0;
  const sleep = parseFloat(input.Sleep_Hours) || 0;
  const tutoring = parseFloat(input.Tutoring_Sessions) || 0;
  const physical = parseFloat(input.Physical_Activity) || 0;

  const overviewAvgs = overviewData?.kpis || {};
  const avgHours = Math.round((overviewAvgs.avg_study_hours || 20) * 100) / 100;
  const avgAttendance = Math.round((overviewAvgs.avg_attendance || 80) * 100) / 100;
  const avgPrevScore = Math.round((overviewAvgs.avg_exam_score || 67) * 100) / 100;

  const topSignals = result.topSignals || [];
  const signalMap = {};
  for (const s of topSignals) {
    signalMap[s.feature] = s;
  }

  const recs = [];

  if (hours < avgHours - 3) {
    recs.push({
      icon: "&#128218;",
      text: `<strong>Study hours:</strong> Current ${hours} hrs/week is below the dataset average (${avgHours}). Increasing study consistency is a strong lever — Hours Studied is a top model signal.`
    });
  } else if (hours >= avgHours + 5) {
    recs.push({
      icon: "&#128218;",
      text: `<strong>Study hours:</strong> Strong study commitment at ${hours} hrs/week, well above average (${avgHours}). Maintain this consistency.`
    });
  }

  if (attendance < 75) {
    recs.push({
      icon: "&#127979;",
      text: `<strong>Attendance:</strong> At ${attendance}%, attendance is a key area for improvement. The model shows a strong positive relationship between attendance and exam performance.`
    });
  } else if (attendance >= avgAttendance + 5) {
    recs.push({
      icon: "&#127979;",
      text: `<strong>Attendance:</strong> Excellent attendance at ${attendance}%. This is a significant positive factor in the model's prediction.`
    });
  }

  if (prevScores < 65) {
    recs.push({
      icon: "&#128200;",
      text: `<strong>Previous performance:</strong> Building on a score of ${prevScores} — targeted tutoring or study groups may help strengthen foundational areas.`
    });
  } else if (prevScores >= 85) {
    recs.push({
      icon: "&#128200;",
      text: `<strong>Previous performance:</strong> Strong academic history at ${prevScores}. Continue leveraging this foundation for sustained performance.`
    });
  }

  if (hours >= 25 && attendance < 75) {
    recs.push({
      icon: "&#9888;&#65039;",
      text: `<strong>Balance check:</strong> High study hours (${hours}) but low attendance (${attendance}). Missing classes may reduce the benefit of self-study — the model values both engagement dimensions.`
    });
  }

  if (sleep < 6) {
    recs.push({
      icon: "&#128164;",
      text: `<strong>Sleep:</strong> At ${sleep} hrs, sleep is below recommended levels. Adequate rest supports cognitive function and study retention.`
    });
  }

  if (tutoring === 0 && prevScores < 70) {
    recs.push({
      icon: "&#128105;&#8205;&#127979;",
      text: `<strong>Tutoring:</strong> No tutoring sessions with a previous score of ${prevScores}. Consider targeted support — the model shows tutoring sessions contribute positively.`
    });
  }

  if (physical < 2) {
    recs.push({
      icon: "&#127939;",
      text: `<strong>Physical activity:</strong> At ${physical} hrs/week, activity is low. Regular physical activity supports focus and academic performance.`
    });
  }

  if (recs.length === 0) {
    recs.push({
      icon: "&#9989;",
      text: `<strong>Profile strength:</strong> This profile aligns well with the model's positive predictors. Continue maintaining current study habits, attendance, and engagement levels.`
    });
  }

  for (const rec of recs) {
    const div = document.createElement("div");
    div.className = "recommendation-item";
    div.innerHTML = `
      <span class="recommendation-icon">${rec.icon}</span>
      <span class="recommendation-text">${rec.text}</span>
    `;
    container.appendChild(div);
  }
}

function updateLiveModelInfo() {
  if (!artifactsData) return;
  const display = artifactsData.winning_model_display || artifactsData.winning_model;
  const evals = artifactsData.evaluation || {};
  const metrics = evals[artifactsData.winning_model] || {};
  const r2 = metrics.R2;

  const detailModel = document.getElementById("detail-model");
  const detailR2 = document.getElementById("detail-r2");
  if (detailModel) detailModel.textContent = display;
  if (detailR2 && r2 !== undefined) detailR2.textContent = r2.toFixed(3);
}
