# Contributing to CodePVG LeetCode Ranking

Thank you for your interest in contributing to CodePVG LeetCode Ranking.

## Local Setup & Development

1. Fork the repository and clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/leetcode-ranking.git
cd leetcode-ranking
```

2. Create a new branch for your feature/fix:

```bash
git checkout -b feature/your-feature-name
```

3. Install dependencies:

```bash
npm install
```

4. Start the local server:

```bash
npm run dev
```

### Testing the Sync Script Locally

The leaderboard data (such as `users.json` and historical stats) lives in a separate data repository to keep the main codebase clean. To test the `scripts/sync-leaderboard.js` script locally:

1. Clone the data repository into a folder named `data` inside the project root (this folder is already ignored in `.gitignore`, so you never have to worry about accidentally pushing local data changes back to the main repository):

```bash
git clone https://github.com/codepvg/leetcode-ranking-data.git data
```

2. Run the synchronization script. It will automatically detect your local `data` folder and pull stats from the LeetCode API based on the users inside `data/users.json`:

```bash
node scripts/sync-leaderboard.js
```

3. Once it finishes, you can preview the newly generated `overall.json`, `daily.json`, `weekly.json`, and `monthly.json` files inside the `data` folder to verify your script changes.

_(Note: To prevent GitHub API rate limits when the script fetches historical commit data, you can optionally set a Personal Access Token via the `DATA_REPO_TOKEN` environment variable.)_

### Project Structure Overview

Familiarize yourself with the core directories:

- **`frontend/`**: Contains all static assets, HTML, CSS, and client-side JS controlling the UI.
- **`scripts/`**: Contains automation logic (e.g., `sync-leaderboard.js`) used to fetch updates from the LeetCode API.
- **`.github/workflows/`**: CI/CD GitHub Actions driving data synchronization and code formatting.
- **`server.js`**: The Express server delivering the frontend files and configuring important security headers.

## Before You Start

- Check whether an issue already exists for the change you want to make.
- If you would like to work on an existing issue, please request assignment.
- **Please do not start working on an issue or submit PRs until you are officially assigned.**

### Issue Assignment Policy

- The issue creator is given the first priority to work on their issue.
- If the creator declines or does not request assignment, the issue will be assigned to others in the order of requests received (first-come, first-served).

> **Note:** This project is currently maintained by a solo maintainer, so reviews, assignments, and responses may sometimes take a little time. Thanks for your patience.

## Pull Requests

When submitting a PR:

- Link the relevant issue.
- Clearly describe the changes made.
- Include screenshots or a screen recording for UI changes.
- Test your changes before submitting.
- Test frontend changes on both desktop and mobile viewports where applicable.
- Ensure there are no console errors.
- Keep your changes focused on the issue being addressed.
- Avoid making unrelated modifications to files outside the scope of your contribution.
- Run the Prettier code formatter locally before pushing to pass the automated formatting checks.

### Code Formatting

We use Prettier to enforce consistent code style across the project. Our automated GitHub Action check will fail if unformatted code is pushed to a PR.

Before submitting your Pull Request, please run the following command in the root of the repository to automatically format all your changes:

```bash
npx prettier --write .
```

For security reasons, the `/format` PR comment command can only be triggered by maintainers/collaborators — if you're an external contributor, please run Prettier locally as shown above before requesting a review.

### Frontend Changes

Please keep the existing terminal-inspired design language of the platform in mind when making UI changes.

For easier review:

- Test responsive behaviour on smaller screen sizes where applicable.
- Ensure any new UI elements are consistent with the existing design language.

## Keeping Your Branch Updated

If your branch falls behind `main`, please sync it and resolve any conflicts before requesting review.

## Questions

If you are unsure about an implementation or feature proposal, feel free to ask in the issue before starting work.

Thank you for helping improve CodePVG LeetCode Ranking.
