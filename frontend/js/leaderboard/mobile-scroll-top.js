const scrollTopBtn = document.getElementById("scrollTopBtn");

function toggleScrollButton() {
  if (window.innerWidth <= 768 && window.scrollY > 300) {
    scrollTopBtn.classList.add("show");
  } else {
    scrollTopBtn.classList.remove("show");
  }
}

window.addEventListener("scroll", toggleScrollButton);
window.addEventListener("resize", toggleScrollButton);

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Initial check
toggleScrollButton();