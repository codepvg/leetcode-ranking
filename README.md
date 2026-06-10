# CodePVG LeetCode Ranking

A web-based platform developed by [[CodePVG](https://www.linkedin.com/company/codepvg/)](https://www.linkedin.com/company/codepvg/) to track, analyze, and rank students of [[PVG COET](https://www.pvgcoet.ac.in/)](https://www.pvgcoet.ac.in/) based on their LeetCode activity and problem-solving performance.

The platform allows students to register using their LeetCode username and automatically generates leaderboard rankings, historical progress tracking, and performance insights through periodic synchronization of LeetCode statistics.

---

## Table of Contents

- [Overview](#overview)
- [Purpose](#purpose)
- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [Related Repositories](#related-repositories)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [How to Run Locally](#how-to-run-locally)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [License](#license)

---

## Purpose

The goal of this project is to encourage consistent problem-solving among students by providing a centralized platform to track LeetCode activity and coding progress.

Through regularly updated leaderboards and historical performance tracking, the platform aims to create a competitive yet collaborative environment where students can monitor their growth, stay motivated, and improve their problem-solving skills over time.


---

- **LeetCode-based Student Registration**
  Students can register using their LeetCode username to participate in the leaderboard.
- **Automated Performance Tracking**
  The platform periodically fetches and updates user problem-solving statistics automatically.
- **Dynamic Multi-View Leaderboards**
  Supports overall, monthly, weekly, and daily leaderboard rankings.
- **Historical Progress Tracking**
  Tracks past performance and rank movement over time using historical leaderboard snapshots.
- **Terminal-inspired Responsive UI**
  A lightweight terminal-style interface designed to work across both desktop and mobile devices.
- **Search, Filtering, and Comparison Tools**
  Includes leaderboard search, filtering, and peer comparison features for easier performance analysis.
- **Decoupled Data Architecture**
  Frontend, backend, and leaderboard data storage are maintained independently for easier scalability and maintenance.
- **Automated Synchronization Workflows**
  GitHub Actions and sync scripts help keep leaderboard data updated without manual intervention.

---
  
## Screenshots

A quick preview of the platform UI. The appearance may evolve as the project develops.

### Home Page

![Home Page](assets/home-page.png)

### Registration Page

![Registration](assets/registration-page.png)

### Leaderboard

![Leaderboard](assets/leaderboard.png)

---

## Architecture

The project follows a decoupled structure where leaderboard generation, data storage, API handling, and frontend rendering are handled independently across multiple repositories and services.

### Components

* **Frontend (`frontend/`)**
  Handles the leaderboard UI, registration pages, comparison features, and client-side interactions. Leaderboard datasets are fetched directly from the `leetcode-ranking-data` repository.

* **Express Server (`server.js`)**
  Serves the frontend and exposes API endpoints for student-specific information, history tracking, and related backend functionality.

* **Sync Scripts (`scripts/`)**
  Periodically fetch and process LeetCode statistics to generate updated leaderboard datasets.

* **Data Repository (`leetcode-ranking-data`)**
  Stores generated leaderboard snapshots, historical statistics, and processed JSON data separately from the main application repository.

* **GitHub Actions (`.github/workflows/`)**
  Automates scheduled sync runs, formatting checks, stale issue management, and other repository workflows.

---

## Related Repositories

- [leetcode-ranking-data](https://github.com/codepvg/leetcode-ranking-data) – The database repository where raw JSON data and historical stats are stored
- [leetcode-api](https://github.com/codepvg/leetcode-api) – API used to fetch user data from LeetCode
- [lc-backend](https://github.com/codepvg/lc-backend) – Backend service for storing and managing leaderboard data
- [frontend-uptime-monitor](https://github.com/codepvg/frontend-uptime-monitor) – Pinger service to monitor frontend server uptime
- [backend-uptime-monitor](https://github.com/codepvg/backend-uptime-monitor) – Pinger service to monitor backend server uptime

---

## Project Structure

```
leetcode-ranking/
│── .github/        # GitHub Actions workflows
│── frontend/       # UI (HTML, CSS, JS) - Fetches data from leetcode-ranking-data
│── scripts/        # Automation scripts (sync-leaderboard.js)
│── server.js       # Express server
│── package.json
```

> [!NOTE]
> All leaderboard data is now decoupled and stored in the [leetcode-ranking-data](https://github.com/codepvg/leetcode-ranking-data) repository to prevent commit history bloat in this repo.

## Usage

The platform is publicly available at:

`https://codepvg.onrender.com`

- Students can register using their LeetCode username to participate in the leaderboard, track rankings across different leaderboard views, monitor historical performance, and compare progress with other users.

- Leaderboard data is synchronised periodically, so newly registered users and recent submissions may take a few minutes to appear in the rankings.

---

## How to Run Locally

```bash
git clone https://github.com/YOUR-USERNAME/leetcode-ranking.git
cd leetcode-ranking
npm install
npm run dev
```
Then open the frontend locally in your browser after starting the server.

For detailed development setup, sync workflow testing, contribution guidelines, and local data repository configuration, refer to `CONTRIBUTING.md`.

## Contributing

Contributions are welcome.

- Fork the repository
- Create a new branch
- Make your changes
- Submit a Pull Request

## Contributors

Thanks to all the amazing people who have contributed to this project 💙

<a href="https://github.com/codepvg/leetcode-ranking/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=codepvg/leetcode-ranking" />
</a>

---

## License

This project is licensed under the MIT License.

You are free to use, modify, and distribute this project with proper attribution.
