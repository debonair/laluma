import apiClient from './api';

export interface BrandInquiryData {
  companyName: string;
  contactName: string;
  email: string;
  intent: string;
  valuesAlignment: string;
}

export interface BrandInquiry extends BrandInquiryData {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export const brandPartnerService = {
  submitInquiry: async (data: BrandInquiryData) => {
    const response = await apiClient.post('/brand-partners/inquiry', data);
    return response.data;
  },
  getInquiries: async () => {
    const response = await apiClient.get<BrandInquiry[]>('/brand-partners/inquiries');
    return response.data;
  },
  updateInquiryStatus: async (id: string, status: 'approved' | 'rejected') => {
    const response = await apiClient.patch<{ message: string; inquiry: BrandInquiry }>(`/brand-partners/inquiries/${id}/status`, { status });
    return response.data;
  },
};
