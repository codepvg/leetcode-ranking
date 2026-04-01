document.addEventListener("DOMContentLoaded", () => {

  if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
    return;
  }

  const footer = document.createElement("footer");
  footer.className = "footer";

  footer.innerHTML = `
    <div class="footer-container">

      <!-- Brand -->
      <div class="footer-section">
        <h2>CodePVG</h2>
        <p>Track • Compete • Improve 🚀</p>
      </div>

      <!-- Navigation -->
      <div class="footer-section">
        <h3>Navigation</h3>
        <ul>
          <li><a href="leaderboard.html">Leaderboard</a></li>
          <li><a href="registration.html">Register</a></li>
          <li><a href="about.html">About</a></li>
        </ul>
      </div>

      <!-- Connect -->
      <div class="footer-section">
        <h3>Connect</h3>
        <ul>
          <li><a href="https://github.com/codepvg/" target="_blank">GitHub</a></li>
          <li><a href="https://www.linkedin.com/company/codepvg/" target="_blank">LinkedIn</a></li>
          <li><a href="https://www.youtube.com/@codepvg529" target="_blank">YouTube</a></li>
        </ul>
      </div>

      <!-- College -->
      <div class="footer-section">
        <h3>Our College</h3>
        <ul>
          <li><a href="https://www.pvgcoet.ac.in/" target="_blank">PVG COET</a></li>
        </ul>
      </div>

    </div>

    <!-- Bottom -->
    <div class="footer-bottom">
      <p>© 2026 CodePVG • </p>
    </div>
  `;

  document.body.appendChild(footer);
});