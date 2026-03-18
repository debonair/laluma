import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import './Messages.css';

interface Conversation {
    id: string;
    updatedAt: string;
    participants: {
        user: {
            id: string;
            username: string;
            displayName?: string;
            profileImageUrl?: string;
        }
    }[];
    messages: {
        id: string;
        content: string;
        createdAt: string;
        senderId: string;
        isRead: boolean;
    }[];
}

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 86400000) { // Less than 24 hours
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 604800000) { // Less than a week
        return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Messages: React.FC = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { user } = useAuth();

    const fetchConversations = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get<{ conversations: Conversation[] }>('/messages/conversations');
            // Sort by updatedAt descending
            const sorted = response.data.conversations.sort((a, b) => 
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            setConversations(sorted);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (newMessage: any) => {
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.id === newMessage.conversationId);
                if (existingIndex > -1) {
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        updatedAt: new Date().toISOString(),
                        messages: [newMessage]
                    };
                    const [moved] = updated.splice(existingIndex, 1);
                    return [moved, ...updated];
                } else {
                    fetchConversations();
                    return prev;
                }
            });
        };

        socket.on('new_message', handleNewMessage);
        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket]);

    const getOtherParticipant = (conv: Conversation) => {
        return conv.participants.find(p => p.user.id !== user?.id)?.user;
    };

    return (
        <div className="page-container">
            <Header title="Messages" subtitle="Direct conversations with members" />

            <main className="page-content" style={{ padding: 0 }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
                        <p>Loading your conversations...</p>
                    </div>
                ) : conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem', opacity: 0.5 }}>💬</div>
                        <h2 style={{ marginBottom: '0.5rem' }}>Your inbox is empty</h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto 2rem auto' }}>
                            Connect with other mothers in groups to start chatting.
                        </p>
                        <button className="btn-primary" onClick={() => navigate('/groups')}>Explore Groups</button>
                    </div>
                ) : (
                    <div className="conversation-list">
                        {conversations.map(conv => {
                            const otherUser = getOtherParticipant(conv);
                            const latestMessage = conv.messages[0];
                            const isUnread = latestMessage && !latestMessage.isRead && latestMessage.senderId !== user?.id;

                            if (!otherUser) return null;

                            return (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${isUnread ? 'unread' : ''}`}
                                    onClick={() => navigate(`/messages/${conv.id}`)}
                                >
                                    <div className="conversation-avatar">
                                        {otherUser.profileImageUrl ? (
                                            <img src={otherUser.profileImageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
                                        ) : (
                                            (otherUser.displayName || otherUser.username).charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    
                                    <div className="conversation-info">
                                        <div className="conversation-header">
                                            <h4 className="conversation-name">
                                                {otherUser.displayName || otherUser.username}
                                            </h4>
                                            <span className="conversation-time">
                                                {formatTime(conv.updatedAt)}
                                            </span>
                                        </div>
                                        <p className="conversation-preview">
                                            {latestMessage?.senderId === user?.id ? 'You: ' : ''}
                                            {latestMessage?.content || 'Started a conversation'}
                                        </p>
                                    </div>

                                    {isUnread && <div className="unread-indicator" />}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
            <BottomNav />
        </div>
    );
};

export default Messages;
