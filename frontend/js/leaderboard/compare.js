/**
 * CodePVG Leaderboard Peer Comparison Module
 * Handles selection, comparison charts, and stats.
 */

window.selectedUsers = [];
window.compareModeActive = false;

let selectedUserData = [];
let difficultyChartInstance = null;
let progressChartInstance = null;
let currentGraphRange = "weekly"; // "weekly", "monthly", "overall"

function updateDatasetButtons() {
  const rangeButtons = {
    weekly: document.getElementById("compare-btn-weekly"),
    monthly: document.getElementById("compare-btn-monthly"),
    overall: document.getElementById("compare-btn-overall"),
    daily: document.getElementById("compare-btn-daily"),
  };
  Object.values(rangeButtons).forEach(
    (b) => b && b.classList.remove("active-filter"),
  );
  if (rangeButtons[currentGraphRange]) {
    rangeButtons[currentGraphRange].classList.add("active-filter");
  }
}

function updateModalTitle() {
  const titleEl = document.querySelector(".compare-card-title");
  if (titleEl) {
    titleEl.textContent = `[SYSTEM_COMPARE_MODULE] - metrics_summary (${currentGraphRange})`;
  }
}

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
    daily: document.getElementById("compare-btn-daily"),
  };

  Object.keys(rangeButtons).forEach((range) => {
    const btn = rangeButtons[range];
    if (btn) {
      btn.addEventListener("click", () => {
        currentGraphRange = range;
        updateDatasetButtons();
        updateModalTitle();
        populateComparisonTable();
        renderDifficultyBreakdownChart();
        renderProgressHistoryChart();
      });
    }
  });

  // Initialize compare mode from localStorage
  initializeCompareMode();
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
      toggleBtn.innerText = "[--exit-compare]";
      toggleBtn.style.color = "var(--green)";
      toggleBtn.style.background = "var(--green-muted)";
      toggleBtn.style.borderColor = "var(--green-dim)";
      toggleBtn.style.textShadow = "0 0 5px rgba(0, 255, 65, 0.3)";
    }
  } else {
    if (leaderboardEl) leaderboardEl.classList.remove("compare-mode");
    if (mobileCardsEl) mobileCardsEl.classList.remove("compare-mode");
    if (toggleBtn) {
      toggleBtn.innerText = "[--compare-peers]";
      toggleBtn.style.color = "var(--amber)";
      toggleBtn.style.background = "var(--bg-raised)";
      toggleBtn.style.borderColor = "var(--border)";
      toggleBtn.style.textShadow = "none";
    }
    clearSelectedUsers();
  }
}

/**
 * Initializes the compare mode and loads selections from localStorage on page load
 */
function initializeCompareMode() {
  try {
    const stored = localStorage.getItem("compare_users");
    if (stored) {
      window.selectedUsers = JSON.parse(stored);
    }
  } catch (err) {
    console.error("Failed to load compare_users from localStorage:", err);
  }

  if (window.selectedUsers && window.selectedUsers.length > 0) {
    window.compareModeActive = true;
    const leaderboardEl = document.querySelector(".leaderboard");
    const mobileCardsEl = document.getElementById("mobile-cards");
    const toggleBtn = document.getElementById("compare-mode-toggle");

    if (leaderboardEl) leaderboardEl.classList.add("compare-mode");
    if (mobileCardsEl) mobileCardsEl.classList.add("compare-mode");
    if (toggleBtn) {
      toggleBtn.innerText = "[--exit-compare]";
      toggleBtn.style.color = "var(--green)";
      toggleBtn.style.background = "var(--green-muted)";
      toggleBtn.style.borderColor = "var(--green-dim)";
      toggleBtn.style.textShadow = "0 0 5px rgba(0, 255, 65, 0.3)";
    }
    updateFloatingCompareBar();
  }
}

/**
 * Handles adding or removing a user from the comparison array
 */
