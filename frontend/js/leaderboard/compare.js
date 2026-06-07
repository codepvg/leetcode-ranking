// Peer Comparison Module

window.selectedCompareUsers = [];
window.compareModeEnabled = false;
let difficultyChartInstance = null;
let historyChartInstance = null;

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  setupCompareListeners();
});

function setupCompareListeners() {
  const compareBtn = document.getElementById("compare-btn");
  const resetBtn = document.getElementById("compare-reset-btn");
  const modal = document.getElementById("compare-modal");
  const overlay = modal.querySelector(".modal-overlay");
  const closeBtns = modal.querySelectorAll(".close-modal-btn");
  const toggleBtn = document.getElementById("compare-mode-toggle");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      window.compareModeEnabled = !window.compareModeEnabled;
      if (window.compareModeEnabled) {
        document.body.classList.add("compare-mode-active");
        toggleBtn.textContent = "$ compare_mode --disable";
        toggleBtn.classList.remove("btn-secondary");
        toggleBtn.classList.add("btn-primary");
        document.querySelectorAll(".compare-checkbox").forEach(cb => cb.style.display = "inline-block");
      } else {
        document.body.classList.remove("compare-mode-active");
        toggleBtn.textContent = "$ compare_mode --enable";
        toggleBtn.classList.remove("btn-primary");
        toggleBtn.classList.add("btn-secondary");
        document.querySelectorAll(".compare-checkbox").forEach(cb => cb.style.display = "none");
        // Clear selection
        window.selectedCompareUsers = [];
        updateCheckboxesState();
        updateFloatingBar();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Clear selection
      window.selectedCompareUsers = [];
      updateCheckboxesState();
      updateFloatingBar();

      // Exit comparison mode
      window.compareModeEnabled = false;
      document.body.classList.remove("compare-mode-active");
      if (toggleBtn) {
        toggleBtn.textContent = "$ compare_mode --enable";
        toggleBtn.classList.remove("btn-primary");
        toggleBtn.classList.add("btn-secondary");
      }
      document.querySelectorAll(".compare-checkbox").forEach(cb => cb.style.display = "none");
    });
  }

  if (compareBtn) {
    compareBtn.addEventListener("click", openCompareModal);
  }

  if (overlay) {
    overlay.addEventListener("click", closeCompareModal);
  }

  closeBtns.forEach((btn) => {
    btn.addEventListener("click", closeCompareModal);
  });

  // Handle ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeCompareModal();
    }
  });
}

// Global helper to clear comparison selections from parent tab switching
window.clearCompareSelection = function () {
  window.selectedCompareUsers = [];
  updateCheckboxesState();
  updateFloatingBar();
};

// Handle checkbox selection change (exposed to render.js)
window.handleCompareSelectionChange = function (user, isChecked) {
  if (isChecked) {
    if (window.selectedCompareUsers.length < 3) {
      // Ensure we don't have duplicate
      if (!window.selectedCompareUsers.some((u) => u.id === user.id)) {
        window.selectedCompareUsers.push(user);
      }
    }
  } else {
    window.selectedCompareUsers = window.selectedCompareUsers.filter(
      (u) => u.id !== user.id,
    );
  }

  updateCheckboxesState();
  updateFloatingBar();
};

function updateCheckboxesState() {
  const checkboxes = document.querySelectorAll(".compare-checkbox");
  const count = window.selectedCompareUsers.length;

  checkboxes.forEach((cb) => {
    const username = cb.dataset.username;
    const isSelected = window.selectedCompareUsers.some(
      (u) => u.id === username,
    );
    cb.checked = isSelected;

    if (count >= 3 && !isSelected) {
      cb.disabled = true;
    } else {
      cb.disabled = false;
    }

    // Ensure display state matches comparison mode
    cb.style.display = window.compareModeEnabled ? "inline-block" : "none";
  });
}

