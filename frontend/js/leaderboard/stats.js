/**
 * CodePVG Leaderboard Statistics Module
 * Computes and renders aggregate statistics from existing leaderboard data.
 * Frontend-only: reuses window.leaderboardData, no new API calls.
 */

let statsGraphRange = "overall";
let statsDifficultyChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("stats-modal-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", openStatsModal);
  }

  const closeBtn = document.getElementById("close-stats-modal");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeStatsModal);
  }

  const modalOverlay = document.getElementById("stats-modal");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeStatsModal();
      }
    });
  }

  const rangeButtons = {
    overall: document.getElementById("stats-btn-overall"),
    monthly: document.getElementById("stats-btn-monthly"),
    weekly: document.getElementById("stats-btn-weekly"),
    daily: document.getElementById("stats-btn-daily"),
  };

  Object.keys(rangeButtons).forEach((range) => {
    const btn = rangeButtons[range];
    if (btn) {
      btn.addEventListener("click", () => {
        statsGraphRange = range;
        updateStatsRangeButtons();
        updateStatsModalTitle();
        renderStats();
      });
    }
  });
});

function updateStatsRangeButtons() {
  const rangeButtons = {
    overall: document.getElementById("stats-btn-overall"),
    monthly: document.getElementById("stats-btn-monthly"),
    weekly: document.getElementById("stats-btn-weekly"),
    daily: document.getElementById("stats-btn-daily"),
  };
  Object.values(rangeButtons).forEach(
    (b) => b && b.classList.remove("active-filter"),
  );
  if (rangeButtons[statsGraphRange]) {
    rangeButtons[statsGraphRange].classList.add("active-filter");
  }
}

function updateStatsModalTitle() {
  const titleEl = document.getElementById("stats-modal-title");
  if (titleEl) {
    titleEl.textContent = `[SYSTEM_STATS_MODULE] - metrics_summary (${statsGraphRange})`;
  }
}

/**
 * Opens the statistics overlay, defaulting to whichever leaderboard mode
 * is currently active, then renders from already-loaded leaderboardData.
 */
function openStatsModal() {
  const modal = document.getElementById("stats-modal");
  if (!modal) return;

  statsGraphRange =
    (typeof activeDatasetType !== "undefined" && activeDatasetType) ||
    "overall";
  updateStatsRangeButtons();
  updateStatsModalTitle();

  modal.classList.add("active");
  renderStats();
}

function closeStatsModal() {
  const modal = document.getElementById("stats-modal");
  if (modal) {
    modal.classList.remove("active");
  }

  if (statsDifficultyChartInstance) {
    statsDifficultyChartInstance.destroy();
    statsDifficultyChartInstance = null;
  }
}

/**
 * Computes aggregate stats for the current mode from window.leaderboardData
 */
function computeAggregateStats(mode) {
  const dataset =
    (window.leaderboardData && window.leaderboardData[mode]) || [];

  const totalRegisteredUsers = dataset.length;

  let totalSolved = 0;
  let totalEasy = 0;
  let totalMedium = 0;
  let totalHard = 0;

  dataset.forEach((user) => {
    const d = user.data || {};
    totalSolved += Number(d.totalSolved) || 0;
    totalEasy += Number(d.easySolved) || 0;
    totalMedium += Number(d.mediumSolved) || 0;
    totalHard += Number(d.hardSolved) || 0;
  });

  const avgSolvedPerUser =
    totalRegisteredUsers > 0
      ? (totalSolved / totalRegisteredUsers).toFixed(2)
      : "0.00";

  return {
    totalRegisteredUsers,
    totalSolved,
    avgSolvedPerUser,
    totalEasy,
    totalMedium,
    totalHard,
  };
}

/**
 * Renders the metrics table for the currently selected mode
 */
function populateStatsTable(stats) {
  const table = document.getElementById("stats-table-el");
  if (!table) return;

  table.innerHTML = "";

  const rows = [
    ["Total Registered Users", stats.totalRegisteredUsers],
    ["Total Problems Solved", stats.totalSolved],
    ["Avg. Problems Solved / User", stats.avgSolvedPerUser],
    ["Easy Solved (aggregate)", stats.totalEasy],
    ["Medium Solved (aggregate)", stats.totalMedium],
    ["Hard Solved (aggregate)", stats.totalHard],
  ];

  const tbody = document.createElement("tbody");
  rows.forEach(([label, value]) => {
    const row = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.textContent = label;
    const valueCell = document.createElement("td");
    valueCell.textContent = value;
    row.appendChild(labelCell);
    row.appendChild(valueCell);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
}

/**
 * Renders the aggregate Easy/Medium/Hard distribution as a doughnut chart
 */
function renderStatsDifficultyChart(stats) {
  const canvas = document.getElementById("statsDifficultyChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (statsDifficultyChartInstance) {
    statsDifficultyChartInstance.destroy();
  }

  statsDifficultyChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [
        {
          data: [stats.totalEasy, stats.totalMedium, stats.totalHard],
          backgroundColor: ["#00ff41", "#ffb000", "#ff3333"],
          borderColor: ["#00cc33", "#cc8e00", "#cc0000"],
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
    },
  });
}

/**
 * Recomputes and redraws the entire stats view for statsGraphRange
 */
function renderStats() {
  const stats = computeAggregateStats(statsGraphRange);
  populateStatsTable(stats);
  renderStatsDifficultyChart(stats);
}
