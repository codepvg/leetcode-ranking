document.addEventListener("DOMContentLoaded", () => {
  const nav = document.createElement("nav");
  nav.className = "navbar";

  const currentPath = window.location.pathname;

  nav.innerHTML = `
    <div class="container">
      <a href="/" class="nav-brand">
        <img src="assets/logo.png" alt="CodePVG Logo" class="nav-logo" />
        <span class="nav-title">CODEPVG</span>
      </a>

      <button class="mobile-menu-btn" aria-label="Toggle Navigation">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path class="menu-icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          <path class="close-icon hidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>

      <ul class="nav-links">
        <li><a href="/" class="${currentPath === '/' || currentPath.includes('index.html') ? 'active' : ''}">home</a></li>
        <li><a href="/leaderboard" class="${currentPath.includes('leaderboard') ? 'active' : ''}">leaderboard</a></li>
        <li><a href="/registration" class="${currentPath.includes('registration') ? 'active' : ''}">register</a></li>
        <li><a href="/about" class="${currentPath.includes('about') ? 'active' : ''}">about</a></li>
        <li><a href="https://github.com/codepvg/" target="_blank" class="github-link">github</a></li>
      </ul>
    </div>
  `;

  document.body.prepend(nav);

  // Mobile menu toggle
  const mobileBtn = nav.querySelector('.mobile-menu-btn');
  const navLinks = nav.querySelector('.nav-links');
  const menuIcon = nav.querySelector('.menu-icon');
  const closeIcon = nav.querySelector('.close-icon');

  mobileBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
  });
});
