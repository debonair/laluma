import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { tokenStorage } from '../../services/auth.service';
import SubmitContent from './SubmitContent';
import PartnerAnalytics from './PartnerAnalytics';
import './PartnerDashboard.css';

interface BrandProfile {
  companyName: string;
  logoUrl: string | null;
  website: string | null;
  bio: string | null;
  category: string | null;
  instagramHandle: string | null;
  facebookUrl: string | null;
}

const PartnerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'content' | 'analytics'>('profile');
  const [profile, setProfile] = useState<BrandProfile>({
    companyName: '',
    logoUrl: '',
    website: '',
    bio: '',
    category: '',
    instagramHandle: '',
    facebookUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/brand-partners/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setMessage({ type: 'error', text: 'Failed to load your profile.' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = tokenStorage.getAccessToken();
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/brand-partners/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'Failed to update profile. Please check your inputs.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="partner-loading">Loading your dashboard...</div>;

  return (
    <div className="partner-dashboard">
      <header className="dashboard-header">
        <h1>Partner Dashboard</h1>
        <p>Manage your brand presence and editorial submissions.</p>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Brand Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            Content Submissions
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Performance
          </button>
        </div>
      </header>

      {activeTab === 'profile' ? (
        <>
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <section className="form-section">
              <h3>Basic Information</h3>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  name="companyName" 
                  value={profile.companyName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Category (e.g., Baby Gear, Wellness)</label>
                <input 
                  type="text" 
                  name="category" 
                  value={profile.category || ''} 
                  onChange={handleChange} 
                />
              </div>
              <div className="form-group">
                <label>Biography</label>
                <textarea 
                  name="bio" 
                  value={profile.bio || ''} 
                  onChange={handleChange} 
                  placeholder="Tell our community about your brand..."
                  rows={5}
                />
              </div>
            </section>

            <section className="form-section">
              <h3>Assets & Links</h3>
              <div className="form-group">
                <label>Logo URL</label>
                <input 
                  type="url" 
                  name="logoUrl" 
                  value={profile.logoUrl || ''} 
                  onChange={handleChange} 
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input 
                  type="url" 
                  name="website" 
                  value={profile.website || ''} 
                  onChange={handleChange} 
                  placeholder="https://yourbrand.com"
                />
              </div>
            </section>

            <section className="form-section">
              <h3>Social Media</h3>
              <div className="form-group">
                <label>Instagram Handle</label>
                <input 
                  type="text" 
                  name="instagramHandle" 
                  value={profile.instagramHandle || ''} 
                  onChange={handleChange} 
                  placeholder="@yourbrand"
                />
              </div>
              <div className="form-group">
                <label>Facebook Page URL</label>
                <input 
                  type="url" 
                  name="facebookUrl" 
                  value={profile.facebookUrl || ''} 
                  onChange={handleChange} 
                  placeholder="https://facebook.com/yourbrand"
                />
              </div>
            </section>

            <div className="form-actions">
              <button type="submit" disabled={saving} className="save-button">
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </>
      ) : activeTab === 'content' ? (
        <SubmitContent />
      ) : (
        <PartnerAnalytics />
      )}
    </div>
  );
};

export default PartnerDashboard;