function updateFloatingBar() {
  const bar = document.getElementById("compare-floating-bar");
  const countSpan = document.getElementById("compare-count");
  const namesDiv = document.getElementById("compare-selected-names");
  const compareBtn = document.getElementById("compare-btn");

  const count = window.selectedCompareUsers.length;

  if (countSpan) {
    countSpan.textContent = count;
  }

  if (namesDiv) {
    namesDiv.innerHTML = "";
    window.selectedCompareUsers.forEach((user) => {
      const badge = document.createElement("span");
      badge.className = "compare-badge";

      // Sanitize user name safely using textNode
      badge.appendChild(document.createTextNode(user.name));

      const removeBtn = document.createElement("span");
      removeBtn.className = "compare-badge-remove";
      removeBtn.textContent = " ×";
      removeBtn.addEventListener("click", () => {
        window.handleCompareSelectionChange(user, false);
      });
      badge.appendChild(removeBtn);

      namesDiv.appendChild(badge);
    });
  }

  if (compareBtn) {
    compareBtn.disabled = count < 2;
  }

  if (bar) {
    if (count >= 2) {
      bar.classList.remove("hidden");
    } else {
      bar.classList.add("hidden");
    }
  }
}

function closeCompareModal() {
  const modal = document.getElementById("compare-modal");
  if (modal) {
    modal.classList.add("hidden");
  }

  // Destroy charts to free resources
  if (difficultyChartInstance) {
    difficultyChartInstance.destroy();
    difficultyChartInstance = null;
  }
  if (historyChartInstance) {
    historyChartInstance.destroy();
    historyChartInstance = null;
  }
}

async function openCompareModal() {
  const modal = document.getElementById("compare-modal");
  const loading = document.getElementById("compare-modal-loading");
  const errorDiv = document.getElementById("compare-modal-error");
  const content = document.getElementById("compare-modal-content");

  if (!modal) return;

  modal.classList.remove("hidden");
  loading.classList.remove("hidden");
  errorDiv.classList.add("hidden");
  content.classList.add("hidden");

  try {
    // Set dynamic metric summary title based on active tab
    const titleEl = document.getElementById("compare-metrics-title");
    if (titleEl) {
      const context = window.activeDatasetType || "overall";
      titleEl.textContent = `> metrics_summary (${context})`;
    }

    const comparedData = await Promise.all(
      window.selectedCompareUsers.map(async (user) => {
        try {
          let apiUrL = `/api/student/${user.id}`;
          if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            if (window.location.port && window.location.port !== "3000") {
              apiUrL = `http://localhost:3000/api/student/${user.id}`;
            }
          }
          const res = await fetch(apiUrL);
          if (!res.ok) throw new Error("Fetch failed");
          const details = await res.json();

          let liveData = null;
          if (window.activeDatasetType === "daily") {
            try {
              const liveRes = await fetch(`https://leetcode-api-dun.vercel.app/${user.id}`);
              if (liveRes.ok) {
                liveData = await liveRes.json();
              }
            } catch (liveErr) {
              console.error(`Failed to fetch live stats for ${user.id}`, liveErr);
            }
          }

          return {
            user,
            history: details.history || [],
            globalRank: details.globalRank || null,
            liveData,
            success: true,
          };
        } catch (e) {
          console.error(`Failed to fetch student details for ${user.id}`, e);
          return {
            user,
            history: [],
            globalRank: null,
            liveData: null,
            success: false,
          };
        }
      }),
    );

    loading.classList.add("hidden");
    content.classList.remove("hidden");

    renderMetricsTable(comparedData);
    renderDifficultyChart(comparedData);
    renderHistoryChart(comparedData);
  } catch (err) {
    console.error("Comparison fetch error", err);
    loading.classList.add("hidden");
    errorDiv.classList.remove("hidden");
    document.getElementById("compare-error-msg").textContent = err.message;
  }
}

function calculateAverageDaily(history) {
  if (!history || history.length < 2) return 0;
  const first = history[0];
  const last = history[history.length - 1];
  const firstTotal = first.easy + first.medium + first.hard;
  const lastTotal = last.easy + last.medium + last.hard;
  const diff = lastTotal - firstTotal;
  const days =
    (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24);
  return days > 0 ? diff / days : 0;
}

