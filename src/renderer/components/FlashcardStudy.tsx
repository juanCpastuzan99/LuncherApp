import React, { useState, useEffect } from 'react';
import { Flashcard, getCardsToReview, calculateNextReview, createFlashcard, getFlashcardStats } from '../../ai/educational';
import './FlashcardStudy.css';

interface FlashcardStudyProps {
  category?: string;
  onClose?: () => void;
}

const FlashcardStudy: React.FC<FlashcardStudyProps> = ({ category, onClose }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadFlashcards();
  }, [category]);

  const loadFlashcards = async () => {
    if (window.api?.getConfig) {
      const config = await window.api.getConfig();
      const allCards: Flashcard[] = config.flashcards?.list || [];
      const cardsToReview = getCardsToReview(allCards, category);
      setFlashcards(cardsToReview);
      setStats(getFlashcardStats(allCards));
    }
  };

  const saveFlashcards = async (updatedCards: Flashcard[]) => {
    if (window.api?.getConfig && window.api?.setConfig) {
      const config = await window.api.getConfig();
      await window.api.setConfig('flashcards', 'list', updatedCards);
      setFlashcards(updatedCards.filter(c => c.nextReview <= Date.now()));
      setStats(getFlashcardStats(updatedCards));
    }
  };

  const handleAnswer = (quality: number) => {
    if (currentIndex >= flashcards.length) return;

    const currentCard = flashcards[currentIndex];
    const updated = calculateNextReview(currentCard, quality);
    const updatedCards = [...flashcards];
    updatedCards[currentIndex] = updated;

    saveFlashcards(updatedCards);
    setShowAnswer(false);
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Completado
      setCurrentIndex(0);
      loadFlashcards();
    }
  };

  const currentCard = flashcards[currentIndex];

  if (flashcards.length === 0) {
    return (
      <div className="flashcard-study empty">
        <div className="empty-message">
          <p>📚 No hay tarjetas para estudiar</p>
          <p className="hint">Crea tarjetas con: "crear tarjeta: pregunta es respuesta"</p>
        </div>
        {stats && (
          <div className="stats">
            <p>Total: {stats.total} | Pendientes: {stats.due} | Dominadas: {stats.mastered}</p>
          </div>
        )}
        {onClose && (
          <button className="close-btn" onClick={onClose}>Cerrar</button>
        )}
      </div>
    );
  }

  return (
    <div className="flashcard-study">
      <div className="flashcard-header">
        <span className="progress">{currentIndex + 1} / {flashcards.length}</span>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="flashcard-container">
        <div className={`flashcard ${showAnswer ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <div className="category">{currentCard.category}</div>
            <div className="question">{currentCard.question}</div>
            <button className="show-answer-btn" onClick={() => setShowAnswer(true)}>
              Mostrar respuesta
            </button>
          </div>
          <div className="flashcard-back">
            <div className="answer">{currentCard.answer}</div>
            <div className="quality-buttons">
              <button className="quality-btn bad" onClick={() => handleAnswer(0)}>
                ❌ Olvidado
              </button>
              <button className="quality-btn hard" onClick={() => handleAnswer(1)}>
                ⚠️ Difícil
              </button>
              <button className="quality-btn good" onClick={() => handleAnswer(3)}>
                ✓ Bueno
              </button>
              <button className="quality-btn easy" onClick={() => handleAnswer(5)}>
                ✓✓ Fácil
              </button>
            </div>
          </div>
        </div>
      </div>

      {stats && (
        <div className="stats-bar">
          <span>Dominadas: {stats.mastered}</span>
          <span>Pendientes: {stats.due}</span>
        </div>
      )}
    </div>
  );
};

export default FlashcardStudy;

