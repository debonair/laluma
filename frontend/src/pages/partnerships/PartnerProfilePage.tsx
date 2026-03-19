import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './PartnerProfilePage.css';

interface BrandProfile {
  id: string;
  companyName: string;
  logoUrl: string | null;
  website: string | null;
  bio: string | null;
  category: string | null;
  instagramHandle: string | null;
  facebookUrl: string | null;
  isVerified: boolean;
}

const PartnerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/brand-partners/profiles/${id}`);
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching partner profile:', err);
        setError('Failed to load partner profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) return <div className="partner-loading">Loading partner story...</div>;
  if (error || !profile) return <div className="partner-error">{error || 'Partner not found.'}</div>;

  return (
    <div className="partner-profile-container">
      <div className="partner-header">
        <Link to="/discover" className="back-link">← Back to Discover</Link>
        <div className="partner-hero">
          <div className="partner-logo-container">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.companyName} className="partner-logo" />
            ) : (
              <div className="partner-logo-placeholder">{profile.companyName.charAt(0)}</div>
            )}
          </div>
          <div className="partner-info">
            <h1>
              {profile.companyName}
              {profile.isVerified && <span className="verified-badge" title="Verified Partner">✓</span>}
            </h1>
            {profile.category && <span className="partner-category">{profile.category}</span>}
          </div>
        </div>
      </div>

      <div className="partner-content">
        <div className="partner-main">
          <section className="partner-bio">
            <h2>Our Journey</h2>
            <p>{profile.bio || `Welcome to the world of ${profile.companyName}. We are proud partners of the La Luma community.`}</p>
          </section>
        </div>

        <aside className="partner-sidebar">
          <div className="partner-card">
            <h3>Connect</h3>
            <div className="partner-links">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="partner-link website">
                  Official Website
                </a>
              )}
              {profile.instagramHandle && (
                <a href={`https://instagram.com/${profile.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="partner-link instagram">
                  Instagram
                </a>
              )}
              {profile.facebookUrl && (
                <a href={profile.facebookUrl} target="_blank" rel="noopener noreferrer" className="partner-link facebook">
                  Facebook
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PartnerProfilePage;
