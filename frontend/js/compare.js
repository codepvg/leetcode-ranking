/**
 * CodePVG Leaderboard Peer Comparison Module
 * Handles selection, comparison charts, and stats.
 */

window.selectedUsers = [];
window.compareModeActive = false;

let selectedUserHistories = [];
let difficultyChartInstance = null;
let progressChartInstance = null;
let currentGraphRange = "weekly"; // "weekly", "monthly", "overall"

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("compare-mode-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", toggleCompareMode);
  }

  const closeBtn = document.getElementById("close-compare-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeCompareModal);
  }

  const modalOverlay = document.getElementById("compare-modal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeCompareModal();
      }
    });
  }

  // Setup progress chart range filter buttons
  const rangeButtons = {
    weekly: document.getElementById("compare-btn-weekly"),
    monthly: document.getElementById("compare-btn-monthly"),
    overall: document.getElementById("compare-btn-overall"),
  };

  Object.keys(rangeButtons).forEach((range) => {
    const btn = rangeButtons[range];
    if (btn) {
      btn.addEventListener("click", () => {
        // Toggle active-filter class
        Object.values(rangeButtons).forEach((b) => b.classList.remove("active-filter"));
        btn.classList.add("active-filter");
        currentGraphRange = range;
        renderProgressHistoryChart();
      });
    }
  });
});

/**
 * Toggles the peer comparison mode state and checkbox visibility
 */
function toggleCompareMode() {
  window.compareModeActive = !window.compareModeActive;
  const leaderboardEl = document.querySelector(".leaderboard");
  const mobileCardsEl = document.getElementById("mobile-cards");
  const toggleBtn = document.getElementById("compare-mode-toggle");

  if (window.compareModeActive) {
    if (leaderboardEl) leaderboardEl.classList.add("compare-mode");
    if (mobileCardsEl) mobileCardsEl.classList.add("compare-mode");
    if (toggleBtn) {
      toggleBtn.innerText = "Exit Compare";
      toggleBtn.classList.remove("btn-secondary");
      toggleBtn.classList.add("btn-primary");
    }
  } else {
    if (leaderboardEl) leaderboardEl.classList.remove("compare-mode");
    if (mobileCardsEl) mobileCardsEl.classList.remove("compare-mode");
    if (toggleBtn) {
      toggleBtn.innerText = "Compare Users";
      toggleBtn.classList.remove("btn-primary");
      toggleBtn.classList.add("btn-secondary");
    }
    clearSelectedUsers();
  }
}

/**
 * Handles adding or removing a user from the comparison array
 */
function handleUserSelection(user, isChecked) {
  if (isChecked) {
    if (window.selectedUsers.length >= 3) {
      // Revert checkbox state
      const checkboxes = document.querySelectorAll(`input.compare-checkbox[data-username="${user.id}"]`);
      checkboxes.forEach((cb) => (cb.checked = false));
      showRetroNotification("SYSTEM: Peer limit reached (max 3 users).");
      return;
    }
    if (!window.selectedUsers.some((u) => u.id === user.id)) {
      window.selectedUsers.push(user);
    }
  } else {
    window.selectedUsers = window.selectedUsers.filter((u) => u.id !== user.id);
  }

  // Synchronize desktop & mobile checkboxes for the same student
  const checkboxes = document.querySelectorAll(`input.compare-checkbox[data-username="${user.id}"]`);
  checkboxes.forEach((cb) => (cb.checked = isChecked));

  updateFloatingCompareBar();
}

/**
 * Resets selections and hides comparison elements
 */
function clearSelectedUsers() {
  window.selectedUsers = [];
  const checkboxes = document.querySelectorAll("input.compare-checkbox");
  checkboxes.forEach((cb) => (cb.checked = false));
  updateFloatingCompareBar();
}

/**
 * Redraws/Toggles the bottom comparison panel
 */
function updateFloatingCompareBar() {
  let bar = document.getElementById("floating-compare-bar");

  if (window.selectedUsers.length === 0) {
    if (bar) bar.style.display = "none";
    return;
  }

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "floating-compare-bar";
    bar.className = "floating-compare-bar";
    document.body.appendChild(bar);
  }

  bar.style.display = "flex";

  const namesStr = window.selectedUsers.map((u) => u.name).join(", ");
  const count = window.selectedUsers.length;

  bar.innerHTML = `
    <div class="selected-list">
      Comparing (<span class="selected-tag">${count}/3</span>): ${namesStr}
    </div>
    <div class="actions">
      <button id="floating-btn-compare" class="btn-compare" ${count < 2 ? "disabled" : ""}>Compare</button>
      <button id="floating-btn-clear" class="btn-clear">Clear</button>
    </div>
  `;

  // Bind click handlers
  document.getElementById("floating-btn-clear").addEventListener("click", clearSelectedUsers);
  if (count >= 2) {
    document.getElementById("floating-btn-compare").addEventListener("click", openCompareModal);
  }
}

