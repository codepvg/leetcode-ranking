const axios = require("axios");

function getFileName(daysAgo) {
  const now = new Date();
  now.setDate(now.getDate() - daysAgo);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  let day = now.getDay();
  day = day === 0 ? 7 : day;

  return `${year}-${month}-${date}-${day}.json`;
}

async function fetchStudentHistory(username) {
  console.log("Fetching history for:", username);

  let history = [];
  let missingFilesCount = 0;
  let foundAny = false;
  const maxDays = 365;
  const chunkSize = 100;

  let done = false;

  for (let chunkStart = 0; chunkStart < maxDays; chunkStart += chunkSize) {
    if (done) break;

    const fetchPromises = [];
    const chunkEnd = Math.min(chunkStart + chunkSize, maxDays);

    for (let daysAgo = chunkStart; daysAgo < chunkEnd; daysAgo++) {
      const fileName = getFileName(daysAgo);
      const rawUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/daily/${fileName}`;

      const p = axios.get(rawUrl)
        .then((res) => {
          return { daysAgo, fileName, ok: true, data: res.data };
        })
        .catch((err) => {
          return { daysAgo, fileName, ok: false, error: err };
        });

      fetchPromises.push(p);
    }

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (!result.ok) {
        if (foundAny) {
          missingFilesCount++;
          if (missingFilesCount >= 10) {
            done = true;
            break;
          }
        }
        continue;
      }

      missingFilesCount = 0;
      foundAny = true;

      const user = result.data.find((u) => u.id === username);

      if (user) {
        const dateStr = result.fileName.split("-").slice(0, 3).join("-");

        history.push({
          date: dateStr,
          easy: user.data.easySolved,
          medium: user.data.mediumSolved,
          hard: user.data.hardSolved,
        });
      } else {
        done = true;
        break;
      }
    }
  }

  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  let globalRank = null;
  try {
    const leetcodeRes = await axios.get(`https://leetcode-api-dun.vercel.app/${username}`);
    if (leetcodeRes.status === 200 && leetcodeRes.data) {
      globalRank = leetcodeRes.data.ranking || null;
    }
  } catch (e) {
    console.error(`Failed to fetch global rank for: ${username}`, e.message);
  }

  return {
    username,
    history,
    globalRank,
  };
}

module.exports = fetchStudentHistory;
