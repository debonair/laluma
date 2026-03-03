import rateLimit from 'express-rate-limit';

// Global rate limiter applied to all routes
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10000, // Limit each IP to 10000 requests per `window` (here, per 15 minutes)
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
        error: 'Too Many Requests',
        message: 'You have exceeded the 100 requests in 15 minutes limit! Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});

// Stricter rate limiter specifically for authentication routes
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 2000, // Limit each IP to 2000 requests per `window` (here, per 15 minutes)
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        error: 'Too Many Requests',
        message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});
