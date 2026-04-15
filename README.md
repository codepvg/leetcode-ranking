# CodePVG LeetCode Ranking

A web-based platform developed by [CodePVG](https://www.linkedin.com/company/codepvg/) to track and rank students of [PVG COET](https://www.pvgcoet.ac.in/) based on their LeetCode performance

It allows users to register with their LeetCode username and automatically fetches their problem-solving statistics to display on a leaderboard.

---

## Purpose

The goal of this project is to:

- Encourage consistent problem-solving among students  
- Create a competitive yet motivating environment  
- Provide visibility into individual coding progress  

---

This project relies on external services for fetching and processing LeetCode data. 
Instead of duplicating details here, refer to the following repositories:

- [leetcode-api](https://github.com/codepvg/leetcode-api) – API used to fetch user data from LeetCode
- [lc-backend](https://github.com/codepvg/lc-backend) – Backend service for storing and managing leaderboard data

These repositories handle the core data processing and integration logic for the leaderboard.

---

## Project Structure

```
leetcode-ranking/
│── frontend/        # UI (HTML, CSS, JS)
│── data/            # Stored user data
│── scripts/         # Automation scripts
│── server.js        # Express server
│── package.json
```

---

## How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/leetcode-ranking.git
cd leetcode-ranking
```

### 2. Install dependencies

`npm install`
 cd frontend
`npm install`

### 3. Run the project


`npm run dev`

or

node server.js

## Usage

1. Open the registration page  
2. Enter your name and LeetCode username  
3. Submit the form  
4. View your ranking on the leaderboard after 
   the next sync

---

## Contributing

Contributions are welcome.

- Fork the repository  
- Create a new branch  
- Make your changes  
- Submit a Pull Request  