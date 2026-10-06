function handleAnswer(selectedIndex) {
  const currentQ = getCurrentQuestion();
  const choiceButtons = document.querySelectorAll('.choice-btn');

  // Disable pointer events to prevent repeated clicks
  choiceButtons.forEach((btn, index) => {
    btn.disabled = true;

    if (index === currentQ.correctAnswerIndex) {
      // Highlight the correct answer with Carolina Blue outline
      btn.classList.add('correct-highlight');
    } else {
      // Fade out incorrect / unselected answers to 70% opacity
      btn.classList.add('dimmed');
    }
  });

  // Proceed with rating update and queue transition
  processSpacedRepetition(selectedIndex === currentQ.correctAnswerIndex);
}