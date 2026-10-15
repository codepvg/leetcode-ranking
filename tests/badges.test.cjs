const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "../frontend/js/user/badges.js"),
  "utf8",
);

async function badgeEarned(id, data) {
  const wall = {
    innerHTML: "",
    children: [],
    appendChild(badge) {
      this.children.push(badge);
    },
  };

  global.document = {
    getElementById: () => wall,
    createElement: () => ({
      setAttribute() {},
    }),
  };

  const { loadBadges } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );

  await loadBadges(data);
  const badge = wall.children.find((item) => item.textContent === id);
  assert.ok(badge, `${id} was not rendered`);
  return !badge.className.includes("badge-locked");
}

test("SPRINTER requires seven solves between consecutive dates", async () => {
  const entry = (date, easy) => ({ date, easy, medium: 0, hard: 0 });
  const earned = (history) => badgeEarned("SPRINTER", { history });

  assert.equal(
    await earned([entry("2026-10-01", 10), entry("2026-10-02", 17)]),
    true,
  );
  assert.equal(
    await earned([entry("2026-10-01", 10), entry("2026-10-02", 16)]),
    false,
  );
  assert.equal(
    await earned([entry("2026-10-01", 10), entry("2026-10-06", 17)]),
    false,
  );
  assert.equal(await earned([entry("2026-10-01", 10)]), false);
});

test("HOT_STREAK needs a current streak of seven", async () => {
  assert.equal(
    await badgeEarned("HOT_STREAK", { streak: { current: 7 } }),
    true,
  );
  assert.equal(
    await badgeEarned("HOT_STREAK", { streak: { current: 6 } }),
    false,
  );
});

test("HARD_CARRY needs five Hard and no Easy solves in the recent window", async () => {
  const history = Array.from({ length: 8 }, (_, i) => ({
    date: `2026-10-${String(i + 1).padStart(2, "0")}`,
    easy: 0,
    medium: 0,
    hard: i >= 6 ? 5 : 0,
  }));

  assert.equal(await badgeEarned("HARD_CARRY", { history }), true);
  const withEasy = history.map((entry, i) => ({
    ...entry,
    easy: i >= 6 ? 1 : 0,
  }));
  assert.equal(await badgeEarned("HARD_CARRY", { history: withEasy }), false);
});

test("CENTURION needs at least 100 total solves", async () => {
  assert.equal(
    await badgeEarned("CENTURION", {
      history: [{ easy: 50, medium: 30, hard: 20 }],
    }),
    true,
  );
  assert.equal(
    await badgeEarned("CENTURION", {
      history: [{ easy: 50, medium: 30, hard: 19 }],
    }),
    false,
  );
});

test("BALANCED needs five of each and counts within five percent", async () => {
  const earned = (easy, medium, hard) =>
    badgeEarned("BALANCED", { history: [{ easy, medium, hard }] });

  assert.equal(await earned(20, 20, 19), true);
  assert.equal(await earned(20, 20, 18), false);
  assert.equal(await earned(4, 4, 4), false);
});

test("UP_LINK needs an overall rank gain of five", async () => {
  const earned = (change) =>
    badgeEarned("UP_LINK", { leaderboardRanks: { overall: { change } } });

  assert.equal(await earned("5"), true);
  assert.equal(await earned("4"), false);
});

test("TOP_BRASS needs a valid overall rank in the top ten", async () => {
  const earned = (rank) =>
    badgeEarned("TOP_BRASS", { leaderboardRanks: { overall: { rank } } });

  assert.equal(await earned("10"), true);
  assert.equal(await earned("11"), false);
  assert.equal(await earned("--"), false);
});

test("SPEEDRUN needs a top-three weekly rank and positive weighted score", async () => {
  const history = [
    { easy: 0, medium: 0, hard: 0 },
    { easy: 0, medium: 1, hard: 0 },
  ];
  const earned = (rank, entries) =>
    badgeEarned("SPEEDRUN", {
      history: entries,
      leaderboardRanks: { weekly: { rank } },
    });

  assert.equal(await earned(3, history), true);
  assert.equal(await earned(4, history), false);
  assert.equal(await earned(3, [history[0], history[0]]), false);
});
