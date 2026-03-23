import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api';

export interface SurveyQuestion {
  id: string;
  type: 'rating' | 'multiple-choice' | 'text';
  label: string;
  options?: string[];
  required?: boolean;
}

export interface Survey {
  id: string;
  slug: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
}

export const getPendingSurveys = async (): Promise<Survey[]> => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/surveys/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const submitSurveyResponse = async (surveyId: string, responses: Record<string, any>): Promise<void> => {
  const token = localStorage.getItem('token');
  await axios.post(`${API_URL}/surveys/${surveyId}/respond`, { responses }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
