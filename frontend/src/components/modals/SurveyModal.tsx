import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, CheckCircle } from 'lucide-react';
import * as surveyService from '../../services/survey.service';
import './SurveyModal.css';

interface SurveyModalProps {
  survey: surveyService.Survey;
  onClose: () => void;
  onComplete: () => void;
}

const SurveyModal: React.FC<SurveyModalProps> = ({ survey, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const questions = survey.questions;
  const currentQuestion = questions[currentStep];

  const handleAnswer = (questionId: string, answer: any) => {
    setResponses((prev) => ({ ...prev, [questionId]: answer }));
  };

  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitSurvey();
    }
  };

  const submitSurvey = async () => {
    setIsSubmitting(true);
    try {
      await surveyService.submitSurveyResponse(survey.id, responses);
      setIsFinished(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit survey:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="survey-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="survey-glass-card"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
      >
        {!isFinished && (
          <button
            onClick={onClose}
            className="icon-btn survey-close-btn"
            title="Close"
          >
            <X size={20} />
          </button>
        )}

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="survey-header">
                <span className="badge badge-premium">Your Voice Matters</span>
                <h2>{survey.title}</h2>
                <p>{survey.description}</p>
              </div>

              <div className="survey-question-container">
                <label className="survey-question-label">
                  {currentQuestion.label}
                  {currentQuestion.required && <span className="survey-required-star">*</span>}
                </label>

                {currentQuestion.type === 'rating' && (
                  <div className="survey-rating-container">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswer(currentQuestion.id, val)}
                        className={`survey-rating-btn ${responses[currentQuestion.id] === val ? 'selected' : ''}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'multiple-choice' && (
                  <div className="choice-list">
                    {currentQuestion.options?.map((opt) => (
                      <button
                        key={opt}
                        className={`choice-item ${responses[currentQuestion.id] === opt ? 'selected' : ''}`}
                        onClick={() => handleAnswer(currentQuestion.id, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'text' && (
                  <textarea
                    rows={3}
                    className="survey-textarea"
                    placeholder="Type your feedback here..."
                    value={responses[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  />
                )}
              </div>

              <div className="survey-footer">
                <div className="survey-progress-container">
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`survey-progress-dot ${idx <= currentStep ? 'active' : ''}`}
                    />
                  ))}
                </div>

                <button
                  className="btn-primary"
                  disabled={isSubmitting || (currentQuestion.required && !responses[currentQuestion.id])}
                  onClick={nextStep}
                >
                  {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="finished"
              className="survey-success-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <motion.div
                className="survey-success-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              >
                <CheckCircle size={64} />
              </motion.div>
              <h2>Thank You!</h2>
              <p>Your feedback helps us grow Luma into the best place for mothers everywhere.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default SurveyModal;
