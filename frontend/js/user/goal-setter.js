(function () {
  function getUsername() {
    return window.location.pathname.split("/").filter(Boolean).pop() || "";
  }

  function storageKey(username) {
    return "goal_" + username.toLowerCase();
  }

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function loadGoal(username) {
    try {
      const raw = localStorage.getItem(storageKey(username));
      if (!raw) return null;
      const goal = JSON.parse(raw);
      const monday = getMonday(new Date()).getTime();
      if (!goal.weekStart || goal.weekStart < monday) {
        goal.weekStart = monday;
        goal.baseCount = null;
        localStorage.setItem(storageKey(username), JSON.stringify(goal));
      }
      return goal;
    } catch {
      return null;
    }
  }

  function saveGoal(username, metric, target) {
    const goal = {
      metric,
      target: parseInt(target, 10),
      weekStart: getMonday(new Date()).getTime(),
      baseCount: null,
    };
    localStorage.setItem(storageKey(username), JSON.stringify(goal));
    return goal;
  }

  function deleteGoal(username) {
    localStorage.removeItem(storageKey(username));
  }

  function renderBar(current, target) {
    const BAR = 20;
    const pct = Math.min(Math.floor((current / target) * 100), 100);
    const filled = Math.min(Math.floor((current / target) * BAR), BAR);
    const empty = BAR - filled;
    let bar;
    if (filled >= BAR) {
      bar = "=".repeat(BAR);
    } else {
      bar = "=".repeat(filled) + ">" + ".".repeat(empty - 1);
    }
    return "[" + bar + "] " + pct + "%";
  }

  const CELEBRATIONS = [
    ">> TARGET_REACHED :: WEEK_COMPLETE",
    ">> GOAL_MET :: COMMIT_LOGGED",
    ">> WEEKLY_TARGET :: ACHIEVED",
  ];

  function init() {
    const username = getUsername();
    if (!username) return;

    const elDisplay = document.getElementById("goal-display");
    const elSetter = document.getElementById("goal-setter");
    const elBar = document.getElementById("goal-bar");
    const elLabel = document.getElementById("goal-label");
    const elCount = document.getElementById("goal-count");
    const elCelebration = document.getElementById("goal-celebration");
    const elCelebrateText = document.getElementById("celebrate-text");
    const elReset = document.getElementById("btn-reset-goal");
    const elSaveBtn = document.getElementById("btn-save-goal");
    const elInput = document.getElementById("goal-target-input");
    const elMetric = document.getElementById("goal-metric");

    function showProgress(goal, solvedCount) {
      if (goal.baseCount === null || goal.baseCount === undefined) {
        goal.baseCount = solvedCount;
        localStorage.setItem(storageKey(username), JSON.stringify(goal));
      }
      const progress = Math.max(0, solvedCount - goal.baseCount);

      elLabel.textContent =
        "TARGET: " + goal.target + " " + goal.metric.toUpperCase() + " / WEEK";
      elBar.textContent = renderBar(progress, goal.target);
      elCount.textContent =
        progress + " / " + goal.target + " solved this week";

      if (progress >= goal.target) {
        elCelebration.style.display = "block";
        elCelebrateText.textContent =
          CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
        elBar.style.color = "var(--gold)";
      } else {
        elCelebration.style.display = "none";
        elBar.style.color = "var(--green)";
      }

      elDisplay.style.display = "block";
      elSetter.style.display = "none";
    }

    function showSetter() {
      elDisplay.style.display = "none";
      elSetter.style.display = "block";
    }

    async function fetchSolvedCount(metric) {
      try {
        const res = await fetch("/api/user/" + username);
        if (!res.ok) return 0;
        const data = await res.json();
        var history = data.history;
        if (!Array.isArray(history) || history.length === 0) return 0;
        var latest = history[history.length - 1];
        if (metric === "easy") return Number(latest.easy) || 0;
        if (metric === "medium") return Number(latest.medium) || 0;
        if (metric === "hard") return Number(latest.hard) || 0;
        return (
          (Number(latest.easy) || 0) +
          (Number(latest.medium) || 0) +
          (Number(latest.hard) || 0)
        );
      } catch {
        return 0;
      }
    }

    async function render() {
      const goal = loadGoal(username);
      if (goal) {
        const solved = await fetchSolvedCount(goal.metric);
        showProgress(goal, solved);
      } else {
        showSetter();
      }
    }

    elSaveBtn.addEventListener("click", async function () {
      const metric = elMetric.value;
      const target = parseInt(elInput.value, 10);
      if (!target || target < 1) {
        elInput.style.borderColor = "#ff4c4c";
        return;
      }
      elInput.style.borderColor = "";
      const goal = saveGoal(username, metric, target);
      const solved = await fetchSolvedCount(metric);
      showProgress(goal, solved);
    });

    elReset.addEventListener("click", function () {
      deleteGoal(username);
      elInput.value = "";
      showSetter();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
