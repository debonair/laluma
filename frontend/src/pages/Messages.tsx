import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import BottomNav from '../components/BottomNav';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

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
            setConversations(response.data.conversations);
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

        const handleNewMessage = (newMessage: { conversationId: string, id: string, content: string, createdAt: string, senderId: string, isRead: boolean }) => {
            setConversations(prev => {
                const existingIndex = prev.findIndex(c => c.id === newMessage.conversationId);
                if (existingIndex > -1) {
                    // Update existing conversation
                    const updated = [...prev];
                    updated[existingIndex] = {
                        ...updated[existingIndex],
                        updatedAt: new Date().toISOString(),
                        messages: [newMessage]
                    };
                    // Move to top
                    const [moved] = updated.splice(existingIndex, 1);
                    return [moved, ...updated];
                } else {
                    // If it's a completely new conversation, best to refetch
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
            <header className="page-header" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Messages</h1>
            </header>

            <main className="page-content" style={{ padding: 0 }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Loading conversations...</div>
                ) : conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                        <h3 style={{ marginBottom: '0.5rem' }}>No messages yet</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Visit someone's profile to start a conversation.
                        </p>
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
                                    className="conversation-item"
                                    onClick={() => navigate(`/messages/${conv.id}`)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        cursor: 'pointer',
                                        backgroundColor: isUnread ? 'rgba(74,144,226,0.05)' : 'white',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                            marginRight: '1rem',
                                            flexShrink: 0
                                        }}
                                    >
                                        {(otherUser.displayName || otherUser.username).charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
                                            <h4 style={{ margin: 0, fontWeight: isUnread ? 700 : 600, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {otherUser.displayName || otherUser.username}
                                            </h4>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            fontSize: '0.9rem',
                                            fontWeight: isUnread ? 500 : 400,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {latestMessage?.senderId === user?.id ? 'You: ' : ''}
                                            {latestMessage?.content || 'Started a conversation'}
                                        </p>
                                    </div>
                                    {isUnread && (
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', marginLeft: '1rem' }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                <div style={{ height: '70px' }} />
            </main>
            <BottomNav />
        </div>
    );
};

export default Messages;
