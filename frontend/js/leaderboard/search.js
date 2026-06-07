function setupSearchListeners() {
  const searchInput = document.getElementById("leaderboard-search");
  const shortcutBadge = document.getElementById("search-shortcut");
  const clearBtn = document.getElementById("clear-search");

  searchInput.addEventListener("input", (e) => {
    currentSearchTerm = e.target.value.toLowerCase().trim();

    clearBtn.style.display = e.target.value.trim() !== "" ? "flex" : "none";

    applyFiltersAndRender();
  });
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentSearchTerm = "";

    clearBtn.style.display = "none";

    searchInput.focus();
    applyFiltersAndRender();
  });

  searchInput.addEventListener("focus", () => {
    shortcutBadge.style.display = "none";
  });

  searchInput.addEventListener("blur", () => {
    if (!searchInput.value) {
      shortcutBadge.style.display = "inline-flex";
    }
  });

  // Ctrl+K / Cmd+K keyboard shortcut
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
    }
    if (e.key === "Escape" && document.activeElement === searchInput) {
      searchInput.value = "";
      currentSearchTerm = "";
      clearBtn.style.display = "none";
      searchInput.blur();
      applyFiltersAndRender();
    }
  });
}
