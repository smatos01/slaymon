const MAX_CREDITS = 12;
const REGEN_INTERVAL_SECONDS = 3600;

// Catches up any credits earned while the timer wasn't being actively checked
// (e.g. the user was away, or hit 0 credits and stopped polling). Loops so
// multiple elapsed hours are all credited, not just one.
function regenerateCredits(credits, timerTimestamp, now) {
  let updatedCredits = credits;
  let updatedTimer = timerTimestamp;

  while (updatedCredits < MAX_CREDITS && updatedTimer && now >= updatedTimer) {
    updatedCredits += 1;
    updatedTimer += REGEN_INTERVAL_SECONDS;
  }

  if (updatedCredits >= MAX_CREDITS) {
    updatedCredits = MAX_CREDITS;
    updatedTimer = 0;
  }

  const changed = updatedCredits !== credits || updatedTimer !== timerTimestamp;
  return { credits: updatedCredits, timerTimestamp: updatedTimer, changed };
}

module.exports = { regenerateCredits, MAX_CREDITS, REGEN_INTERVAL_SECONDS };
