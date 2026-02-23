import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketIO } from './socket';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import groupsRoutes from './routes/groups.routes';
import postsRoutes from './routes/posts.routes';
import feedRoutes from './routes/feed.routes';
import contentRoutes from './routes/content.routes';
import subscriptionRoutes from './routes/subscription.routes';
import notificationRoutes from './routes/notification.routes';
import messagesRoutes from './routes/messages.routes';
import submissionsRoutes from './routes/submissions.routes';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSockets
setupSocketIO(server);

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/submissions', submissionsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        code: 'NOT_FOUND'
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
    });
});

server.listen(PORT, () => {
    console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket Server initialized`);
});
