import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { tokenStorage } from '../../services/auth.service';
import { Check, X, MessageSquare, ExternalLink, ShieldCheck, User, Clock } from 'lucide-react';
import './EditorialReview.css';

interface BrandSubmission {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  discountCode?: string;
  status: string;
  editorialNotes?: string;
  updatedAt: string;
  partner: {
    companyName: string;
    category: string;
    logoUrl?: string;
  };
}

const EditorialReview: React.FC = () => {
  const [submissions, setSubmissions] = useState<BrandSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<BrandSubmission | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchQueue = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/editorial/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (err) {
      console.error('Error fetching editorial queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async (submissionId: string, action: 'approve' | 'revise' | 'reject' | 'reviewing') => {
    setProcessing(true);
    const statusMap = {
      reviewing: 'IN_REVIEW',
      approve: 'APPROVED',
      revise: 'REVISION_REQUESTED',
      reject: 'REJECTED'
    };

    try {
      const token = tokenStorage.getAccessToken();
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/editorial/content/${submissionId}/review`, 
        { 
          status: statusMap[action],
          editorialNotes: notes 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedSubmission(null);
      setNotes('');
      fetchQueue();
    } catch (err) {
      console.error(`Error performing action ${action}:`, err);
      alert('Action failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading Editorial Queue...</div>;

  return (
    <div className="editorial-review-page">
      <header className="admin-header">
        <div className="header-title">
          <ShieldCheck size={28} color="#ff7675" />
          <h1>Editorial Bridge</h1>
        </div>
        <p>Review and approve professional brand content submissions.</p>
      </header>

      <div className="review-layout">
        <aside className="queue-sidebar">
          <h3>Pending Queue ({submissions.length})</h3>
          <div className="queue-list">
            {submissions.map(sub => (
              <div 
                key={sub.id} 
                className={`queue-item ${selectedSubmission?.id === sub.id ? 'active' : ''}`}
                onClick={() => { setSelectedSubmission(sub); setNotes(sub.editorialNotes || ''); }}
              >
                <div className="item-meta">
                  <span className="brand-name">{sub.partner.companyName}</span>
                  <span className="date">{new Date(sub.updatedAt).toLocaleDateString()}</span>
                </div>
                <p className="item-title">{sub.title}</p>
                <span className={`status-pill ${sub.status.toLowerCase()}`}>
                  {sub.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {submissions.length === 0 && <p className="empty-msg">No pending submissions.</p>}
          </div>
        </aside>

        <main className="review-workspace">
          {selectedSubmission ? (
            <div className="workspace-content">
              <div className="workspace-header">
                <h2>{selectedSubmission.title}</h2>
                <div className="brand-context">
                  {selectedSubmission.partner.logoUrl ? (
                    <img src={selectedSubmission.partner.logoUrl} alt="Logo" className="brand-logo-small" />
                  ) : <User size={20} />}
                  <span>{selectedSubmission.partner.companyName} ({selectedSubmission.partner.category})</span>
                </div>
              </div>

              <div className="content-preview">
                <p className="preview-label">Content Body:</p>
                <div className="content-box">{selectedSubmission.content}</div>
                
                <div className="preview-meta-grid">
                  <div className="meta-box">
                    <p className="preview-label">Image URL:</p>
                    {selectedSubmission.imageUrl ? (
                      <a href={selectedSubmission.imageUrl} target="_blank" rel="noreferrer" className="link">
                        View Image <ExternalLink size={14} />
                      </a>
                    ) : <span>None</span>}
                  </div>
                  <div className="meta-box">
                    <p className="preview-label">Discount Code:</p>
                    <code>{selectedSubmission.discountCode || 'N/A'}</code>
                  </div>
                </div>
              </div>

              <div className="review-actions-section">
                <h3>Editorial Decisions</h3>
                <textarea 
                  className="editorial-textarea"
                  placeholder="Internal notes or revision feedback for the partner..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                />
                <div className="action-buttons">
                  {selectedSubmission.status === 'PENDING' && (
                    <button 
                      className="revise-btn" 
                      disabled={processing}
                      onClick={() => handleAction(selectedSubmission.id, 'reviewing')}
                      style={{ background: '#81ecec', color: '#006266' }}
                    >
                      <Clock size={18} /> Mark as In Review
                    </button>
                  )}
                  <button 
                    className="revise-btn" 
                    disabled={processing}
                    onClick={() => handleAction(selectedSubmission.id, 'revise')}
                  >
                    <MessageSquare size={18} /> Request Revision
                  </button>
                  <button 
                    className="reject-btn" 
                    disabled={processing}
                    onClick={() => handleAction(selectedSubmission.id, 'reject')}
                  >
                    <X size={18} /> Reject
                  </button>
                  <button 
                    className="approve-btn" 
                    disabled={processing}
                    onClick={() => handleAction(selectedSubmission.id, 'approve')}
                  >
                    <Check size={18} /> Approve & Publish
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-workspace">
              <ShieldCheck size={48} color="#eee" />
              <p>Select a submission from the queue to start reviewing.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EditorialReview;
