import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as surveyService from '../services/survey.service';
import SurveyModal from './modals/SurveyModal';
import { AnimatePresence } from 'framer-motion';

const SurveyTrigger: React.FC = () => {
    const { isAuthenticated, user } = useAuth();
    const [activeSurvey, setActiveSurvey] = useState<surveyService.Survey | null>(null);

    useEffect(() => {
        if (isAuthenticated && user) {
            checkSurveys();
        } else {
            setActiveSurvey(null);
        }
    }, [isAuthenticated, user]);

    const checkSurveys = async () => {
        try {
            const surveys = await surveyService.getPendingSurveys();
            if (surveys.length > 0) {
                // For now, just show the first pending one
                setActiveSurvey(surveys[0]);
            }
        } catch (error) {
            console.error('[SurveyTrigger] Failed to check for surveys:', error);
        }
    };

    const handleComplete = () => {
        setActiveSurvey(null);
        // Refresh the list
        checkSurveys();
    };

    const handleClose = () => {
        setActiveSurvey(null);
    };

    if (!activeSurvey) return null;

    return (
        <AnimatePresence>
            {activeSurvey && (
                <SurveyModal 
                    survey={activeSurvey} 
                    onClose={handleClose} 
                    onComplete={handleComplete} 
                />
            )}
        </AnimatePresence>
    );
};

export default SurveyTrigger;
