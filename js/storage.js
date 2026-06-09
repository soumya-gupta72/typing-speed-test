const PB_KEY = 'typing_test_pb';

// Retrieves the high score (WPM) from localStorage. Returns null if none exists.
const getPersonalBest = () => {
  const pb = localStorage.getItem(PB_KEY);
  return pb ? parseInt(pb, 10) : null;
};

// Saves a new high score to localStorage.
const setPersonalBest = (wpm) => {
  localStorage.setItem(PB_KEY, wpm);
};

// Updates the high score display (#pb-value) on page load.
const updatePersonalBestUI = () => {
  const pbVal = document.getElementById('pb-value');
  if (pbVal) {
    const pb = getPersonalBest();
    pbVal.textContent = pb !== null ? pb : '--';
  }
};

// Run update initially
updatePersonalBestUI();