function handleUserSelection(user, isChecked) {
  if (isChecked) {
    if (window.selectedUsers.length >= 3) {
      // Revert checkbox state
      const checkboxes = document.querySelectorAll(
        `input.compare-checkbox[data-username="${user.id}"]`,
      );
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

  // Persist selections to localStorage
  try {
    localStorage.setItem("compare_users", JSON.stringify(window.selectedUsers));
  } catch (err) {
    console.error("Failed to save compare_users to localStorage:", err);
  }

  // Synchronize desktop & mobile checkboxes for the same user
  const checkboxes = document.querySelectorAll(
    `input.compare-checkbox[data-username="${user.id}"]`,
  );
  checkboxes.forEach((cb) => (cb.checked = isChecked));

  updateFloatingCompareBar();
}

/**
 * Resets selections and hides comparison elements
 */
function clearSelectedUsers() {
  window.selectedUsers = [];
  try {
    localStorage.removeItem("compare_users");
  } catch (err) {
    console.error("Failed to remove compare_users from localStorage:", err);
  }
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
    if (bar) bar.remove();
    return;
  }

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "floating-compare-bar";
    bar.className = "floating-compare-bar";
    // Event delegation: single listener handles all button clicks
    bar.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.id === "floating-btn-clear") {
        clearSelectedUsers();
      } else if (btn.id === "floating-btn-cancel") {
        toggleCompareMode();
      } else if (
        btn.id === "floating-btn-compare" &&
        window.selectedUsers.length >= 2
      ) {
        openCompareModal();
      }
    });
    document.body.appendChild(bar);
  }

  bar.style.display = "flex";

  const count = window.selectedUsers.length;

  // Static markup (no user-controlled data) is safe via innerHTML.
  bar.innerHTML = `
    <div class="selected-list"></div>
    <div class="actions">
      <button id="floating-btn-compare" class="btn-compare" ${count < 2 ? "disabled" : ""}>Compare</button>
      <button id="floating-btn-clear" class="btn-clear">Clear</button>
      <button id="floating-btn-cancel" class="btn-clear" style="color: var(--amber);">Cancel</button>
    </div>
  `;

  // Names are user-controlled, so build this part with safe DOM nodes
  // (textContent) instead of interpolating into innerHTML.
  const listDiv = bar.querySelector(".selected-list");
  listDiv.appendChild(document.createTextNode("Comparing ("));
  const tagSpan = document.createElement("span");
  tagSpan.className = "selected-tag";
  tagSpan.textContent = `${count}/3`;
  listDiv.appendChild(tagSpan);
  listDiv.appendChild(document.createTextNode("): "));
  window.selectedUsers.forEach((u, idx) => {
    listDiv.appendChild(document.createTextNode(u.name));
    if (idx < window.selectedUsers.length - 1) {
      listDiv.appendChild(document.createTextNode(", "));
    }
  });
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
 * Resilient user data fetcher that tries local origin, localhost:3000, and production endpoints
 */
