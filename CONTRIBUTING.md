# Contributing to CodePVG LeetCode Ranking

Thank you for your interest in contributing to CodePVG LeetCode Ranking.

## Getting Started

1. Fork the repository.
2. Clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/leetcode-ranking.git
cd leetcode-ranking
```

3. Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

## Development

Install dependencies:

```bash
npm install
# or
npm i
```

Run the project locally:

```bash
npm run dev
# or
node server.js
# or
npm start
```

## Before You Start

- Check whether an issue already exists for the change you want to make.
- If you would like to work on an existing issue, please request assignment.
- **Please do not start working on an issue or submit PRs until you are officially assigned.**
- Issues are generally assigned to the issue creator first. If they choose not to work on it, the issue will be assigned to other contributors in the order of their requests (first-come, first-served).

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
