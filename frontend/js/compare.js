// --- Leaderboard Comparison Feature JS ---

let selectedStudents = new Set();
let isCompareMode = false;
let diffChartInstance = null;
let historyChartInstance = null;

// Colors for comparison
const COMPARE_COLORS = {
  0: { border: '#00ff41', background: 'rgba(0, 255, 65, 0.25)', label: 'USER_A' },
  1: { border: '#00e5ff', background: 'rgba(0, 229, 255, 0.25)', label: 'USER_B' },
  2: { border: '#ffb000', background: 'rgba(255, 176, 0, 0.25)', label: 'USER_C' }
};

// Global hooks to inject into the rendering loop
function initCompareMode() {
  // Bind compare mode toggle
  const toggleBtn = document.getElementById('compare-mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isCompareMode = !isCompareMode;
      if (isCompareMode) {
        toggleBtn.classList.add('active');
        toggleBtn.innerText = 'COMPARE_MODE [ON]';
        document.querySelector('.leaderboard')?.classList.add('compare-active');
      } else {
        toggleBtn.classList.remove('active');
        toggleBtn.innerText = 'COMPARE_MODE [OFF]';
        document.querySelector('.leaderboard')?.classList.remove('compare-active');
        selectedStudents.clear();
        updateFloatingBar();
      }
      applyFiltersAndRender();
    });
  }

  // Create Floating Action Bar
  createFloatingBar();

  // Create Modal Structure
  createCompareModal();
}

function createFloatingBar() {
  if (document.getElementById('compare-floating-bar')) return;

  const bar = document.createElement('div');
  bar.id = 'compare-floating-bar';
  bar.className = 'compare-floating-bar';
  bar.innerHTML = `
    <div class="compare-info" id="compare-bar-info">[SYS_LOAD]: 0/3 PEERS SELECTED</div>
    <button class="compare-btn" id="compare-submit-btn">COMPARE &gt;</button>
  `;
  document.body.appendChild(bar);

  document.getElementById('compare-submit-btn')?.addEventListener('click', () => {
    if (selectedStudents.size >= 2 && selectedStudents.size <= 3) {
      openCompareModal();
    }
  });
}

