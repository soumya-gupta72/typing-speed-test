// Manages the rendering of the passage and updates character highlighting as the user types.

let currentPassageText = '';

// renderPassage(text): Converts the text into individual <span> tags within the #passage container.
const renderPassage = (text) => {
  currentPassageText = text;
  const passageContainer = document.getElementById('passage');
  if (!passageContainer) return;
  
  // Clear the passage container
  passageContainer.innerHTML = '';
  
  // Create spans for each character
  for (let i = 0; i < text.length; i++) {
    const charSpan = document.createElement('span');
    charSpan.className = 'passage__char';
    charSpan.textContent = text[i];
    passageContainer.appendChild(charSpan);
  }
  
  // Highlight the first character as current
  if (passageContainer.children.length > 0) {
    passageContainer.children[0].classList.add('passage__char--current');
  }
};

// updateTypingUI(inputValue): Computes which characters are correct, incorrect, or current, and updates the span CSS classes
const updateTypingUI = (inputValue) => {
  const passageContainer = document.getElementById('passage');
  if (!passageContainer) return;
  
  const spans = passageContainer.children;
  const len = currentPassageText.length;
  
  for (let i = 0; i < len; i++) {
    const span = spans[i];
    if (!span) continue;
    
    // Reset classes
    span.className = 'passage__char';
    
    if (i < inputValue.length) {
      if (inputValue[i] === currentPassageText[i]) {
        span.classList.add('passage__char--correct');
      } else {
        span.classList.add('passage__char--incorrect');
      }
    } else if (i === inputValue.length) {
      span.classList.add('passage__char--current');
      // Scroll the current element into view inside the passage container
      span.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
};

// getCorrectCount(inputValue): Helper that compares input value with passage text and returns the count of correct characters currently in the passage.
const getCorrectCount = (inputValue) => {
  let correct = 0;
  const compareLength = Math.min(inputValue.length, currentPassageText.length);
  for (let i = 0; i < compareLength; i++) {
    if (inputValue[i] === currentPassageText[i]) {
      correct++;
    }
  }
  return correct;
};
