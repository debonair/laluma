import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { tokenStorage } from '../../services/auth.service';
import { Eye, Heart, MessageCircle, FileText, BarChart3, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import './PartnerAnalytics.css';

interface AnalyticsData {
  views: number;
  likes: number;
  comments: number;
  submissions: {
    total: number;
    pending: number;
    approved: number;
    drafts: number;
  };
}

const PartnerAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = tokenStorage.getAccessToken();
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/brand-partners/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load performance metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div className="analytics-loading">Calculating your reach...</div>;
  if (error) return <div className="analytics-error">{error}</div>;
  if (!data) return null;

  const stats = [
    { 
      label: 'Total Views', 
      value: data.views.toLocaleString(), 
      icon: Eye, 
      color: 'var(--brand-primary)',
      bg: 'rgba(var(--brand-primary-rgb), 0.1)' 
    },
    { 
      label: 'Engagement (Likes)', 
      value: data.likes.toLocaleString(), 
      icon: Heart, 
      color: '#ec4899', 
      bg: 'rgba(236, 72, 153, 0.1)' 
    },
    { 
      label: 'Comments', 
      value: data.comments.toLocaleString(), 
      icon: MessageCircle, 
      color: '#8b5cf6', 
      bg: 'rgba(139, 92, 246, 0.1)' 
    },
    { 
      label: 'Content Reach', 
      value: `${((data.likes + data.comments) / (data.views || 1) * 100).toFixed(1)}%`, 
      icon: TrendingUp, 
      color: '#10b981', 
      bg: 'rgba(16, 185, 129, 0.1)',
      subtitle: 'Conversion rate'
    }
  ];

  const submissionStats = [
    { label: 'Total Submitted', value: data.submissions.total, icon: FileText, color: 'var(--text-secondary)' },
    { label: 'Pending Review', value: data.submissions.pending, icon: Clock, color: '#f59e0b' },
    { label: 'Live Articles', value: data.submissions.approved, icon: CheckCircle, color: '#10b981' },
  ];

  return (
    <div className="partner-analytics">
      <div className="analytics-header">
        <div className="header-icon">
          <BarChart3 size={24} />
        </div>
        <div>
          <h2>Performance Overview</h2>
          <p>Real-time reach and engagement of your editorial content.</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass-card">
            <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
              <stat.icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              {stat.subtitle && <span className="stat-subtitle">{stat.subtitle}</span>}
            </div>
          </div>
        ))}
      </div>

      <section className="submission-summary">
        <h3>Submission Workflow</h3>
        <div className="submission-grid">
          {submissionStats.map((stat, i) => (
            <div key={i} className="submission-card">
              <stat.icon size={18} style={{ color: stat.color }} />
              <div className="sub-info">
                <span className="sub-value">{stat.value}</span>
                <span className="sub-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="analytics-footer">
        <p>Tip: Engagement is higher for articles with personal "Mom Tips" and localized discount codes.</p>
      </div>
    </div>
  );
};

export default PartnerAnalytics;
