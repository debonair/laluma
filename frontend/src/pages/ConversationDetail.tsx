import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    sender?: {
        id: string;
        username: string;
        displayName?: string;
    };
}

const ConversationDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { user } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch message history
    useEffect(() => {
        const fetchMessages = async () => {
            if (!id) return;
            try {
                const response = await apiClient.get<{ messages: Message[] }>(`/messages/conversations/${id}`);
                setMessages(response.data.messages);
            } catch (error) {
                console.error('Error fetching conversation:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [id]);

    // Handle WebSocket live messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (incomingMsg: Message & { conversationId: string }) => {
            if (incomingMsg.conversationId === id) {
                setMessages(prev => [...prev, incomingMsg]);
            }
        };

        socket.on('new_message', handleNewMessage);
        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, id]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !user) return;

        // In a real robust system we would Optimistic UI append here and replace on success.
        // For simplicity, we just rely on the API success + WebSocket roundtrip or local injection.

        const contentToAuth = newMessage.trim();
        setNewMessage(''); // optimistic clear

        try {
            // Find the other user from the existing messages or conversation endpoint
            // Hack: To send a message to a direct route, we need recipientId. 
            // Better to update backend `send` route to accept `conversationId` alongside `recipientId`.
            // Let's assume the backend will handle routing via a modified post endpoint if we pass conversationId.
            const recipientCandidate = messages.find(m => m.senderId !== user.id)?.senderId;

            if (!recipientCandidate) {
                console.error('Missing recipient. Cannot determine who to reply to.');
                return;
            }

            await apiClient.post('/messages/send', {
                recipientId: recipientCandidate,
                content: contentToAuth
            });

            // If local socket bounce isn't instant, we can manually inject the sent response:
            // But we already added `io.to(senderId).emit('new_message')` in the backend!
            // So we'll let the WebSocket bounce handle the local state append.
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: 0 }}>
            {/* Header */}
            <header className="page-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('/messages')}
                    className="btn-ghost"
                    style={{ padding: '0.5rem', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Chat</h2>
                </div>
            </header>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                {isLoading ? (
                    <div style={{ margin: 'auto' }}>Loading messages...</div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div style={{ margin: 'auto', color: 'var(--text-secondary)' }}>Send a message to start the conversation...</div>
                        )}
                        {messages.map((msg, idx) => {
                            const isMine = msg.senderId === user?.id;
                            const showAvatar = !isMine && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                            return (
                                <div
                                    key={msg.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: isMine ? 'flex-end' : 'flex-start',
                                        marginBottom: '0.5rem',
                                        alignItems: 'flex-end'
                                    }}
                                >
                                    {!isMine && (
                                        <div style={{ width: '30px', marginRight: '0.5rem' }}>
                                            {showAvatar && msg.sender && (
                                                <div style={{
                                                    width: '30px', height: '30px', borderRadius: '50%',
                                                    backgroundColor: 'var(--primary-color)', color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem', fontWeight: 'bold'
                                                }}>
                                                    {(msg.sender.displayName || msg.sender.username).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            maxWidth: '75%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '16px',
                                            backgroundColor: isMine ? 'var(--primary-color)' : '#F0F2F5',
                                            color: isMine ? 'white' : 'var(--text-primary)',
                                            borderBottomRightRadius: isMine ? '4px' : '16px',
                                            borderBottomLeftRadius: !isMine ? '4px' : '16px',
                                            wordBreak: 'break-word',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.4 }}>{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '24px',
                            outline: 'none',
                            fontSize: '0.95rem'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: newMessage.trim() ? 'var(--primary-color)' : '#E0E0E0',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: newMessage.trim() ? 'pointer' : 'default',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        <Send size={20} style={{ marginLeft: '-2px' }} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConversationDetail;
