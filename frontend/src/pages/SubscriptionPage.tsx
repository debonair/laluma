import React, { useEffect, useState } from 'react';
import { subscriptionService } from '../services/subscription.service';
import type { Subscription } from '../services/subscription.service';
import BottomNav from '../components/BottomNav';
import './SubscriptionPage.css';

const SubscriptionPage: React.FC = () => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        try {
            setLoading(true);
            const data = await subscriptionService.getStatus();
            setSubscription(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load subscription details.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (tier: 'premium' | 'premium_plus') => {
        try {
            setLoading(true);
            const updated = await subscriptionService.subscribe(tier);
            setSubscription(updated);
            alert(`Successfully upgraded to ${tier}!`);
        } catch (err) {
            console.error(err);
            alert('Failed to upgrade subscription.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel? You will lose access at the end of the billing period.')) return;
        try {
            setLoading(true);
            const updated = await subscriptionService.cancel();
            setSubscription(updated);
            alert('Subscription canceled.');
        } catch (err) {
            console.error(err);
            alert('Failed to cancel subscription.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !subscription) return <div className="page-loading">Loading...</div>;

    return (
        <div className="page-container subscription-page">
            <header className="page-header">
                <h1>My Subscription</h1>
            </header>

            <div className="subscription-content">
                {error && <div className="error-message">{error}</div>}

                <div className="current-plan-card">
                    <h2>Current Plan</h2>
                    <div className="plan-badge">{subscription?.tier.toUpperCase()}</div>
                    <p>Status: {subscription?.status}</p>
                    {subscription?.cancelAtPeriodEnd && <p className="warning-text">Standard access ends on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>}

                    {subscription?.tier !== 'free' && !subscription?.cancelAtPeriodEnd && (
                        <button className="btn-secondary" onClick={handleCancel}>Cancel Subscription</button>
                    )}
                </div>

                <div className="plans-grid">
                    <div className={`plan-card ${subscription?.tier === 'free' ? 'active' : ''}`}>
                        <h3>Free</h3>
                        <div className="price">$0/mo</div>
                        <ul>
                            <li>Access to free articles</li>
                            <li>Basic community features</li>
                        </ul>
                        {subscription?.tier === 'free' && <button className="btn-current" disabled>Current Plan</button>}
                    </div>

                    <div className={`plan-card ${subscription?.tier === 'premium' ? 'active' : ''}`}>
                        <h3>Premium</h3>
                        <div className="price">$9.99/mo</div>
                        <ul>
                            <li>Everything in Free</li>
                            <li>Access to Premium articles</li>
                            <li>Ad-free experience</li>
                        </ul>
                        {subscription?.tier === 'premium' ? (
                            <button className="btn-current" disabled>Current Plan</button>
                        ) : (
                            <button className="btn-primary" onClick={() => handleSubscribe('premium')}>Upgrade to Premium</button>
                        )}
                    </div>

                    <div className={`plan-card ${subscription?.tier === 'premium_plus' ? 'active' : ''}`}>
                        <h3>Premium+</h3>
                        <div className="price">$19.99/mo</div>
                        <ul>
                            <li>Everything in Premium</li>
                            <li>Exclusive video content</li>
                            <li>Priority support</li>
                        </ul>
                        {subscription?.tier === 'premium_plus' ? (
                            <button className="btn-current" disabled>Current Plan</button>
                        ) : (
                            <button className="btn-primary" onClick={() => handleSubscribe('premium_plus')}>Upgrade to Premium+</button>
                        )}
                    </div>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default SubscriptionPage;