function createCompareModal() {
  if (document.getElementById('compare-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'compare-modal-overlay';
  overlay.className = 'compare-modal-overlay';
  overlay.innerHTML = `
    <div class="compare-modal">
      <div class="compare-modal-header">
        <div class="compare-modal-title">[SYS_EXEC]: COMPILING PEER METRICS</div>
        <button class="compare-modal-close" id="compare-modal-close-btn">[X]</button>
      </div>
      <div class="compare-modal-body" id="compare-modal-content">
        <!-- Content will be injected dynamically -->
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('compare-modal-close-btn')?.addEventListener('click', closeCompareModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCompareModal();
  });
}

function updateFloatingBar() {
  const bar = document.getElementById('compare-floating-bar');
  const info = document.getElementById('compare-bar-info');
  if (!bar || !info) return;

  const count = selectedStudents.size;
  info.innerText = `[SYS_LOAD]: ${count}/3 PEERS SELECTED`;

  if (count >= 2 && count <= 3) {
    bar.classList.add('show');
  } else {
    bar.classList.remove('show');
  }
}

function handleSelectCheckbox(username, checked) {
  if (checked) {
    if (selectedStudents.size >= 3) {
      alert('[SYS_WARN]: MAXIMUM LIMIT EXCEEDED (MAX 3 USERS FOR COMPARISON)');
      return false; // prevent checking
    }
    selectedStudents.add(username);
  } else {
    selectedStudents.delete(username);
  }
  updateFloatingBar();
  return true;
}

// Fetch stats and render modal
async function openCompareModal() {
  const overlay = document.getElementById('compare-modal-overlay');
  const content = document.getElementById('compare-modal-content');
  if (!overlay || !content) return;

  overlay.classList.add('show');
  content.innerHTML = `
    <div class="no-results" style="padding: 3rem 1rem;">
      <div style="font-size: 1.2rem; margin-bottom: 1rem; color: var(--green); text-shadow: 0 0 8px rgba(0, 255, 65, 0.4);">
        [SYS_CONN]: INITIALIZING UPLINK AND PARSING ARCHIVES...
      </div>
      <div class="exec-log-line wait">Retrieving student metadata logs...</div>
    </div>
  `;

  const usernames = Array.from(selectedStudents);
  
  // Find current data of selected users from leaderboardData
  const activeData = leaderboardData[activeDatasetType] || [];
  const selectedUserData = usernames.map(username => activeData.find(u => u.id === username)).filter(Boolean);

  try {
    // Concurrently fetch histories from the API endpoint
    const historyPromises = usernames.map(username => 
      fetch(`/api/student/${username}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .catch(err => {
          console.error(`Failed to fetch history for ${username}`, err);
          return { username, history: [] };
        })
    );

    const historyResults = await Promise.all(historyPromises);

    // Build side-by-side comparison table HTML
    let tableHtml = `
      <table class="compare-table">
        <thead>
          <tr>
            <th>Metric</th>
    `;

    selectedUserData.forEach((user, index) => {
      const colorInfo = COMPARE_COLORS[index];
      tableHtml += `<th style="color: ${colorInfo.border}; text-shadow: 0 0 5px ${colorInfo.border};">${user.name} (${user.id})</th>`;
    });

    tableHtml += `
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Overall Rank</td>
    `;
    selectedUserData.forEach(user => {
      tableHtml += `<td>#${user.originalRank || '-'}</td>`;
    });

    tableHtml += `
          </tr>
          <tr>
            <td>Total Score</td>
    `;
    selectedUserData.forEach(user => {
      tableHtml += `<td><strong>${user.score}</strong></td>`;
    });

    tableHtml += `
          </tr>
          <tr class="easy">
            <td>Easy Solved</td>
    `;
    selectedUserData.forEach(user => {
      tableHtml += `<td>${user.data.easySolved}</td>`;
    });

    tableHtml += `
          </tr>
          <tr class="medium">
            <td>Medium Solved</td>
    `;
    selectedUserData.forEach(user => {
      tableHtml += `<td>${user.data.mediumSolved}</td>`;
    });

    tableHtml += `
          </tr>
          <tr class="hard">
            <td>Hard Solved</td>
    `;
    selectedUserData.forEach(user => {
      tableHtml += `<td>${user.data.hardSolved}</td>`;
    });

    tableHtml += `
          </tr>
          <tr>
            <td>Average Cumulative Solves</td>
    `;
    selectedUserData.forEach((user, index) => {
      const history = historyResults[index]?.history || [];
      const totalDays = history.length;
      if (totalDays > 0) {
        const sum = history.reduce((acc, curr) => acc + (curr.easy + curr.medium + curr.hard), 0);
        const avg = (sum / totalDays).toFixed(1);
        tableHtml += `<td>${avg} / day</td>`;
      } else {
        tableHtml += `<td>-</td>`;
      }
    });

    tableHtml += `
          </tr>
        </tbody>
      </table>
    `;

    // Inject charts container
    content.innerHTML = `
      ${tableHtml}
      <div class="compare-charts-grid">
        <div class="chart-card">
          <div class="chart-title">Difficulty Breakdown</div>
          <div class="chart-container">
            <canvas id="compare-diff-canvas"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-title">Grinding Velocity (Cumulative History)</div>
          <div class="chart-container">
            <canvas id="compare-history-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    // Render Charts using Chart.js
    renderComparisonCharts(selectedUserData, historyResults);

  } catch (err) {
    content.innerHTML = `
      <div class="no-results" style="color: var(--red); padding: 3rem 1rem;">
        [SYS_ERROR]: PIPELINE_FAILED_TO_RENDER_COMPARISON
        <br>
        <span style="font-size: 0.8rem; opacity: 0.8;">${err.message}</span>
      </div>
    `;
  }
}

function closeCompareModal() {
  const overlay = document.getElementById('compare-modal-overlay');
  if (overlay) overlay.classList.remove('show');
  
  // Destroy chart instances to release memory
  if (diffChartInstance) {
    diffChartInstance.destroy();
    diffChartInstance = null;
  }
  if (historyChartInstance) {
    historyChartInstance.destroy();
    historyChartInstance = null;
  }
}

function renderComparisonCharts(users, historyResults) {
  // Chart.js Global Font Config
  Chart.defaults.font.family = "'Fira Code', 'Courier New', monospace";
  Chart.defaults.font.size = 11;
  Chart.defaults.color = '#5a8a5a'; // --text-dim

  // 1. Difficulty Breakdown (Bar Chart)
  const diffCtx = document.getElementById('compare-diff-canvas')?.getContext('2d');
  if (diffCtx) {
    const datasets = users.map((user, index) => {
      const colors = COMPARE_COLORS[index];
      return {
        label: user.name,
        data: [user.data.easySolved, user.data.mediumSolved, user.data.hardSolved],
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        barPercentage: 0.6,
        categoryPercentage: 0.8
      };
    });

    diffChartInstance = new Chart(diffCtx, {
      type: 'bar',
      data: {
        labels: ['Easy', 'Medium', 'Hard'],
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(0, 255, 65, 0.08)' },
            ticks: { color: '#5a8a5a' }
          },
          y: {
            grid: { color: 'rgba(0, 255, 65, 0.08)' },
            ticks: { color: '#5a8a5a', stepSize: 20 },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            labels: { color: '#b0ffb0' }
          },
          tooltip: {
            backgroundColor: '#0a0a0a',
            titleColor: '#00ff41',
            bodyColor: '#b0ffb0',
            borderColor: 'rgba(0, 255, 65, 0.3)',
            borderWidth: 1,
            cornerRadius: 0
          }
        }
      }
    });
  }

  // 2. Grinding Velocity Cumulative History (Line Chart)
  const historyCtx = document.getElementById('compare-history-canvas')?.getContext('2d');
  if (historyCtx) {
    // We want to combine dates. Let's find all unique dates across all user histories
    const allDatesSet = new Set();
    historyResults.forEach(res => {
      res.history.forEach(day => allDatesSet.add(day.date));
    });

    // Convert to sorted array
    const sortedDates = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

    // Map datasets
    const datasets = users.map((user, index) => {
      const colors = COMPARE_COLORS[index];
      const history = historyResults[index]?.history || [];

      // Fill in data points matching each sorted date
      const dataPoints = sortedDates.map(date => {
        // Find entry for date, or fallback to previous cumulative solves
        const entry = history.find(day => day.date === date);
        if (entry) {
          return entry.easy + entry.medium + entry.hard;
        }
        // If not found, let's find the closest previous date solves
        const previousEntries = history.filter(day => new Date(day.date) < new Date(date));
        if (previousEntries.length > 0) {
          // Sort descending and get the first (latest before date)
          previousEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
          return previousEntries[0].easy + previousEntries[0].medium + previousEntries[0].hard;
        }
        return 0; // default start
      });

      return {
        label: user.name,
        data: dataPoints,
        borderColor: colors.border,
        backgroundColor: colors.background,
        borderWidth: 2,
        tension: 0.1,
        pointBackgroundColor: colors.border,
        pointBorderColor: '#0a0a0a',
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });

    // Format dates to MMM DD for terminal labels
    const formattedLabels = sortedDates.map(dateStr => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
    });

    historyChartInstance = new Chart(historyCtx, {
      type: 'line',
      data: {
        labels: formattedLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(0, 255, 65, 0.08)' },
            ticks: { color: '#5a8a5a', maxRotation: 45, minRotation: 45 }
          },
          y: {
            grid: { color: 'rgba(0, 255, 65, 0.08)' },
            ticks: { color: '#5a8a5a' },
            beginAtZero: true
          }
        },
        plugins: {
          legend: {
            labels: { color: '#b0ffb0' }
          },
          tooltip: {
            backgroundColor: '#0a0a0a',
            titleColor: '#00ff41',
            bodyColor: '#b0ffb0',
            borderColor: 'rgba(0, 255, 65, 0.3)',
            borderWidth: 1,
            cornerRadius: 0
          }
        }
      }
    });
  }
}
