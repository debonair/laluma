import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as privacyService from '../services/privacy.service';

/**
 * GET /api/privacy/export
 * Exports all user data as JSON
 */
export const exportData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const data = await privacyService.exportUserData(userId);
        
        // Set filename for download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=luma-data-export-${userId}.json`);
        
        return res.status(200).send(JSON.stringify(data, null, 2));
    } catch (error: any) {
        console.error('[PrivacyController] Export failed:', error);
        return res.status(500).json({ 
            error: 'Export failed', 
            message: error.message || 'Internal Server Error' 
        });
    }
};

/**
 * DELETE /api/privacy/account
 * Permanently deletes user account and all data
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        await privacyService.deleteUserAccount(userId);
        
        return res.status(200).json({ 
            message: 'Account and all associated data have been permanently deleted.' 
        });
    } catch (error: any) {
        console.error('[PrivacyController] Deletion failed:', error);
        return res.status(500).json({ 
            error: 'Deletion failed', 
            message: error.message || 'Internal Server Error' 
        });
    }
};
