import React, { useEffect, useState, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send } from 'lucide-react';
import { type UserProfile } from '../services/user.service';
import { handleAPIError } from '../services/api';
import { SERVER_URL } from '../services/api';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
    isRead?: boolean;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
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
    const [recipient, setRecipient] = useState<UserProfile | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageError, setMessageError] = useState<string | null>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch message history
    useEffect(() => {
        const fetchMessages = async () => {
            if (!id) return;
            try {
                const response = await apiClient.get<{ messages: Message[], recipient: UserProfile }>(`/messages/conversations/${id}`);
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

                // If I am receiving a new message while looking at this screen, mark it as read
                if (incomingMsg.senderId !== user?.id) {
                    apiClient.post('/messages/read', { conversationId: id }).catch(console.error);
                }
            }
        };

        const handleMessagesRead = (data: { conversationId: string, readBy: string, timestamp: string }) => {
            // Update UI to show messages are read by the other person
            if (data.conversationId === id && data.readBy !== user?.id) {
                setMessages(prev => prev.map(msg =>
                    msg.senderId === user?.id && !msg.isRead
                        ? { ...msg, isRead: true }
                        : msg
                ));
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
        };
    }, [socket, id, user?.id]);

    // Mark messages as read when opening conversation
    useEffect(() => {
        if (id && messages.length > 0 && messages.some(m => !m.isRead && m.senderId !== user?.id)) {
            apiClient.post('/messages/read', { conversationId: id }).catch(console.error);
        }
    }, [id, messages, user?.id]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const clearAttachment = () => {
        setAttachment(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if ((!newMessage.trim() && !attachment) || !user || sendingMessage) return;

        const contentToAuth = newMessage.trim();

        try {
            setSendingMessage(true);
            setMessageError(null);

            const recipientCandidate = recipient?.id || messages.find(m => m.senderId !== user.id)?.senderId;

            if (!recipientCandidate) {
                setMessageError("Cannot determine recipient to reply to.");
                return;
            }

            if (attachment) {
                const formData = new FormData();
                formData.append('recipientId', recipientCandidate);
                if (contentToAuth) formData.append('content', contentToAuth);
                formData.append('attachment', attachment);

                await apiClient.post('/messages/send/attachment', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await apiClient.post('/messages/send', {
                    recipientId: recipientCandidate,
                    content: contentToAuth
                });
            }

            setNewMessage('');
            clearAttachment();
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessageError(handleAPIError(error) || 'Failed to send message.');
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
                        {recipient ? `Chat with ${recipient.display_name || recipient.username}` : 'Chat'}
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
                                                    {(recipient?.display_name || recipient?.username || 'Loading...').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                        <div
                                            style={{
                                                padding: msg.attachmentUrl ? '0.25rem' : '0.75rem 1rem',
                                                borderRadius: '16px',
                                                backgroundColor: isMine ? 'var(--primary-color)' : '#F0F2F5',
                                                color: isMine ? 'white' : 'var(--text-primary)',
                                                borderBottomRightRadius: isMine ? '4px' : '16px',
                                                borderBottomLeftRadius: !isMine ? '4px' : '16px',
                                                wordBreak: 'break-word',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            {msg.attachmentUrl && (
                                                <div style={{
                                                    width: '100%',
                                                    marginBottom: msg.content ? '0.5rem' : '0',
                                                    borderRadius: '12px',
                                                    overflow: 'hidden'
                                                }}>
                                                    {msg.attachmentType === 'image' ? (
                                                        <img src={`${SERVER_URL}${msg.attachmentUrl}`} alt="attachment" style={{ maxWidth: '100%', display: 'block' }} />
                                                    ) : (
                                                        <a href={`${SERVER_URL}${msg.attachmentUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: isMine ? 'white' : 'var(--primary-color)', padding: '0.5rem', display: 'block', textDecoration: 'underline' }}>
                                                            📎 View Attachment
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.content && (
                                                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.4, padding: msg.attachmentUrl ? '0 0.5rem 0.5rem' : 0 }}>{msg.content}</p>
                                            )}
                                        </div>
                                        {/* Read Receipt */}
                                        {isMine && (
                                            <div style={{ fontSize: '0.7rem', color: msg.isRead ? 'var(--primary-color)' : 'var(--text-secondary)', marginTop: '0.1rem', marginRight: '0.25rem' }}>
                                                {msg.isRead ? '✓✓' : '✓'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div style={{ padding: '0 1rem 1rem', paddingBottom: 'calc(1rem + 60px)', borderTop: previewUrl ? 'none' : '1px solid var(--border-color)', backgroundColor: 'white', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {previewUrl && (
                    <div style={{ position: 'relative', margin: '0.5rem 0', alignSelf: 'flex-start', maxWidth: '150px' }}>
                        <img src={previewUrl} alt="Preview" style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                        <button
                            type="button"
                            onClick={clearAttachment}
                            style={{ position: 'absolute', top: -10, right: -10, background: '#ff4444', color: 'white', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', lineHeight: 1 }}
                        >
                            ×
                        </button>
                    </div>
                )}
                {messageError && (
                    <div style={{ color: '#ff4444', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                        {messageError}
                    </div>
                )}
                <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingTop: previewUrl ? 0 : '1rem' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>📎</span>
                    </button>
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
                        disabled={(!newMessage.trim() && !attachment) || sendingMessage}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: (newMessage.trim() || attachment) ? 'var(--primary-color)' : '#E0E0E0',
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
