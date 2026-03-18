import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { brandPartnerService } from '../../services/brandPartner.service';
import { useToast } from '../../context/ToastContext';
import './InquiryForm.css';

const inquirySchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  intent: z.string().min(10, 'Please provide at least 10 characters'),
  valuesAlignment: z.string().min(10, 'Please provide at least 10 characters'),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

const InquiryForm: React.FC = () => {
  const { addToast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      await brandPartnerService.submitInquiry(data);
      setIsSubmitted(true);
      addToast('Inquiry submitted successfully!', 'success');
      reset();
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      addToast('Failed to submit inquiry. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="inquiry-success">
        <h2>Thank You!</h2>
        <p>Your partnership inquiry has been received. Our team will review your application and get back to you shortly.</p>
        <button onClick={() => setIsSubmitted(false)}>Submit Another Inquiry</button>
      </div>
    );
  }

  return (
    <div className="inquiry-container">
      <div className="inquiry-header">
        <h1>Partner with Luma</h1>
        <p>Join our mission to create a safe, supportive community. Tell us about your brand.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="inquiry-form">
        <div className="form-group">
          <label htmlFor="companyName">Company Name</label>
          <input
            id="companyName"
            {...register('companyName')}
            placeholder="e.g. Acme Corp"
            className={errors.companyName ? 'error' : ''}
          />
          {errors.companyName && <span className="error-message">{errors.companyName.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="contactName">Contact Name</label>
          <input
            id="contactName"
            {...register('contactName')}
            placeholder="Your Name"
            className={errors.contactName ? 'error' : ''}
          />
          {errors.contactName && <span className="error-message">{errors.contactName.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="email@example.com"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="intent">Partnership Intent</label>
          <textarea
            id="intent"
            {...register('intent')}
            placeholder="Describe your goals for this partnership..."
            className={errors.intent ? 'error' : ''}
          />
          {errors.intent && <span className="error-message">{errors.intent.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="valuesAlignment">Values Alignment</label>
          <textarea
            id="valuesAlignment"
            {...register('valuesAlignment')}
            placeholder="How does your brand align with Luma's community values?"
            className={errors.valuesAlignment ? 'error' : ''}
          />
          {errors.valuesAlignment && <span className="error-message">{errors.valuesAlignment.message}</span>}
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-btn">
          {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
        </button>
      </form>
    </div>
  );
};

export default InquiryForm;
