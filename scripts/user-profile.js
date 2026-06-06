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
  let labels = [];
  let easyCounts = [];
  let mediumCounts = [];
  let hardCounts = [];

  // 1. WEEKLY FILTER
  if (currentView === "weekly") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    let filteredData = studentHistoryArray.filter(
      (item) => new Date(item.date) >= sevenDaysAgo
    );
    
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    labels = filteredData.map((item) => item.date);
    easyCounts = filteredData.map((item) => item.easy || 0);
    mediumCounts = filteredData.map((item) => item.medium || 0);
    hardCounts = filteredData.map((item) => item.hard || 0);

  // 2. MONTHLY FILTER
  } else if (currentView === "monthly") {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    const pastYearData = studentHistoryArray.filter(
      (item) => new Date(item.date) >= twelveMonthsAgo
    );

    pastYearData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const monthlyGroups = {};

    pastYearData.forEach((item) => {
      const dateObj = new Date(item.date);
      const monthLabel = dateObj.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      monthlyGroups[monthLabel] = {
        easy: item.easy || 0,
        medium: item.medium || 0,
        hard: item.hard || 0
      };
    });

    const sortedMonths = Object.keys(monthlyGroups).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    labels = sortedMonths;
    easyCounts = sortedMonths.map((m) => monthlyGroups[m].easy);
    mediumCounts = sortedMonths.map((m) => monthlyGroups[m].medium);
    hardCounts = sortedMonths.map((m) => monthlyGroups[m].hard);
    
  // 3. OVERALL FILTER
  } else if (currentView === "overall") {
    let filteredData = [...studentHistoryArray];
    filteredData.sort((a, b) => new Date(a.date) - new Date(b.date));

    labels = filteredData.map((item) => item.date);
    easyCounts = filteredData.map((item) => item.easy || 0);
    mediumCounts = filteredData.map((item) => item.medium || 0);
    hardCounts = filteredData.map((item) => item.hard || 0);
  }

  // Render the line chart for the active view
  renderChartCanvas(labels, easyCounts, mediumCounts, hardCounts);

  // FIXED: Always render the doughnut chart using the latest active data entries!
  if (easyCounts.length > 0) {
    renderDifficultyChart(
      easyCounts[easyCounts.length - 1],
      mediumCounts[mediumCounts.length - 1],
      hardCounts[hardCounts.length - 1]
    );
  }
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
          borderColor: "#10b981", 
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Medium",
          data: medium,
          borderColor: "#f59e0b", 
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Hard",
          data: hard,
          borderColor: "#ef4444", 
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
          labels: { color: "#94a3b8" }, 
        },
      },
      scales: {
        x: {
          grid: { color: "#334155" }, 
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
  if (!canvas) return; // Prevent errors if canvas element missing from HTML

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