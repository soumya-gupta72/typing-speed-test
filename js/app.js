// Global Elements
const typingInput = document.getElementById('typing-input');
const passageElement = document.getElementById('passage');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const goAgainBtn = document.getElementById('go-again-btn');
const resultsDialog = document.getElementById('results-dialog');

let passagesData = null;
let testState = 'READY'; // READY, ACTIVE, COMPLETED
let prevValue = '';

// Fetches data.json on load.
async function loadPassages() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    passagesData = await response.json();
    resetTest();
  } catch (err) {
    console.warn('Could not fetch data.json (likely due to CORS or file:// restrictions). Using fallback passages.', err);
    passagesData = FALLBACK_PASSAGES;
    resetTest();
  }
}

// Detects the difficulty radio inputs to pick a random passage.
const getSelectedDifficulty = () => {
  const activeRadio = document.querySelector('input[name="difficulty"]:checked');
  return activeRadio ? activeRadio.value : 'easy';
};

const getSelectedMode = () => {
  const activeRadio = document.querySelector('input[name="mode"]:checked');
  return activeRadio ? activeRadio.value : 'timed';
};

const getRandomPassage = (difficulty) => {
  if (!passagesData || !passagesData[difficulty]) return '';
  const list = passagesData[difficulty];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex].text;
};

// Resets the typing test
const resetTest = () => {
  testState = 'READY';
  prevValue = '';
  
  if (typingInput) {
    typingInput.value = '';
    typingInput.disabled = false;
  }
  
  // Enable difficulty and mode settings
  const controlsGroup = document.querySelectorAll('.controls__group');
  controlsGroup.forEach(group => group.classList.remove('is-disabled'));
  
  // Show start prompt
  const startPrompt = document.getElementById('start-prompt');
  if (startPrompt) {
    startPrompt.classList.remove('is-hidden');
  }
  
  const difficulty = getSelectedDifficulty();
  const mode = getSelectedMode();
  
  // Reset statistics tracking
  initStats(mode);
  
  // Load and render a random passage
  const text = getRandomPassage(difficulty);
  renderPassage(text);
};

// Starts the typing test timer and updates state
const startTest = () => {
  testState = 'ACTIVE';
  
  // Hide start prompt overlay
  const startPrompt = document.getElementById('start-prompt');
  if (startPrompt) {
    startPrompt.classList.add('is-hidden');
  }
  
  // Disable settings change during test
  const controlsGroup = document.querySelectorAll('.controls__group');
  controlsGroup.forEach(group => group.classList.add('is-disabled'));
  
  const mode = getSelectedMode();
  startTimer(mode,
    // onTick
    () => {
      updateLiveStats();
    },
    // onComplete (only in timed mode when timer reaches 0)
    () => {
      endTest();
    }
  );
};

// Ends the test and shows the results dialog
const endTest = () => {
  testState = 'COMPLETED';
  stopTimer();
  
  if (typingInput) {
    typingInput.disabled = true;
  }
  
  showResults();
};

// Update stats live on screen
const updateLiveStats = () => {
  if (!typingInput) return;
  const currentVal = typingInput.value;
  const correctCount = getCorrectCount(currentVal);
  
  const wpmVal = document.getElementById('stat-wpm');
  if (wpmVal) {
    wpmVal.textContent = calculateWPM(correctCount, timeElapsed);
  }
  
  const accuracyVal = document.getElementById('stat-accuracy');
  if (accuracyVal) {
    accuracyVal.textContent = `${calculateAccuracy()}%`;
  }
};

