import { Router } from 'express';
import * as surveyService from '../services/survey.service';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/surveys/pending
 * Get all active surveys eligible for the authenticated user.
 */
router.get('/pending', authenticate, async (req: any, res) => {
    try {
        const surveys = await surveyService.getPendingSurveys(req.user.id);
        res.json(surveys);
    } catch (error) {
        console.error('[SurveyRoutes] Error fetching pending surveys:', error);
        res.status(500).json({ error: 'Failed to fetch pending surveys' });
    }
});

/**
 * POST /api/surveys/:surveyId/respond
 * Submit a response for a specific survey.
 */
router.post('/:surveyId/respond', authenticate, async (req: any, res) => {
    try {
        const { surveyId } = req.params;
        const { responses } = req.body;
        
        if (!responses) {
            return res.status(400).json({ error: 'Responses are required' });
        }

        const result = await surveyService.submitResponse(req.user.id, surveyId, responses);
        res.json(result);
    } catch (error) {
        console.error('[SurveyRoutes] Error submitting survey response:', error);
        res.status(500).json({ error: 'Failed to submit survey response' });
    }
});

export default router;
