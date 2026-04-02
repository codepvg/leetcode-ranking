document.addEventListener("DOMContentLoaded", () => {

  if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
    return;
  }

  const footer = document.createElement("footer");
  footer.className = "footer";

  footer.innerHTML = `
    <div class="footer-container">

    <div class="footer-section brand">
        <div class="brand-row">
            <img src="assets/logo.png" alt="CodePVG Logo" class="footer-logo" />
            <div class="brand-text">
            <h2>CodePVG</h2>
            <p class="affiliation">Affiliated with PVG COET</p>
            </div>
        </div>
    </div>
      <div class="footer-section">
        <h3>Navigation</h3>
        <ul>
          <li><a href="/leaderboard">Leaderboard</a></li>
          <li><a href="/registration">Register</a></li>
          <li><a href="/about">About</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>Connect</h3>
        <ul>
          <li><a href="https://github.com/codepvg/" target="_blank">GitHub</a></li>
          <li><a href="https://www.linkedin.com/company/codepvg/" target="_blank">LinkedIn</a></li>
          <li><a href="https://www.youtube.com/@codepvg529" target="_blank">YouTube</a></li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom">
      <p>© 2026 CodePVG </p>
    </div>
  `;

  document.body.appendChild(footer);
});