async function showSyncToast() {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/changes.json?t=${Date.now()}`,
    );
    if (!res.ok) return;
    const changes = await res.json();

    // Remove any existing toast
    const existing = document.getElementById("sync-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "sync-toast";
    toast.style.cssText = `
      position: fixed;
      top: 70px;
      right: 0px;
      left: auto;
      min-width: min(300px, 85vw);
      max-width: min(480px, 90vw);
      background: var(--bg-secondary, #0d0d0d);
      border: 1px solid var(--green, #00ff41);
      color: var(--green, #00ff41);
      font-family: 'Fira Code', monospace;
      font-size: 0.75rem;
      padding: 14px 18px;
      z-index: 9999;
      
      box-shadow: 0 0 16px rgba(0, 255, 65, 0.2);
      line-height: 1.6;
    `;

    const lines = [];
    lines.push(`[SYNC_COMPLETE]`);
    lines.push(`─────────────────────────────`);

    if (changes.no_changes) {
      lines.push(`● No changes detected.`);
    } else {
      changes.rank_changes.forEach((rc) => {
        const arrow = rc.rank_delta > 0 ? "↑" : "↓";
        lines.push(
          `${arrow} ${rc.username} moved #${rc.old_rank} → #${rc.new_rank}`,
        );
      });
      if (changes.new_users.length > 0) {
        lines.push(`● ${changes.new_users.length} new user(s) joined`);
      }
      if (changes.total_new_solves > 0) {
        lines.push(
          `● ${changes.total_new_solves} new problems solved across ${changes.users_with_new_solves} users`,
        );
      }
    }

    lines.push(`─────────────────────────────`);

    lines.forEach((line) => {
      const p = document.createElement("div");
      p.textContent = line;
      toast.appendChild(p);
    });

    // Buttons row
    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex; gap:14px; margin-top:8px;";

    const dismiss = document.createElement("span");
    dismiss.textContent = "[dismiss]";
    dismiss.style.cssText = "cursor:pointer; text-decoration:underline;";
    dismiss.addEventListener("click", () => toast.remove());

    const view = document.createElement("span");
    view.textContent = "[view]";
    view.style.cssText = "cursor:pointer; text-decoration:underline;";
    view.addEventListener("click", () => {
      toast.remove();
      const target =
        document.querySelector(".mobile-cards") ||
        document.querySelector(".leaderboard");
      target?.scrollIntoView({ behavior: "smooth" });
    });

    btnRow.appendChild(dismiss);
    btnRow.appendChild(view);
    toast.appendChild(btnRow);

    document.body.appendChild(toast);

    // Auto-dismiss after 9 seconds
    setTimeout(() => {
      if (document.getElementById("sync-toast")) toast.remove();
    }, 9000);
  } catch (err) {
    console.error("sync-toast error:", err);
  }
}
