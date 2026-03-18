import { Request, Response } from 'express';
import { z } from 'zod';
import * as brandPartnerService from '../services/brandPartnerService';

const inquirySchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  intent: z.string().min(10, 'Please provide more detail about your intent'),
  valuesAlignment: z.string().min(10, 'Please describe how your values align with Luma'),
});

export const submitInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = inquirySchema.parse(req.body);
    const inquiry = await brandPartnerService.createInquiry(validatedData);

    res.status(201).json({
      message: 'Inquiry submitted successfully',
      inquiry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      });
      return;
    }

    console.error('Error submitting brand inquiry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your inquiry',
      code: 'INTERNAL_ERROR',
    });
  }
};

export const getInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const inquiries = await brandPartnerService.getAllInquiries();
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching brand inquiries:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const status = req.body.status as string;

  try {
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const inquiry = await brandPartnerService.updateInquiryStatus(id, status);

    if (status === 'approved') {
      try {
        await brandPartnerService.provisionPartnerAccount(id);
      } catch (provisionError) {
        console.error('Failed to provision Keycloak account:', provisionError);
        // We still consider the inquiry approved in DB, but flag the error
        res.status(200).json({ 
          message: 'Inquiry approved but Keycloak provisioning failed', 
          inquiry,
          warning: 'manual_provisioning_required'
        });
        return;
      }
    }

    res.json({ message: `Inquiry ${status} successfully`, inquiry });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
