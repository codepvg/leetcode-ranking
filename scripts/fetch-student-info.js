async function fetchStudentHistory(username) {
  console.log("Fetching history for:", username);

  const apiURL =
    "https://api.github.com/repos/codepvg/leetcode-ranking-data/contents/daily?ref=main";

  const response = await fetch(apiURL);
  const files = await response.json();

  if (!Array.isArray(files)) {
    throw new Error(files.message || "GitHub API failed");
  }

  let history = [];

  for (const file of files) {
    if (!file.name.endsWith(".json")) continue;

    const fileRes = await fetch(file.download_url);
    const data = await fileRes.json();

    const user = data.find((u) => u.id === username);

    if (user) {
      const date = file.name.split("-").slice(0, 3).join("-");

      history.push({
        date,
        easy: user.data.easySolved,
        medium: user.data.mediumSolved,
        hard: user.data.hardSolved,
      });
    }
  }

  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    username,
    history,
  };
}

module.exports = fetchStudentHistory;
