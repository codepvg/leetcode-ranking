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
  let ranking = null;
  let missingFilesCount = 0;
  const maxDays = 365;
  const chunkSize = 100;

  try {
    const liveApiUrl = `https://leetcode-api-dun.vercel.app/${username}`;
    const apiResponse = await fetch(liveApiUrl);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      // Captures the live ranking directly from the endpoint payload
      ranking = apiData.ranking || 0;
      console.log(`Live ranking fetched for ${username}:`, ranking);
    }
  } catch (err) {
    console.error(
      "Failed to fetch live global ranking from API wrapper:",
      err.message,
    );
  }

  let done = false;

  for (let chunkStart = 0; chunkStart < maxDays; chunkStart += chunkSize) {
    if (done) break;

    const fetchPromises = [];
    const chunkEnd = Math.min(chunkStart + chunkSize, maxDays);

    for (let daysAgo = chunkStart; daysAgo < chunkEnd; daysAgo++) {
      const fileName = getFileName(daysAgo);
      const rawUrl = `https://raw.githubusercontent.com/codepvg/leetcode-ranking-data/main/daily/${fileName}`;

      const p = fetch(rawUrl)
        .then(async (res) => {
          if (!res.ok) {
            return { daysAgo, fileName, ok: false };
          }
          const data = await res.json();
          return { daysAgo, fileName, ok: true, data };
        })
        .catch((err) => {
          return { daysAgo, fileName, ok: false, error: err };
        });

      fetchPromises.push(p);
    }

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      if (!result.ok) {
        missingFilesCount++;
        if (missingFilesCount >= 7) {
          done = true;
          break;
        }
        continue;
      }

      missingFilesCount = 0;

      const user = result.data.find((u) => u.id === username);

      if (user) {
        if (ranking === null || ranking === 0) {
          ranking = user.ranking || 0;
        }
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

  return {
    username,
    ranking,
    history,
  };
}

module.exports = fetchStudentHistory;
