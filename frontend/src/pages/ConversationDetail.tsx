import React, { useEffect, useState, useRef } from 'react';
import BottomNav from '../components/BottomNav';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recipient, setRecipient] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch message history
    useEffect(() => {
        const fetchMessages = async () => {
            if (!id) return;
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const response = await apiClient.get<{ messages: Message[], recipient: any }>(`/messages/conversations/${id}`);
                setMessages(response.data.messages);
                setRecipient(response.data.recipient);
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

        if (!newMessage.trim() || !user || sendingMessage) return;

        const contentToAuth = newMessage.trim();

        try {
            setSendingMessage(true);
            setMessageError(null);

            const recipientCandidate = recipient?.id || messages.find(m => m.senderId !== user.id)?.senderId;

            if (!recipientCandidate) {
                setMessageError("Cannot determine recipient to reply to.");
                return;
            }

            await apiClient.post('/messages/send', {
                recipientId: recipientCandidate,
                content: contentToAuth
            });

            setNewMessage('');
        } catch (error: any) {
            console.error('Failed to send message:', error);
            setMessageError(error.response?.data?.error || error.message || 'Failed to send message.');
        } finally {
            setSendingMessage(false);
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
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                        {recipient ? `Chat with ${recipient.displayName || recipient.username}` : 'Chat'}
                    </h2>
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
            <div style={{ padding: '1rem', paddingBottom: 'calc(1rem + 60px)', borderTop: '1px solid var(--border-color)', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {messageError && (
                    <div style={{ color: '#ff4444', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                        {messageError}
                    </div>
                )}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sendingMessage}
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
                        disabled={!newMessage.trim() || sendingMessage}
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
                            cursor: newMessage.trim() && !sendingMessage ? 'pointer' : 'default',
                            transition: 'background-color 0.2s',
                            opacity: sendingMessage ? 0.5 : 1
                        }}
                    >
                        {sendingMessage ? '...' : <Send size={20} style={{ marginLeft: '-2px' }} />}
                    </button>
                </form>
            </div>
            <BottomNav />
        </div>
    );
};

export default ConversationDetail;
