import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './SubscriptionPage.css';

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { } = useAuth();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubscribe = async (tier: 'premium' | 'premium_plus') => {
        setIsProcessing(true);
        // Mock a processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, this would redirect to Stripe Checkout
        // For Phase 6 mock, we just show a fake success toast and redirect
        addToast(`Successfully subscribed to ${tier === 'premium_plus' ? 'Premium+' : 'Premium'} !(Mocked)`, 'success');

        setIsProcessing(false);
        navigate('/my-luma');
    };

    return (
        <div className="subscription-container">
            <header className="subscription-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h1>Unlock Premium Access</h1>
                <p>Get exclusive content, early access to local meets, and support Luma creators.</p>
            </header>

            <div className="pricing-tiers">
                <div className="tier-card">
                    <div className="tier-header">
                        <h2>Premium</h2>
                        <div className="tier-price">
                            <span className="currency">$</span>
                            <span className="amount">4.99</span>
                            <span className="period">/mo</span>
                        </div>
                    </div>
                    <ul className="tier-features">
                        <li>✔️ Access to all Premium Articles</li>
                        <li>✔️ Ad-free experience</li>
                        <li>✔️ Premium Badge on Profile</li>
                    </ul>
                    <button
                        className="btn-subscribe"
                        onClick={() => handleSubscribe('premium')}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Subscribe'}
                    </button>
                </div>

                <div className="tier-card premium-plus">
                    <div className="tier-badge">Best Value</div>
                    <div className="tier-header">
                        <h2>Premium+</h2>
                        <div className="tier-price">
                            <span className="currency">$</span>
                            <span className="amount">9.99</span>
                            <span className="period">/mo</span>
                        </div>
                    </div>
                    <ul className="tier-features">
                        <li>✔️ Everything in Premium</li>
                        <li>✔️ Exclusive Video Content</li>
                        <li>✔️ Priority customer support</li>
                        <li>✔️ Create up to 10 Private Groups</li>
                    </ul>
                    <button
                        className="btn-subscribe highlight"
                        onClick={() => handleSubscribe('premium_plus')}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Processing...' : 'Subscribe Now'}
                    </button>
                </div>
            </div>

            <div className="subscription-footer">
                <p>Secure checkout powered by Stripe. Cancel anytime.</p>
            </div>
        </div>
    );
};

export default SubscriptionPage;
