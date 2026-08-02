export function loadStreakData(data) {
  const currentStreakEl = document.getElementById("streak-current");
  const longestStreakEl = document.getElementById("streak-longest");

  if (data && data.streak) {
    if (currentStreakEl && data.streak.current !== undefined) {
      currentStreakEl.textContent = data.streak.current;
    }

    if (longestStreakEl && data.streak.longest !== undefined) {
      longestStreakEl.textContent = data.streak.longest;
    }
  }
}
