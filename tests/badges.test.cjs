const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
  path.join(__dirname, "../frontend/js/user/badges.js"),
  "utf8",
);

async function sprinterEarned(history) {
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

  await loadBadges({ history, leaderboardRanks: {} });
  const badge = wall.children.find((item) => item.textContent === "SPRINTER");
  return !badge.className.includes("badge-locked");
}

test("SPRINTER requires seven solves between consecutive dates", async () => {
  const entry = (date, easy) => ({ date, easy, medium: 0, hard: 0 });

  assert.equal(
    await sprinterEarned([entry("2026-10-01", 10), entry("2026-10-02", 17)]),
    true,
  );
  assert.equal(
    await sprinterEarned([entry("2026-10-01", 10), entry("2026-10-02", 16)]),
    false,
  );
  assert.equal(
    await sprinterEarned([entry("2026-10-01", 10), entry("2026-10-06", 17)]),
    false,
  );
  assert.equal(await sprinterEarned([entry("2026-10-01", 10)]), false);
});
