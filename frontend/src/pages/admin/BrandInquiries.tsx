import React, { useState, useEffect, useCallback } from 'react';
import { brandPartnerService, type BrandInquiry } from '../../services/brandPartner.service';
import { useToast } from '../../context/ToastContext';
import BottomNav from '../../components/BottomNav';
import Skeleton from '../../components/Skeleton';

const BrandInquiries: React.FC = () => {
    const [inquiries, setInquiries] = useState<BrandInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { addToast } = useToast();

    const loadInquiries = useCallback(async () => {
        try {
            setLoading(true);
            const data = await brandPartnerService.getInquiries();
            setInquiries(data);
        } catch (err) {
            console.error('Error loading inquiries:', err);
            addToast('Failed to load inquiries', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadInquiries();
    }, [loadInquiries]);

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        const confirmMsg = status === 'approved' 
            ? 'Approve this brand? This will automatically create a Keycloak partner account.' 
            : 'Reject this brand inquiry?';
        
        if (!confirm(confirmMsg)) return;

        setProcessingId(id);
        try {
            const response = await brandPartnerService.updateInquiryStatus(id, status);
            addToast(response.message, 'success');
            loadInquiries();
        } catch (err) {
            console.error('Error updating status:', err);
            addToast('Failed to update inquiry status', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = { pending: '#F59E0B', approved: '#10B981', rejected: '#EF4444' };
        return colors[status] || '#6B7280';
    };

    return (
        <div className="page-container" style={{ background: 'var(--bg-color)' }}>
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
                <h1>Brand Inquiries</h1>
                <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                    Review and provision partner accounts
                </p>
            </div>

            <main className="page-content" style={{ padding: '1rem' }}>
                {loading ? (
                    <div style={{ padding: '1rem' }}>
                        <Skeleton height={180} style={{ marginBottom: '1rem' }} borderRadius="12px" />
                        <Skeleton height={180} style={{ marginBottom: '1rem' }} borderRadius="12px" />
                    </div>
                ) : inquiries.length === 0 ? (
                    <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ fontSize: '2rem' }}>📫</p>
                        <p style={{ color: 'var(--text-secondary)' }}>No brand inquiries found</p>
                    </div>
                ) : (
                    inquiries.map(inquiry => (
                        <div key={inquiry.id} className="content-card" style={{ padding: '1.25rem', marginBottom: '1rem', borderTop: `4px solid ${getStatusColor(inquiry.status)}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{inquiry.companyName}</h3>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                                        Contact: {inquiry.contactName} ({inquiry.email})
                                    </p>
                                </div>
                                <span style={{
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: `${getStatusColor(inquiry.status)}20`,
                                    color: getStatusColor(inquiry.status),
                                    textTransform: 'uppercase'
                                }}>
                                    {inquiry.status}
                                </span>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Intent:</strong>
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', lineHeight: 1.4 }}>{inquiry.intent}</p>
                                </div>
                                <div>
                                    <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Values Alignment:</strong>
                                    <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', lineHeight: 1.4 }}>{inquiry.valuesAlignment}</p>
                                </div>
                            </div>

                            {inquiry.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => handleUpdateStatus(inquiry.id, 'approved')}
                                        disabled={processingId === inquiry.id}
                                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', flex: 1 }}
                                    >
                                        {processingId === inquiry.id ? 'Processing...' : '✅ Approve & Provision'}
                                    </button>
                                    <button 
                                        className="btn-secondary" 
                                        onClick={() => handleUpdateStatus(inquiry.id, 'rejected')}
                                        disabled={processingId === inquiry.id}
                                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', color: '#EF4444', borderColor: '#EF444420', flex: 1 }}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>

            <BottomNav />
        </div>
    );
};

export default BrandInquiries;
