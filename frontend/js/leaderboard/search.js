function setupSearchListeners() {
  const searchInput = document.getElementById("leaderboard-search");
  const shortcutBadge = document.getElementById("search-shortcut");
  const clearBtn = document.getElementById("clear-search");

 function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  searchInput.addEventListener(
    "input",
    debounce((e) => {
      currentSearchTerm = e.target.value.toLowerCase().trim();

      clearBtn.style.display =
        e.target.value.trim() !== "" ? "flex" : "none";

      applyFiltersAndRender();
    }, 300)
  );

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
