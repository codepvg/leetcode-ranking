function setupPaginationListeners() {
  document.getElementById("prev-page-btn")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  document.getElementById("next-page-btn")?.addEventListener("click", () => {
    const totalPages = Math.ceil(
      leaderboardData[activeDatasetType].length / itemsPerPage,
    );

    if (currentPage < totalPages) {
      currentPage++;
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

function renderPagination(totalItems) {
  const pageNumbers = document.getElementById("page-numbers");

  if (!pageNumbers) return;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  pageNumbers.innerHTML = "";

  if (totalPages === 0) return;

  function createPageBtn(i) {
    const btn = document.createElement("button");
    btn.classList.add("page-btn");
    btn.textContent = i;

    if (i === currentPage) {
      btn.classList.add("active-page");
    }

    btn.onclick = () => {
      currentPage = i;
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return btn;
  }

  const pagesToRender = [];
  const range = 1; // Number of pages to show around the current page

  pagesToRender.push(1);

  if (currentPage - range > 2) {
    pagesToRender.push("..");
  }

  for (
    let i = Math.max(2, currentPage - range);
    i <= Math.min(totalPages - 1, currentPage + range);
    i++
  ) {
    pagesToRender.push(i);
  }

  if (currentPage + range < totalPages - 1) {
    pagesToRender.push("..");
  }

  if (totalPages > 1) {
    pagesToRender.push(totalPages);
  }

  pagesToRender.forEach((item) => {
    if (item === "..") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-ellipsis";
      ellipsis.textContent = "..";
      pageNumbers.appendChild(ellipsis);
    } else {
      pageNumbers.appendChild(createPageBtn(item));
    }
  });
}
