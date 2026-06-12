const btn = document.getElementById("scroll-top-btn");

if (btn) {
  const THRESHOLD = 300;

  window.addEventListener(
    "scroll",
    () => {
      btn.classList.toggle("visible", window.scrollY > THRESHOLD);
    },
    { passive: true },
  );

  btn.addEventListener("click", () => {
    document.body.classList.add("crt-scrolling");

    const duration = 500; // ms
    const startY = window.scrollY;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Add slight vertical jitter while scrolling up for CRT effect
      const jitter = progress < 1 ? Math.random() * 8 - 4 : 0;

      window.scrollTo(0, Math.max(0, startY * (1 - easeProgress) + jitter));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        document.body.classList.remove("crt-scrolling");
      }
    }

    requestAnimationFrame(step);
  });
}