function renderMetricsTable(comparedData) {
  const table = document.getElementById("compare-metrics-table");
  table.innerHTML = "";

  // Headings Row
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  const metricHeader = document.createElement("th");
  metricHeader.textContent = "Metric";
  headerRow.appendChild(metricHeader);

  comparedData.forEach((item) => {
    const th = document.createElement("th");
    th.textContent = item.user.name;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Define Metrics to display
  const metrics = [
    { label: "LeetCode ID", key: "id", isRaw: true },
    { label: "Leaderboard Rank", key: "originalRank", isUserField: true },
    {
      label: "Rank Change",
      calc: (item) => {
        const rc = item.user.rankChange;
        if (!rc) return "N/A";
        if (rc === "NEW") return "[new]";
        if (rc === "=") return "[==]";
        return `[${rc}]`;
      }
    },
    {
      label: "Global Rank",
      calc: (item) => item.globalRank ? item.globalRank.toLocaleString() : "N/A"
    },
    { label: "Score", key: "score", isUserField: true },
    { label: "Easy Solved", key: "easySolved", isDataField: true },
    { label: "Medium Solved", key: "mediumSolved", isDataField: true },
    { label: "Hard Solved", key: "hardSolved", isDataField: true },
    { label: "Total Solved", key: "totalSolved", isDataField: true },
    {
      label: "Avg Daily Solved",
      calc: (item) => calculateAverageDaily(item.history).toFixed(2),
    },
  ];

  const tbody = document.createElement("tbody");

  metrics.forEach((metric) => {
    const tr = document.createElement("tr");

    const labelTd = document.createElement("td");
    labelTd.textContent = metric.label;
    labelTd.className = "metric-label";
    tr.appendChild(labelTd);

    comparedData.forEach((item) => {
      const td = document.createElement("td");

      if (metric.isRaw) {
        td.textContent = item.user[metric.key];
      } else if (metric.isUserField) {
        td.textContent = item.user[metric.key];
      } else if (metric.isDataField) {
        td.textContent = item.user.data[metric.key];
      } else if (metric.calc) {
        td.textContent = metric.calc(item);
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

function renderDifficultyChart(comparedData) {
  const ctx = document.getElementById("difficultyChart").getContext("2d");

  if (difficultyChartInstance) {
    difficultyChartInstance.destroy();
  }

  // Predefined CRT Colors
  const colors = [
    {
      border: "#00ff41",
      bg: "rgba(0, 255, 65, 0.15)",
    },
    {
      border: "#00e5ff",
      bg: "rgba(0, 229, 255, 0.15)",
    },
    {
      border: "#ffb000",
      bg: "rgba(255, 176, 0, 0.15)",
    },
  ];

  const datasets = comparedData.map((item, index) => {
    const color = colors[index % colors.length];
    return {
      label: item.user.name,
      data: [
        item.user.data.easySolved,
        item.user.data.mediumSolved,
        item.user.data.hardSolved,
      ],
      backgroundColor: color.bg,
      borderColor: color.border,
      borderWidth: 1.5,
    };
  });

  difficultyChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: "rgba(0, 255, 65, 0.08)",
          },
          ticks: {
            color: "#5a8a5a",
            font: {
              family: "Fira Code, Courier New, monospace",
            },
          },
        },
        y: {
          grid: {
            color: "rgba(0, 255, 65, 0.08)",
          },
          ticks: {
            color: "#5a8a5a",
            font: {
              family: "Fira Code, Courier New, monospace",
            },
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#b0ffb0",
            font: {
              family: "Fira Code, Courier New, monospace",
              size: 11,
            },
          },
        },
      },
    },
  });
}

function renderHistoryChart(comparedData) {
  const chartTitleEl = document.getElementById("history-chart-title");
  const chartCanvas = document.getElementById("historyChart");
  const dailyPlaceholder = document.getElementById("daily-comparison-placeholder");

  const context = window.activeDatasetType || "overall";

  if (chartTitleEl) {
    if (context === "daily") {
      chartTitleEl.textContent = "> daily_comparison";
    } else {
      chartTitleEl.textContent = `> progress_history (${context})`;
    }
  }

  // Handle daily tab fallback to live stats instead of line chart
  if (context === "daily") {
    if (chartCanvas) chartCanvas.classList.add("hidden");
    if (dailyPlaceholder) dailyPlaceholder.classList.remove("hidden");
    if (historyChartInstance) {
      historyChartInstance.destroy();
      historyChartInstance = null;
    }
    renderDailyComparison(comparedData);
    return;
  }

  // Show chart canvas and hide daily placeholder for other tabs
  if (chartCanvas) chartCanvas.classList.remove("hidden");
  if (dailyPlaceholder) dailyPlaceholder.classList.add("hidden");

  const ctx = chartCanvas.getContext("2d");

  if (historyChartInstance) {
    historyChartInstance.destroy();
  }

  // Find all unique dates in the history sets
  const allDates = new Set();
  comparedData.forEach((item) => {
    item.history.forEach((h) => {
      if (h.date) allDates.add(h.date);
    });
  });

  // Sort dates chronologically
  let sortedDates = Array.from(allDates).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  // Slices dates based on context window
  if (context === "weekly") {
    sortedDates = sortedDates.slice(-7);
  } else if (context === "monthly") {
    sortedDates = sortedDates.slice(-30);
  }

  // Predefined CRT colors for lines
  const colors = ["#00ff41", "#00e5ff", "#ffb000"];

  const datasets = comparedData.map((item, index) => {
    const color = colors[index % colors.length];

    // Find baseline total solved count just before the first visible date
    let lastTotal = 0;
    if (sortedDates.length > 0) {
      const firstVisibleDate = new Date(sortedDates[0]);
      const recordsBefore = item.history
        .filter(r => new Date(r.date) < firstVisibleDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      if (recordsBefore.length > 0) {
        const latestBefore = recordsBefore[0];
        lastTotal = latestBefore.easy + latestBefore.medium + latestBefore.hard;
      }
    }

    // Build values corresponding to each date
    const dataPoints = sortedDates.map((date) => {
      const record = item.history.find((r) => r.date === date);
      if (record) {
        lastTotal = record.easy + record.medium + record.hard;
      }
      return lastTotal;
    });

    return {
      label: item.user.name,
      data: dataPoints,
      borderColor: color,
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.1,
      pointRadius: sortedDates.length > 15 ? 1 : 3,
      pointBackgroundColor: color,
    };
  });

  historyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: sortedDates,
      datasets: datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            color: "rgba(0, 255, 65, 0.08)",
          },
          ticks: {
            color: "#5a8a5a",
            maxRotation: 45,
            minRotation: 45,
            font: {
              family: "Fira Code, Courier New, monospace",
              size: 9,
            },
          },
        },
        y: {
          grid: {
            color: "rgba(0, 255, 65, 0.08)",
          },
          ticks: {
            color: "#5a8a5a",
            font: {
              family: "Fira Code, Courier New, monospace",
            },
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#b0ffb0",
            font: {
              family: "Fira Code, Courier New, monospace",
              size: 11,
            },
          },
        },
      },
    },
  });
}

