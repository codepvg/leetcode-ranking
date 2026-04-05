# CodePVG LeetCode Ranking

A web-based platform developed for CodePVG to track and rank students based on their LeetCode performance.  
It allows users to register with their LeetCode username and automatically fetches their problem-solving statistics to display on a leaderboard.

---

## Purpose

The goal of this project is to:

- Encourage consistent problem-solving among students  
- Create a competitive yet motivating environment  
- Provide visibility into individual coding progress  

---

## Features

### User Registration
- Users can register using their name and LeetCode username  
- Accepts both direct usernames and profile links  
- Validates whether the LeetCode user exists before registration  

### Leaderboard System
- Displays ranked users based on their LeetCode statistics  
- Automatically updates rankings based on fetched data  
- Provides a clean interface for easy comparison  

### Automated Data Fetching
- Periodically fetches user data using the LeetCode API  
- Updates stored data without manual intervention  
- Keeps leaderboard information up-to-date  

### User Interface
- Simple and clean UI design  
- Smooth user experience with loading states  
- Includes blur and spinner animation during registration  

### Input Handling and Validation
- Extracts username from full LeetCode profile links  
- Prevents invalid or non-existent usernames  
- Avoids duplicate or incorrect entries  

### Error Handling
- Handles API failures gracefully  
- Displays alerts for invalid inputs  
- Prevents multiple submissions during requests  

---

## Tech Stack

| Layer     | Technology              |
|----------|------------------------|
| Frontend | HTML, CSS, JavaScript  |
| Backend  | Node.js                |
| API      | LeetCode API           |

---

## Project Structure

```
leetcode-ranking/
│── frontend/        # UI (HTML, CSS, JS)
│── data/            # Stored user data
│── scripts/         # Automation scripts
│── server.js        # Backend server
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


npm install
cd frontend
npm install

### 3. Run the project


npm run dev

or

node server.js

## Usage

1. Open the registration page  
2. Enter your name and LeetCode username  
3. Submit the form  
4. View your ranking on the leaderboard  

---

## Contributing

Contributions are welcome.

- Fork the repository  
- Create a new branch  
- Make your changes  
- Submit a Pull Request  