/**
 * Triggers a custom retro notification toast
 */
function showRetroNotification(message) {
  let container = document.getElementById("retro-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "retro-toast-container";
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 100000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "retro-toast";
  toast.innerText = message;

  container.appendChild(toast);

  // Auto dismiss
  setTimeout(() => {
    toast.style.animation = "fadeOut 0.4s ease-in forwards";
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
}

/**
 * Resilient student data fetcher that tries local origin, localhost:3000, and production endpoints
 */
async function fetchStudentHistoryData(userId) {
  const origins = [];
  
  if (window.location.port !== "5500" && window.location.protocol !== "file:") {
    origins.push(window.location.origin);
  }
  origins.push("http://localhost:3000");
  origins.push("https://lc-backend-lyq2.onrender.com");

  let lastError = null;
  for (const origin of origins) {
    try {
      const url = `${origin}/api/student/${userId}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      lastError = new Error(`HTTP ${res.status} from ${origin}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to fetch student data from all endpoints");
}

/**
 * Opens comparison overlay and fetches student history
 */
async function openCompareModal() {
  const modal = document.getElementById("compare-modal");
  const loading = document.getElementById("compare-loading");
  const errorEl = document.getElementById("compare-error");
  const results = document.getElementById("compare-results");

  if (!modal) return;

  modal.classList.add("active");
  loading.style.display = "block";
  errorEl.style.display = "none";
  results.style.display = "none";

  try {
    const fetchPromises = window.selectedUsers.map(async (user) => {
      return fetchStudentHistoryData(user.id);
    });

    selectedUserHistories = await Promise.all(fetchPromises);
    console.log("Successfully fetched compared users history:", selectedUserHistories);

    // Populate UI
    populateComparisonTable();
    renderDifficultyBreakdownChart();
    renderProgressHistoryChart();

    loading.style.display = "none";
    results.style.display = "block";
  } catch (error) {
    console.error("Comparison load failure:", error);
    loading.style.display = "none";
    errorEl.style.display = "block";
  }
}

/**
 * Fades out comparison overlay
 */
function closeCompareModal() {
  const modal = document.getElementById("compare-modal");
  if (modal) {
    modal.classList.remove("active");
  }

  // Clean up chart instances to avoid redraw glitches
  if (difficultyChartInstance) {
    difficultyChartInstance.destroy();
    difficultyChartInstance = null;
  }
  if (progressChartInstance) {
    progressChartInstance.destroy();
    progressChartInstance = null;
  }
}

/**
 * Calculates average daily problems solved from history data
 */
function calculateGrindingVelocity(history) {
  if (!history || history.length < 2) return "0.00";
  const earliest = history[0];
  const latest = history[history.length - 1];

  const earliestTotal = (Number(earliest.easy) || 0) + (Number(earliest.medium) || 0) + (Number(earliest.hard) || 0);
  const latestTotal = (Number(latest.easy) || 0) + (Number(latest.medium) || 0) + (Number(latest.hard) || 0);
  const diffSolved = latestTotal - earliestTotal;

  const diffDays = Math.ceil(Math.abs(new Date(latest.date) - new Date(earliest.date)) / (1000 * 60 * 60 * 24)) || 1;
  return (diffSolved / diffDays).toFixed(2);
}

/**
 * Renders metrics comparison side-by-side table
 */
function populateComparisonTable() {
  const table = document.getElementById("compare-table-el");
  if (!table) return;

  const headers = ["Metric", ...window.selectedUsers.map((u) => u.name)];
  
  // Rows data matrix
  const metrics = [
    { label: "LeetCode Username", values: window.selectedUsers.map((u) => `@${u.id}`) },
    { label: "Overall Score", values: window.selectedUsers.map((u) => u.score) },
    { label: "Total Solved", values: window.selectedUsers.map((u) => u.data.totalSolved) },
    { label: "Easy Solved", values: window.selectedUsers.map((u) => u.data.easySolved) },
    { label: "Medium Solved", values: window.selectedUsers.map((u) => u.data.mediumSolved) },
    { label: "Hard Solved", values: window.selectedUsers.map((u) => u.data.hardSolved) },
    {
      label: "Grinding Velocity (Avg Daily)",
      values: selectedUserHistories.map((sh) => `${calculateGrindingVelocity(sh.history)} / day`),
    },
  ];

  let html = "<thead><tr>";
  headers.forEach((h) => {
    html += `<th>${h}</th>`;
  });
  html += "</tr></thead><tbody>";

  metrics.forEach((m) => {
    html += `<tr><td>${m.label}</td>`;
    m.values.forEach((v) => {
      html += `<td>${v}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody>";

  table.innerHTML = html;
}

/**
 * Draws difficulty breakdown grouped bar chart using Chart.js
 */
function renderDifficultyBreakdownChart() {
  const canvas = document.getElementById("compareDifficultyChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (difficultyChartInstance) {
    difficultyChartInstance.destroy();
  }

  const labels = window.selectedUsers.map((u) => u.name);
  const easyData = window.selectedUsers.map((u) => Number(u.data.easySolved) || 0);
  const mediumData = window.selectedUsers.map((u) => Number(u.data.mediumSolved) || 0);
  const hardData = window.selectedUsers.map((u) => Number(u.data.hardSolved) || 0);

  difficultyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Easy",
          data: easyData,
          backgroundColor: "#00ff41",
          borderColor: "#00cc33",
          borderWidth: 1,
        },
        {
          label: "Medium",
          data: mediumData,
          backgroundColor: "#ffb000",
          borderColor: "#cc8e00",
          borderWidth: 1,
        },
        {
          label: "Hard",
          data: hardData,
          backgroundColor: "#ff3333",
          borderColor: "#cc0000",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#b0ffb0",
            font: { family: "Fira Code" },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(0, 255, 65, 0.1)" },
          ticks: {
            color: "#5a8a5a",
            font: { family: "Fira Code", size: 10 },
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0, 255, 65, 0.1)" },
          ticks: {
            color: "#5a8a5a",
            font: { family: "Fira Code" },
          },
        },
      },
    },
  });
}

/**
 * Draws progress line charts for each selected user on a combined axis
 */
function renderProgressHistoryChart() {
  const canvas = document.getElementById("compareProgressChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (progressChartInstance) {
    progressChartInstance.destroy();
  }

  // Filter histories according to range
  const now = new Date();
  const filterDate = new Date();

  if (currentGraphRange === "weekly") {
    filterDate.setDate(now.getDate() - 7);
  } else if (currentGraphRange === "monthly") {
    filterDate.setDate(now.getDate() - 30);
  }

  // Slice histories by range and gather unique timeline dates
  const filteredHistories = selectedUserHistories.map((sh) => {
    let history = sh.history || [];
    if (currentGraphRange !== "overall") {
      history = history.filter((item) => new Date(item.date) >= filterDate);
    }
    // Make sure it's sorted chronologically
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { username: sh.username, history };
  });

  const allDatesSet = new Set();
  filteredHistories.forEach((fh) => {
    fh.history.forEach((h) => allDatesSet.add(h.date));
  });
  const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

  if (sortedDates.length === 0) {
    // Edge case: no history records in filter range
    const dummyDate = now.toISOString().split("T")[0];
    sortedDates.push(dummyDate);
  }

  // Color options: Green, Cyan, Amber
  const colors = [
    { border: "#00ff41", bg: "rgba(0, 255, 65, 0.05)" },
    { border: "#00e5ff", bg: "rgba(0, 229, 255, 0.05)" },
    { border: "#ffb000", bg: "rgba(255, 176, 0, 0.05)" },
  ];

  // Map each user's history values onto the sorted timeline
  const datasets = filteredHistories.map((fh, index) => {
    let lastKnownTotal = 0;
    const dateValuesMap = new Map();

    fh.history.forEach((item) => {
      const total = (Number(item.easy) || 0) + (Number(item.medium) || 0) + (Number(item.hard) || 0);
      dateValuesMap.set(item.date, total);
    });

    const dataPoints = sortedDates.map((date) => {
      if (dateValuesMap.has(date)) {
        lastKnownTotal = dateValuesMap.get(date);
      }
      return lastKnownTotal;
    });

    const userObj = window.selectedUsers.find((u) => u.id === fh.username);
    const displayName = userObj ? userObj.name : fh.username;
    const color = colors[index % colors.length];

    return {
      label: displayName,
      data: dataPoints,
      borderColor: color.border,
      backgroundColor: color.bg,
      tension: 0.2,
      fill: true,
      spanGaps: true,
    };
  });

  progressChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sortedDates,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#b0ffb0",
            font: { family: "Fira Code" },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(0, 255, 65, 0.1)" },
          ticks: {
            color: "#5a8a5a",
            font: { family: "Fira Code", size: 9 },
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          grid: { color: "rgba(0, 255, 65, 0.1)" },
          ticks: {
            color: "#5a8a5a",
            font: { family: "Fira Code" },
          },
        },
      },
    },
  });
}
