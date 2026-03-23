import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { tokenStorage } from '../../services/auth.service';
import { Plus, Edit3, Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BrandContent {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  discountCode?: string;
  status: 'DRAFT' | 'PENDING' | 'IN_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  editorialNotes?: string;
  updatedAt: string;
}

const SubmitContent: React.FC = () => {
  const [submissions, setSubmissions] = useState<BrandContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<BrandContent>>({
    title: '',
    content: '',
    imageUrl: '',
    discountCode: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchSubmissions = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/brand-partners/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSave = async (submit: boolean = false) => {
    setMessage(null);
    try {
      const token = tokenStorage.getAccessToken();
      const endpoint = formData.id 
        ? `${import.meta.env.VITE_API_URL}/api/brand-partners/content/${formData.id}`
        : `${import.meta.env.VITE_API_URL}/api/brand-partners/content`;
      
      const response = await axios.post(endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (submit) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/brand-partners/content/${response.data.id}/submit`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage({ type: 'success', text: 'Content submitted for review!' });
      } else {
        setMessage({ type: 'success', text: 'Draft saved successfully.' });
      }

      setIsEditing(false);
      fetchSubmissions();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save content.';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  const activeCount = submissions.filter(s => ['PENDING', 'IN_REVIEW', 'REVISION_REQUESTED'].includes(s.status)).length;
  const canSubmit = activeCount < 2;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Edit3 size={16} />;
      case 'PENDING': return <Clock size={16} />;
      case 'IN_REVIEW': return <Edit3 size={16} color="#0984e3" />;
      case 'APPROVED': return <CheckCircle size={16} />;
      case 'REJECTED': return <XCircle size={16} />;
      case 'REVISION_REQUESTED': return <AlertCircle size={16} />;
      case 'PUBLISHED': return <CheckCircle size={16} color="#00b894" />;
      default: return null;
    }
  };

  if (loading) return <div className="loading-state">Loading submissions...</div>;

  return (
    <div className="submit-content-container">
      {!isEditing ? (
        <>
          <div className="quota-banner">
            <div className="quota-info">
              <h4>Submission Quota</h4>
              <p>{activeCount}/2 active submissions in review.</p>
            </div>
            {canSubmit ? (
              <button className="new-button" onClick={() => {
                setFormData({ title: '', content: '', imageUrl: '', discountCode: '' });
                setIsEditing(true);
              }}>
                <Plus size={20} /> New Content
              </button>
            ) : (
              <p className="quota-limit-msg">You have reached the limit of active submissions.</p>
            )}
          </div>

          <div className="submissions-list">
            {submissions.map(sub => (
              <div key={sub.id} className={`submission-card status-${sub.status.toLowerCase()}`}>
                <div className="card-header">
                  <span className={`status-badge ${sub.status.toLowerCase()}`}>
                    {getStatusIcon(sub.status)} {sub.status.replace('_', ' ')}
                  </span>
                  <span className="date">{new Date(sub.updatedAt).toLocaleDateString()}</span>
                </div>
                <h3>{sub.title}</h3>
                <p className="excerpt">{sub.content.substring(0, 100)}...</p>
                
                {sub.editorialNotes && (
                  <div className="editorial-notes">
                    <strong>Editorial Feedback:</strong>
                    <p>{sub.editorialNotes}</p>
                  </div>
                )}

                <div className="card-actions">
                  {['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(sub.status) && (
                    <button className="edit-btn" onClick={() => { setFormData(sub); setIsEditing(true); }}>
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
            {submissions.length === 0 && <p className="empty-msg">No submissions yet. Create your first brand deal content!</p>}
          </div>
        </>
      ) : (
        <div className="content-editor">
          <div className="editor-header">
            <h3>{formData.id ? 'Edit Content' : 'Create New Brand Content'}</h3>
            <button className="close-btn" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
          
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 20% Off Organic Bamboo Swaddles"
            />
          </div>

          <div className="form-group">
            <label>Content / Description</label>
            <textarea 
              value={formData.content} 
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe the offer, the product, and why our community would love it..."
              rows={10}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Promo Image URL (Optional)</label>
              <input 
                type="url" 
                value={formData.imageUrl} 
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label>Discount Code (Optional)</label>
              <input 
                type="text" 
                value={formData.discountCode} 
                onChange={e => setFormData({ ...formData, discountCode: e.target.value })}
                placeholder="LUMA20"
              />
            </div>
          </div>

          <div className="editor-actions">
            <button className="draft-btn" onClick={() => handleSave(false)}>
              Save Draft
            </button>
            <button 
              className="submit-btn" 
              onClick={() => handleSave(true)}
              disabled={!canSubmit || !formData.title || !formData.content}
            >
              <Send size={18} /> Submit for Review
            </button>
          </div>
          {!canSubmit && <p className="error-text">Cannot submit: active review quota full.</p>}
          {message && <p className={`message ${message.type}`}>{message.text}</p>}
        </div>
      )}
    </div>
  );
};

export default SubmitContent;
