export let rawPerformanceData = [];
export let difficultyChartInstance = null;
export let userDataArray = [];
export let performanceChartInstance = null;
export let currentView = "weekly";

export async function fetchUserData(username, data) {
  setupFilterButtons();
  processGraphData(data);
}

function processGraphData(data) {
  try {
    rawPerformanceData = data;
    userDataArray = rawPerformanceData.history || [];
    renderRankings(rawPerformanceData);
    updateChart();
  } catch (error) {
    console.log("error loading performance statistics: ", error);
  }
}

function setupFilterButtons() {
  const buttons = {
    weekly: document.getElementById("btn-weekly"),
    monthly: document.getElementById("btn-monthly"),
    overall: document.getElementById("btn-overall"),
  };
  Object.keys(buttons).forEach((view) => {
    if (buttons[view] && !buttons[view].dataset.bound) {
      buttons[view].dataset.bound = "true";
      buttons[view].addEventListener("click", () => {
        Object.values(buttons).forEach((btn) =>
          btn?.classList.remove("active"),
        );
        buttons[view].classList.add("active");

        currentView = view;
        updateChart();
      });
    }
  });
}

function renderRankings(data) {
  const profileRankingEl = document.getElementById("profile-ranking");
  if (!profileRankingEl) return;

  if (data && data.ranking) {
    profileRankingEl.textContent = Number(data.ranking).toLocaleString();
  } else {
    profileRankingEl.textContent = "--";
  }
}

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function updateChart() {
  if (!userDataArray || userDataArray.length === 0) {
    return;
  }

  const now = new Date();
  let filteredData = [];
  let baseEasy = 0,
    baseMedium = 0,
    baseHard = 0;
  let filterDate = null;

  if (currentView === "weekly") {
    filterDate = new Date();
    filterDate.setDate(now.getDate() - 7);
    filterDate.setHours(0, 0, 0, 0);
  } else if (currentView === "monthly") {
    filterDate = new Date();
    filterDate.setDate(now.getDate() - 30);
    filterDate.setHours(0, 0, 0, 0);
  }

  if (filterDate) {
    let preHistory = userDataArray.filter(
      (item) => parseLocalDate(item.date) < filterDate,
    );
    preHistory.sort((a, b) => a.date.localeCompare(b.date));
    if (preHistory.length > 0) {
      const pre = preHistory[preHistory.length - 1];
      baseEasy = Number(pre.easy) || 0;
      baseMedium = Number(pre.medium) || 0;
      baseHard = Number(pre.hard) || 0;
    } else if (userDataArray.length > 0) {
      const earliest = [...userDataArray].sort((a, b) =>
        a.date.localeCompare(b.date),
      )[0];
      baseEasy = Number(earliest.easy) || 0;
      baseMedium = Number(earliest.medium) || 0;
      baseHard = Number(earliest.hard) || 0;
    }
  }

  if (currentView !== "overall") {
    filteredData = userDataArray.filter(
      (item) => parseLocalDate(item.date) >= filterDate,
    );
  } else {
    filteredData = [...userDataArray];
  }

  if (filteredData.length === 0) {
    filteredData = [...userDataArray];
  }

  filteredData.sort((a, b) => a.date.localeCompare(b.date));

  const labels = filteredData.map((item) => item.date);
  const easyCounts = filteredData.map((item) =>
    currentView === "overall"
      ? Number(item.easy) || 0
      : Math.max(0, (Number(item.easy) || 0) - baseEasy),
  );
  const mediumCounts = filteredData.map((item) =>
    currentView === "overall"
      ? Number(item.medium) || 0
      : Math.max(0, (Number(item.medium) || 0) - baseMedium),
  );
  const hardCounts = filteredData.map((item) =>
    currentView === "overall"
      ? Number(item.hard) || 0
      : Math.max(0, (Number(item.hard) || 0) - baseHard),
  );

  renderChartCanvas(labels, easyCounts, mediumCounts, hardCounts);

  renderDifficultyChart(
    easyCounts[easyCounts.length - 1] || 0,
    mediumCounts[mediumCounts.length - 1] || 0,
    hardCounts[hardCounts.length - 1] || 0,
  );
}

function renderChartCanvas(labels, easy, medium, hard) {
  const canvas = document.getElementById("performanceChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (performanceChartInstance) {
    performanceChartInstance.destroy();
  }

  performanceChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Easy",
          data: easy,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.3,
          fill: true,
          spanGaps: true,
        },
        {
          label: "Medium",
          data: medium,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.3,
          fill: true,
          spanGaps: true,
        },
        {
          label: "Hard",
          data: hard,
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.3,
          fill: true,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#94a3b8",
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Timeline",
            color: "#94a3b8",
          },
          grid: {
            color: "#334155",
          },
          ticks: {
            color: "#94a3b8",
          },
        },
        y: {
          title: {
            display: true,
            text:
              currentView === "overall"
                ? "Total Solved"
                : `Total Solved (+/-) ${currentView}`,
            color: "#94a3b8",
          },
          beginAtZero: false,
          grid: {
            color: "#334155",
          },
          ticks: {
            color: "#94a3b8",
          },
        },
      },
    },
  });
}

function renderDifficultyChart(easy, medium, hard) {
  const canvas = document.getElementById("difficultyChart");
  if (!canvas) return;

  if (difficultyChartInstance) {
    difficultyChartInstance.destroy();
  }

  const e = Number(easy) || 0;
  const m = Number(medium) || 0;
  const h = Number(hard) || 0;

  difficultyChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [
        {
          data: e + m + h === 0 ? [1] : [e, m, h],
          backgroundColor:
            e + m + h === 0 ? ["#475569"] : ["#10b981", "#f59e0b", "#ef4444"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#94a3b8",
          },
        },
      },
    },
  });
}
