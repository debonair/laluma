import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Skeleton from './Skeleton';

interface PartnerRouteProps {
    children: React.ReactNode;
}

const PartnerRoute: React.FC<PartnerRouteProps> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="loading-skeleton-container">
                <Skeleton height={200} borderRadius="12px" />
                <Skeleton height={200} borderRadius="12px" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    // Checking for 'brand_partner' or 'app-admin' (admins can impersonate/debug)
    const isPartner = user?.roles?.includes('brand_partner') || user?.roles?.includes('app-admin');

    if (!isPartner) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default PartnerRoute;
