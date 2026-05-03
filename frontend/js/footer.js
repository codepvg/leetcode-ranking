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
          <h2>CODEPVG</h2>
        </div>

        <p class="footer-desc">
          // fostering competitive yet collaborative<br>
          // programming among PVG students.<br>
          // track progress, climb ranks, improve.
        </p>

        <p class="affiliation">
          affiliated: 
          <a href="https://www.pvgcoet.ac.in/" target="_blank">PVG COET</a>
        </p>
      </div>

      <div class="footer-section">
        <h3>navigation</h3>
        <ul>
          <li><a href="/leaderboard">leaderboard</a></li>
          <li><a href="/registration">register</a></li>
          <li><a href="/about">about</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>socials</h3>
        <ul>
          <li><a href="https://github.com/codepvg/" target="_blank">github</a></li>
          <li><a href="https://www.linkedin.com/company/codepvg/" target="_blank">linkedin</a></li>
          <li><a href="https://www.youtube.com/@codepvg529" target="_blank">youtube</a></li>
          <li><a href="https://chat.whatsapp.com/E5INVk1UJX6KL5oZK0wPAQ?mode=gi_t" target="_blank">whatsapp</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>contact</h3>
        <ul>
          <li><a href="mailto:codepvg@gmail.com" target="_blank">codepvg@gmail.com</a></li>
          <li><a href="https://api.whatsapp.com/send/?phone=%2B919284205842&text&type=phone_number&app_absent=0" target="_blank">quick_chat</a></li>
        </ul>
      </div>

    </div>

    <div class="footer-bottom" style="display: flex; flex-direction: column; gap: 6px;">
      <p>
        © 2026 CodePVG Programming Club
      </p>
      <p>
        developed && maintained by <a href="https://github.com/jagdish-15" target="_blank" class="footer-link">jagdish</a>
      </p>
    </div>
  `;

  document.body.appendChild(footer);
});
