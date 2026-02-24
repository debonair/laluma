import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    className?: string;
    style?: React.CSSProperties;
    variant?: 'text' | 'circular' | 'rectangular';
}

const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    className = '',
    style = {},
    variant = 'rectangular'
}) => {

    const computedStyle: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: variant === 'circular' ? '50%' : (typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius),
        ...style
    };

    return (
        <div
            className={`skeleton-base ${className}`}
            style={computedStyle}
        />
    );
};

export default Skeleton;