function renderDailyComparison(comparedData) {
  const placeholder = document.getElementById("daily-comparison-placeholder");
  if (!placeholder) return;
  placeholder.innerHTML = "";

  const textDiv = document.createElement("div");
  textDiv.className = "daily-placeholder-text";
  textDiv.textContent = "[!] No meaningful historical trend available for daily comparison.";
  placeholder.appendChild(textDiv);

  const cardsContainer = document.createElement("div");
  cardsContainer.className = "live-stats-cards";

  comparedData.forEach((item) => {
    const card = document.createElement("div");
    card.className = "live-stats-card";

    const title = document.createElement("h4");
    title.appendChild(document.createTextNode(item.user.name));
    card.appendChild(title);

    const makeRow = (label, val) => {
      const row = document.createElement("div");
      row.className = "live-stat-row";
      const lbl = document.createElement("span");
      lbl.textContent = label;
      row.appendChild(lbl);
      const value = document.createElement("span");
      value.textContent = val;
      row.appendChild(value);
      return row;
    };

    if (item.liveData) {
      card.appendChild(makeRow("Easy Solved", item.liveData.easySolved || 0));
      card.appendChild(makeRow("Medium Solved", item.liveData.mediumSolved || 0));
      card.appendChild(makeRow("Hard Solved", item.liveData.hardSolved || 0));
      card.appendChild(makeRow("Live Total", item.liveData.totalSolved || 0));
    } else {
      // Fallback to local daily leaderboard dataset values
      card.appendChild(makeRow("Easy Solved", item.user.data.easySolved || 0));
      card.appendChild(makeRow("Medium Solved", item.user.data.mediumSolved || 0));
      card.appendChild(makeRow("Hard Solved", item.user.data.hardSolved || 0));
      card.appendChild(makeRow("Total Solved", item.user.data.totalSolved || 0));

      const noteRow = document.createElement("div");
      noteRow.style.fontSize = "0.65rem";
      noteRow.style.color = "var(--text-muted)";
      noteRow.style.marginTop = "8px";
      noteRow.textContent = "* Offline profile data";
      card.appendChild(noteRow);
    }

    cardsContainer.appendChild(card);
  });

  placeholder.appendChild(cardsContainer);
}
