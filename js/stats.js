// Tracks WPM, accuracy, time remaining or elapsed, and manages the timer.

// State variables
let keystrokesCount = 0;
let errorCount = 0;
let timeElapsed = 0;
let timeRemaining = 60; // default for timed mode
let timerInterval = null;

// initStats(mode): Resets tracking statistics based on the selected mode.
const initStats = (mode) => {
  keystrokesCount = 0;
  errorCount = 0;
  timeElapsed = 0;
  if (mode === 'timed') {
    timeRemaining = 60;
  } else {
    timeRemaining = 0; // count up in passage mode
  }
  
  // Reset live UI elements
  const wpmVal = document.getElementById('stat-wpm');
  const accuracyVal = document.getElementById('stat-accuracy');
  const timeVal = document.getElementById('stat-time');
  
  if (wpmVal) wpmVal.textContent = '0';
  if (accuracyVal) accuracyVal.textContent = '100%';
  if (timeVal) {
    timeVal.textContent = mode === 'timed' ? '1:00' : '0:00';
  }
  
  stopTimer();
};

// calculateWPM(correctChars, seconds): Returns the WPM based on standard formula (correctChars / 5) / (seconds / 60).
const calculateWPM = (correctChars, seconds) => {
  if (seconds <= 0) return 0;
  const minutes = seconds / 60;
  return Math.round((correctChars / 5) / minutes);
};

// calculateAccuracy(): Returns Math.round(((keystrokesCount - errorCount) / keystrokesCount) * 100).
const calculateAccuracy = () => {
  if (keystrokesCount === 0) return 100;
  // Make sure accuracy never goes below 0
  const acc = Math.round(((keystrokesCount - errorCount) / keystrokesCount) * 100);
  return Math.max(0, acc);
};

// Format seconds into M:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// startTimer(mode, onTick, onComplete): Sets up a standard 1-second interval to count down (timed mode) or count up (passage mode) and fires callbacks.
const startTimer = (mode, onTick, onComplete) => {
  stopTimer();
  
  timerInterval = setInterval(() => {
    if (mode === 'timed') {
      timeRemaining--;
      timeElapsed++;
      
      const timeVal = document.getElementById('stat-time');
      if (timeVal) {
        timeVal.textContent = formatTime(timeRemaining);
      }
      
      if (onTick) onTick();
      
      if (timeRemaining <= 0) {
        stopTimer();
        if (onComplete) onComplete();
      }
    } else {
      // passage mode: count up
      timeElapsed++;
      
      const timeVal = document.getElementById('stat-time');
      if (timeVal) {
        timeVal.textContent = formatTime(timeElapsed);
      }
      
      if (onTick) onTick();
    }
  }, 1000);
};

// stopTimer(): Clears the timer interval.
const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};