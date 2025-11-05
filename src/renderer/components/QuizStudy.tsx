import React, { useState, useEffect } from 'react';
import './QuizStudy.css';

export interface Quiz {
  id: string;
  name: string;
  questions: QuizQuestion[];
  category: string;
  createdAt: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizStudyProps {
  quizId?: string;
  quizName?: string;
  onClose?: () => void;
}

const QuizStudy: React.FC<QuizStudyProps> = ({ quizId, quizName, onClose }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId, quizName]);

  const loadQuiz = async () => {
    if (window.api?.getConfig) {
      try {
        const config = await window.api.getConfig();
        const quizzes: Quiz[] = config.quizzes || [];
        
        let foundQuiz: Quiz | null = null;
        if (quizId) {
          foundQuiz = quizzes.find(q => q.id === quizId) || null;
        } else if (quizName) {
          foundQuiz = quizzes.find(q => 
            q.name.toLowerCase().includes(quizName.toLowerCase())
          ) || null;
        }
        
        if (foundQuiz) {
          setQuiz(foundQuiz);
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
      }
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || !quiz) return;
    
    const isCorrect = selectedAnswer === quiz.questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setShowResult(true);
  };

  const handleNext = () => {
    if (!quiz) return;
    
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setCompleted(true);
    }
  };

  if (!quiz) {
    return (
      <div className="quiz-study empty">
        <p>Quiz no encontrado. Crea uno con: "crear quiz: [nombre]"</p>
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round((score / quiz.questions.length) * 100);
    return (
      <div className="quiz-study completed">
        <div className="quiz-result">
          <h2>¡Quiz Completado!</h2>
          <div className="score">
            {score} / {quiz.questions.length}
          </div>
          <div className="percentage">{percentage}%</div>
          <button className="quiz-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const isCorrect = selectedAnswer !== null && selectedAnswer === question.correctAnswer;

  return (
    <div className="quiz-study">
      <div className="quiz-header">
        <span className="quiz-progress">
          {currentQuestion + 1} / {quiz.questions.length}
        </span>
        <span className="quiz-name">{quiz.name}</span>
      </div>

      <div className="quiz-question">
        <h3>{question.question}</h3>
      </div>

      <div className="quiz-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`quiz-option ${
              selectedAnswer === index ? 'selected' : ''
            } ${
              showResult && index === question.correctAnswer ? 'correct' : ''
            } ${
              showResult && selectedAnswer === index && !isCorrect ? 'incorrect' : ''
            }`}
            onClick={() => handleAnswerSelect(index)}
            disabled={showResult}
          >
            {option}
          </button>
        ))}
      </div>

      {showResult && question.explanation && (
        <div className="quiz-explanation">
          {question.explanation}
        </div>
      )}

      <div className="quiz-controls">
        {!showResult ? (
          <button
            className="quiz-btn submit"
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
          >
            Enviar
          </button>
        ) : (
          <button className="quiz-btn next" onClick={handleNext}>
            {currentQuestion < quiz.questions.length - 1 ? 'Siguiente' : 'Finalizar'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizStudy;