// Displays the results modal with appropriate PB message and decorations
const showResults = () => {
  if (!typingInput) return;
  const finalVal = typingInput.value;
  const correctCount = getCorrectCount(finalVal);
  
  // Count incorrect characters in final input
  let incorrectCount = 0;
  for (let i = 0; i < finalVal.length; i++) {
    if (finalVal[i] !== currentPassageText[i]) {
      incorrectCount++;
    }
  }
  
  const finalWPM = calculateWPM(correctCount, timeElapsed);
  const finalAccuracy = calculateAccuracy();
  const prevPB = getPersonalBest();
  
  const resultsTitle = document.getElementById('results-title');
  const resultsMessage = document.getElementById('results-message');
  const resultsDecorations = document.getElementById('results-decorations');
  const resultsIcon = document.getElementById('results-icon');
  
  // Clean up decorations
  if (resultsDecorations) resultsDecorations.hidden = true;
  if (resultsIcon) resultsIcon.hidden = true;
  
  if (prevPB === null) {
    // First test
    setPersonalBest(finalWPM);
    updatePersonalBestUI();
    if (resultsTitle) resultsTitle.textContent = 'Baseline Established!';
    if (resultsMessage) resultsMessage.textContent = `Nice job! You've set your initial personal best of ${finalWPM} WPM.`;
  } else if (finalWPM > prevPB) {
    // Beaten previous personal best
    setPersonalBest(finalWPM);
    updatePersonalBestUI();
    if (resultsTitle) resultsTitle.textContent = 'High Score Smashed!';
    if (resultsMessage) resultsMessage.textContent = `Incredible speed! You've set a new personal best of ${finalWPM} WPM.`;
    
    if (resultsDecorations) resultsDecorations.hidden = false;
    if (resultsIcon) resultsIcon.hidden = false;
  } else {
    // Normal test completion
    if (resultsTitle) resultsTitle.textContent = 'Test Complete!';
    if (resultsMessage) resultsMessage.textContent = 'Solid run. Keep pushing to beat your high score.';
  }
  
  // Populate statistics
  const resultsWpmVal = document.getElementById('results-wpm');
  const resultsAccuracyVal = document.getElementById('results-accuracy');
  const resultsCharsVal = document.getElementById('results-characters');
  
  if (resultsWpmVal) resultsWpmVal.textContent = finalWPM;
  if (resultsAccuracyVal) resultsAccuracyVal.textContent = `${finalAccuracy}%`;
  if (resultsCharsVal) resultsCharsVal.textContent = `${correctCount}/${incorrectCount}`;
  
  if (resultsDialog) {
    resultsDialog.showModal();
  }
};

// Bind all event listeners
const setupEventListeners = () => {
  if (!typingInput) return;
  
  // Handle user typing
  typingInput.addEventListener('input', () => {
    const currentValue = typingInput.value;
    
    // Auto-start test on first typed character
    if (testState === 'READY' && currentValue.length > 0) {
      startTest();
    }
    
    if (testState === 'ACTIVE') {
      // Analyze typed key differences
      if (currentValue.length > prevValue.length) {
        const addedCount = currentValue.length - prevValue.length;
        for (let i = 0; i < addedCount; i++) {
          const idx = prevValue.length + i;
          const typedChar = currentValue[idx];
          const expectedChar = currentPassageText[idx];
          
          keystrokesCount++;
          if (typedChar !== expectedChar) {
            errorCount++;
          }
        }
      }
      
      // Limit input string from exceeding passage length
      if (currentValue.length >= currentPassageText.length) {
        if (currentValue.length > currentPassageText.length) {
          typingInput.value = currentValue.slice(0, currentPassageText.length);
        }
        prevValue = typingInput.value;
        updateTypingUI(prevValue);
        updateLiveStats();
        endTest();
        return;
      }
      
      prevValue = currentValue;
      updateTypingUI(currentValue);
      updateLiveStats();
    }
  });
  
  // Style passage when input is active
  typingInput.addEventListener('focus', () => {
    if (passageElement) passageElement.classList.add('passage--focused');
  });
  
  typingInput.addEventListener('blur', () => {
    if (passageElement) passageElement.classList.remove('passage--focused');
  });
  
  // Delegate focus when clicking or tabbing to passage
  if (passageElement) {
    passageElement.addEventListener('click', () => {
      typingInput.focus();
    });
    passageElement.addEventListener('focus', () => {
      typingInput.focus();
    });
  }
  
  // Start button inside prompt
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      typingInput.focus();
      if (testState === 'READY') {
        startTest();
      }
    });
  }
  
  // Restart button
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      resetTest();
      typingInput.focus();
    });
  }
  
  // Results Go Again button
  if (goAgainBtn) {
    goAgainBtn.addEventListener('click', () => {
      if (resultsDialog) {
        resultsDialog.close();
      }
    });
  }
  
  // Reset test whenever dialog is closed (handles Go Again and Escape key closing)
  if (resultsDialog) {
    resultsDialog.addEventListener('close', () => {
      resetTest();
    });
  }
  
  // Re-evaluate passage when settings change
  const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
  difficultyRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      resetTest();
      typingInput.focus();
    });
  });
  
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  modeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      resetTest();
      typingInput.focus();
    });
  });
};

// Initial entry point execution
let initialized = false;
const initApp = () => {
  if (initialized) return;
  initialized = true;
  loadPassages();
  setupEventListeners();
};

document.addEventListener('DOMContentLoaded', initApp);

// Fallback in case DOMContentLoaded has already fired (e.g. if script is deferred and loaded late)
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initApp();
}