async function fetchUserData(userId) {
  const origins = [];

  if (window.location.port !== "5500" && window.location.protocol !== "file:") {
    origins.push(window.location.origin);
  }
  origins.push("http://localhost:3000");
  origins.push("https://lc-backend-lyq2.onrender.com");

  let lastError = null;
  for (const origin of origins) {
    try {
      const url = `${origin}/api/user/${userId}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
      lastError = new Error(`HTTP ${res.status} from ${origin}`);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to fetch user data from all endpoints");
}

/**
 * Opens comparison overlay and fetches user history
 */
async function openCompareModal() {
  const modal = document.getElementById("compare-modal");
  const loading = document.getElementById("compare-loading");
  const errorEl = document.getElementById("compare-error");
  const results = document.getElementById("compare-results");

  if (!modal) return;

  currentGraphRange = window.activeDatasetType || "overall";
  updateDatasetButtons();
  updateModalTitle();

  modal.classList.add("active");
  loading.style.display = "block";
  errorEl.style.display = "none";
  results.style.display = "none";

  try {
    const fetchPromises = window.selectedUsers.map(async (user) => {
      return fetchUserData(user.id);
    });

    selectedUserData = await Promise.all(fetchPromises);
    console.log(
      "Successfully fetched compared users history:",
      selectedUserData,
    );

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

  const earliestTotal =
    (Number(earliest.easy) || 0) +
    (Number(earliest.medium) || 0) +
    (Number(earliest.hard) || 0);
  const latestTotal =
    (Number(latest.easy) || 0) +
    (Number(latest.medium) || 0) +
    (Number(latest.hard) || 0);
  const diffSolved = latestTotal - earliestTotal;

  const diffDays =
    Math.ceil(
      Math.abs(new Date(latest.date) - new Date(earliest.date)) /
        (1000 * 60 * 60 * 24),
    ) || 1;
  return (diffSolved / diffDays).toFixed(2);
}

/**
 * Renders metrics comparison side-by-side table
 */
function populateComparisonTable() {
  const table = document.getElementById("compare-table-el");
  if (!table) return;

  const dataset =
    window.leaderboardData && window.leaderboardData[currentGraphRange]
      ? window.leaderboardData[currentGraphRange]
      : [];

  const getUserData = (id) => {
    const found = dataset.find((u) => u.id === id);
    if (found) return found;
    return {
      data: { easySolved: 0, mediumSolved: 0, hardSolved: 0, totalSolved: 0 },
      score: 0,
      rankChange: "N/A",
    };
  };

  const getHistoryData = (id) => {
    const found = selectedUserData.find((sh) => sh.username === id);
    return found || {};
  };

  const headers = ["Metric", ...window.selectedUsers.map((u) => u.name)];

  // Rows data matrix
  const metrics = [
    {
      label: "LeetCode Username",
      values: window.selectedUsers.map((u) => `@${u.id}`),
    },
    {
      label: "Global Rank",
      values: window.selectedUsers.map(
        (u) => getHistoryData(u.id).ranking || "N/A",
      ),
    },
    {
      label: `${currentGraphRange.charAt(0).toUpperCase() + currentGraphRange.slice(1)} Rank Change`,
      values: window.selectedUsers.map(
        (u) => getUserData(u.id).rankChange || "N/A",
      ),
    },
    {
      label: "Score",
      values: window.selectedUsers.map((u) => getUserData(u.id).score || 0),
    },
    {
      label: "Total Solved",
      values: window.selectedUsers.map(
        (u) => getUserData(u.id).data.totalSolved || 0,
      ),
    },
    {
      label: "Easy Solved",
      values: window.selectedUsers.map(
        (u) => getUserData(u.id).data.easySolved || 0,
      ),
    },
    {
      label: "Medium Solved",
      values: window.selectedUsers.map(
        (u) => getUserData(u.id).data.mediumSolved || 0,
      ),
    },
    {
      label: "Hard Solved",
      values: window.selectedUsers.map(
        (u) => getUserData(u.id).data.hardSolved || 0,
      ),
    },
  ];

  if (currentGraphRange !== "daily") {
    metrics.push({
      label: "Grinding Velocity (Avg Daily)",
      values: window.selectedUsers.map((u) => {
        const sh = getHistoryData(u.id);
        let history = sh.history || [];
        if (currentGraphRange === "weekly") {
          const fd = new Date();
          fd.setDate(fd.getDate() - 7);
          history = history.filter((item) => new Date(item.date) >= fd);
        } else if (currentGraphRange === "monthly") {
          const fd = new Date();
          fd.setDate(fd.getDate() - 30);
          history = history.filter((item) => new Date(item.date) >= fd);
        }
        return `${calculateGrindingVelocity(history)} / day`;
      }),
    });
  }

  table.innerHTML = "";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    // Header may include user-controlled names (textContent only).
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  metrics.forEach((m) => {
    const row = document.createElement("tr");
    const labelCell = document.createElement("td");
    labelCell.textContent = m.label;
    row.appendChild(labelCell);
    m.values.forEach((v) => {
      const cell = document.createElement("td");
      cell.textContent = v;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
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

  const dataset =
    window.leaderboardData && window.leaderboardData[currentGraphRange]
      ? window.leaderboardData[currentGraphRange]
      : [];
  const getUserData = (id) => {
    const found = dataset.find((u) => u.id === id);
    return found
      ? found.data
      : { easySolved: 0, mediumSolved: 0, hardSolved: 0 };
  };

  const labels = window.selectedUsers.map((u) => u.name);
  const easyData = window.selectedUsers.map(
    (u) => Number(getUserData(u.id).easySolved) || 0,
  );
  const mediumData = window.selectedUsers.map(
    (u) => Number(getUserData(u.id).mediumSolved) || 0,
  );
  const hardData = window.selectedUsers.map(
    (u) => Number(getUserData(u.id).hardSolved) || 0,
  );

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
    progressChartInstance = null;
  }

  const parent = canvas.parentElement;
  let fallback = document.getElementById("compareDailyFallback");
  if (fallback) fallback.remove();

  if (currentGraphRange === "daily") {
    canvas.style.display = "none";
    const msg = document.createElement("div");
    msg.id = "compareDailyFallback";
    msg.style.cssText =
      "color: var(--text-dim); text-align: center; margin-top: 2rem; font-family: 'Fira Code', monospace; font-size: 0.9rem;";
    msg.innerText =
      "// No meaningful historical trend available for daily comparison.";
    parent.appendChild(msg);
    return;
  } else {
    canvas.style.display = "block";
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
  const filteredHistories = selectedUserData.map((sh) => {
    let history = sh.history || [];
    let baseTotal = 0;

    if (currentGraphRange !== "overall") {
      // Find the user's total precisely before the timeframe begins
      let preHistory = history.filter(
        (item) => new Date(item.date) < filterDate,
      );
      preHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
      if (preHistory.length > 0) {
        const pre = preHistory[preHistory.length - 1];
        baseTotal =
          (Number(pre.easy) || 0) +
          (Number(pre.medium) || 0) +
          (Number(pre.hard) || 0);
      } else if (history.length > 0) {
        // If there's no prehistory but they exist, use their earliest known record in the timeframe
        // to avoid spikes from '0 => total' when their real starting total isn't officially logged exactly before the range.
        const earliest = history.sort(
          (a, b) => new Date(a.date) - new Date(b.date),
        )[0];
        baseTotal =
          (Number(earliest.easy) || 0) +
          (Number(earliest.medium) || 0) +
          (Number(earliest.hard) || 0);
      }

      history = history.filter((item) => new Date(item.date) >= filterDate);
    }
    // Make sure it's sorted chronologically
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    return { username: sh.username, history, baseTotal };
  });

  const allDatesSet = new Set();
  filteredHistories.forEach((fh) => {
    fh.history.forEach((h) => allDatesSet.add(h.date));
  });
  const sortedDates = Array.from(allDatesSet).sort(
    (a, b) => new Date(a) - new Date(b),
  );

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
    let lastKnownTotal = fh.baseTotal || 0; // Initialize at their starting baseline
    const dateValuesMap = new Map();

    fh.history.forEach((item) => {
      const total =
        (Number(item.easy) || 0) +
        (Number(item.medium) || 0) +
        (Number(item.hard) || 0);
      dateValuesMap.set(item.date, total);
    });

    const dataPoints = sortedDates.map((date) => {
      if (dateValuesMap.has(date)) {
        lastKnownTotal = dateValuesMap.get(date);
      }

      // For filtered views, we subtract the baseline so they all begin near 0
      if (currentGraphRange !== "overall") {
        return Math.max(0, lastKnownTotal - fh.baseTotal);
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
          title: {
            display: true,
            text: "Timeline",
            color: "#5a8a5a",
            font: { family: "Fira Code", size: 10 },
          },
          grid: { color: "rgba(0, 255, 65, 0.1)" },
          ticks: {
            color: "#5a8a5a",
            font: { family: "Fira Code", size: 9 },
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          title: {
            display: true,
            text:
              currentGraphRange === "overall"
                ? "Total Solved"
                : `Total Solved (+/-) ${currentGraphRange}`,
            color: "#5a8a5a",
            font: { family: "Fira Code", size: 10 },
          },
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
