let rawPerformanceData = [];
let difficultyChartInstance = null;
let studentHistoryArray = [];
let performanceChartInstance = null;

let currentView = "weekly";

document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split("/");
  const currentUsername = pathSegments[pathSegments.length - 1];

  const usernameHeading = document.getElementById("username-display");
  if (usernameHeading) {
    usernameHeading.innerText = `Performance Profile: @${currentUsername}`;
  }
  setupFilterButtons();
  fetchStudentData(currentUsername);
});

async function fetchStudentData(username) {
  try {
    const apiUrl = `${window.location.origin}/api/student/${username}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    rawPerformanceData = await response.json();
    studentHistoryArray = rawPerformanceData.history || [];
    console.log("Successfully fetched student data:", studentHistoryArray);
    updateChart();
  } catch (error) {
    console.log("error loading performance statics: ", error);
  }
}

function setupFilterButtons() {
  const buttons = {
    weekly: document.getElementById("btn-weekly"),
    monthly: document.getElementById("btn-monthly"),
    overall: document.getElementById("btn-overall"),
  };
  Object.keys(buttons).forEach((view) => {
    if (buttons[view]) {
      buttons[view].addEventListener("click", () => {
        currentView = view;
        updateChart();
      });
    }
  });
}

function updateChart() {
  // If there's no history data, stop execution
  if (!studentHistoryArray || studentHistoryArray.length === 0) {
    console.log("No history data found to filter.");
    return;
  }

  const now = new Date();
  let filteredData = [...studentHistoryArray]; // Copy the array

  // Filter calculations based on dates
  if (currentView === "weekly") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    filteredData = studentHistoryArray.filter(
      (item) => new Date(item.date) >= sevenDaysAgo,
    );
  } else if (currentView === "monthly") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    filteredData = studentHistoryArray.filter(
      (item) => new Date(item.date) >= thirtyDaysAgo,
    );
  }

  // Sort dates chronologically (oldest to newest)
  filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = filteredData.map((item) =>
    new Date(item.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
  );
  const easyCounts = filteredData.map((item) => item.easy || 0);
  const mediumCounts = filteredData.map((item) => item.medium || 0);
  const hardCounts = filteredData.map((item) => item.hard || 0);

  console.log("Filtered Data for Chart:", {
    labels,
    easyCounts,
    mediumCounts,
    hardCounts,
  });

  // Call the rendering engine (We will write this next)
  renderChartCanvas(labels, easyCounts, mediumCounts, hardCounts);
  renderDifficultyChart(
    easyCounts[easyCounts.length - 1],
    mediumCounts[mediumCounts.length - 1],
    hardCounts[hardCounts.length - 1],
  );
}

function renderChartCanvas(labels, easy, medium, hard) {
  const ctx = document.getElementById("performanceChart").getContext("2d");

  if (performanceChartInstance) {
    performanceChartInstance.destroy();
  }

  performanceChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Easy",
          data: easy,
          borderColor: "#10b981", // Emerald green
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Medium",
          data: medium,
          borderColor: "#f59e0b", // Amber orange
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Hard",
          data: hard,
          borderColor: "#ef4444", // Crimson red
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#94a3b8" }, // Muted gray text
        },
      },
      scales: {
        x: {
          grid: { color: "#334155" }, // Slate borders
          ticks: { color: "#94a3b8" },
        },
        y: {
          grid: { color: "#334155" },
          ticks: { color: "#94a3b8" },
          beginAtZero: false,
        },
      },
    },
  });
}

function renderDifficultyChart(easy, medium, hard) {
  const canvas = document.getElementById("difficultyChart");

  if (difficultyChartInstance) {
    difficultyChartInstance.destroy();
  }

  difficultyChartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Easy", "Medium", "Hard"],
      datasets: [
        {
          data: [easy, medium, hard],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
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
