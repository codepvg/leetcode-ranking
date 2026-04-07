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
          <h2>CodePVG</h2>
        </div>

        <p class="footer-desc">
          Fostering a competitive yet collaborative programming environment among PVG students.<br>Track progress, climb ranks, and improve together.
        </p>

        <p class="affiliation">
          Affiliated with 
          <a href="https://www.pvgcoet.ac.in/" target="_blank">PVG COET</a>
        </p>
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
        <h3>Community & Socials</h3>
        <ul>
          <li><a href="https://github.com/codepvg/" target="_blank">GitHub</a></li>
          <li><a href="https://www.linkedin.com/company/codepvg/" target="_blank">LinkedIn</a></li>
          <li><a href="https://www.youtube.com/@codepvg529" target="_blank">YouTube</a></li>
          <li><a href="https://chat.whatsapp.com/E5INVk1UJX6KL5oZK0wPAQ?mode=gi_t" target="_blank">WhatsApp Community</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>Contact Us</h3>
        <ul>
          <li><a href="mailto:codepvg@gmail.com" target="_blank">codepvg@gmail.com</a></li>
          <li><a href="https://api.whatsapp.com/send/?phone=%2B919284205842&text&type=phone_number&app_absent=0" target="_blank">Quick Chat (WhatsApp)</a></li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom" style="display: flex; flex-direction: column; gap: 8px;">
      <p>
        © 2026 CodePVG Programming Club
      </p>
      <p>
        Project Developed & Maintained by <a href="https://github.com/jagdish-15" target="_blank" class="footer-link">Jagdish</a>
      </p>
    </div>
  `;

  document.body.appendChild(footer);
});
