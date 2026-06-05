// Peer Comparison Module

window.selectedCompareUsers = [];
let difficultyChartInstance = null;
let historyChartInstance = null;

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  setupCompareListeners();
});

function setupCompareListeners() {
  const compareBtn = document.getElementById("compare-btn");
  const modal = document.getElementById("compare-modal");
  const overlay = modal.querySelector(".modal-overlay");
  const closeBtns = modal.querySelectorAll(".close-modal-btn");

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
    const comparedData = await Promise.all(
      window.selectedCompareUsers.map(async (user) => {
        try {
          const res = await fetch(`/api/student/${user.id}`);
          if (!res.ok) throw new Error("Fetch failed");
          const details = await res.json();
          return {
            user,
            history: details.history || [],
            success: true,
          };
        } catch (e) {
          console.error(`Failed to fetch history for ${user.id}`, e);
          return {
            user,
            history: [],
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
    { label: "Current Rank", key: "originalRank", isUserField: true },
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
  const ctx = document.getElementById("historyChart").getContext("2d");

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
  const sortedDates = Array.from(allDates).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  // Predefined CRT colors for lines
  const colors = ["#00ff41", "#00e5ff", "#ffb000"];

  const datasets = comparedData.map((item, index) => {
    const color = colors[index % colors.length];

    // Build values corresponding to each date
    let lastTotal = 0;
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
