document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("view-changes-btn");
  const modal = document.getElementById("changes-modal-overlay");
  const closeBtn = document.getElementById("close-changes-btn");
  const body = document.getElementById("changes-card-body");

  if (!btn || !modal || !closeBtn || !body) return;

  btn.addEventListener("click", () => {
    modal.classList.add("active");
    // Stop pulsing when they view it
    btn.classList.remove("pulse");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("active");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  async function loadChanges() {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/changes.json?t=${Date.now()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch changes");
      const changes = await res.json();
      renderChanges(changes);
    } catch (err) {
      console.error("sync-changes error:", err);
      body.innerHTML = `<div class="changes-content-line" style="color:var(--red);">[SYS_ERR]: Could not load recent changes.</div>`;
    }
  }

  function renderChanges(changes) {
    body.innerHTML = "";

    if (changes.no_changes) {
      body.innerHTML = `<div class="changes-content-line"><span style="color:var(--text-muted);">No changes detected in the most recent sync.</span></div>`;
      btn.classList.remove("pulse");
      return;
    }

    btn.classList.add("pulse");

    let html = "";
    if (changes.rank_changes) {
      changes.rank_changes.forEach((rc) => {
        const arrow = rc.rank_delta > 0 ? "↑" : "↓";
        const color = rc.rank_delta > 0 ? "var(--green)" : "var(--red)";
        html += `<div class="changes-content-line"><span style="color:${color}">${arrow}</span> <span><strong style="color:#fff;">${rc.username}</strong> moved #${rc.old_rank} → <strong style="color:var(--green)">#${rc.new_rank}</strong></span></div>`;
      });
    }

    if (changes.new_users && changes.new_users.length > 0) {
      html += `<div class="changes-content-line"><span style="color:#fff;">${changes.new_users.length} new user(s) joined</span></div>`;
    }

    if (changes.total_new_solves && changes.total_new_solves > 0) {
      html += `<div class="changes-content-line"><span style="color:#fff;">${changes.total_new_solves} new problems solved across ${changes.users_with_new_solves} users</span></div>`;
    }

    body.innerHTML = html;
  }

  loadChanges();

  // Expose function so leaderboard.html can trigger it when sync time changes
  window.showSyncToast = function () {
    loadChanges();
  };
});
