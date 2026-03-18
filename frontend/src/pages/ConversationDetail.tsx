import React, { useEffect, useState, useRef } from 'react';
import BottomNav from '../components/BottomNav';
import Header from '../components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, Paperclip, X } from 'lucide-react';
import { type UserProfile } from '../services/user.service';
import { handleAPIError, SERVER_URL } from '../services/api';
import './ConversationDetail.css';

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
                setMessages(prev => {
                    if (prev.some(m => m.id === incomingMsg.id)) return prev;
                    return [...prev, incomingMsg];
                });

                if (incomingMsg.senderId !== user?.id) {
                    apiClient.post('/messages/read', { conversationId: id }).catch(console.error);
                }
            }
        };

        const handleMessagesRead = (data: { conversationId: string, readBy: string, timestamp: string }) => {
            if (data.conversationId === id && data.readBy !== user?.id) {
                setMessages(prev => prev.map(msg =>
                    msg.senderId === user?.id && !msg.isRead ? { ...msg, isRead: true } : msg
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

            const recipientId = recipient?.id || messages.find(m => m.senderId !== user.id)?.senderId;
            if (!recipientId) {
                setMessageError("Cannot determine recipient.");
                return;
            }

            if (attachment) {
                const formData = new FormData();
                formData.append('recipientId', recipientId);
                if (contentToAuth) formData.append('content', contentToAuth);
                formData.append('attachment', attachment);

                const response = await apiClient.post<{ message: Message }>('/messages/send/attachment', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setMessages(prev => [...prev, response.data.message]);
            } else {
                const response = await apiClient.post<{ message: Message }>('/messages/send', {
                    recipientId,
                    content: contentToAuth
                });
                setMessages(prev => [...prev, response.data.message]);
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
        <div className="conversation-detail-container">
            <Header 
                title={recipient ? `${recipient.display_name || recipient.username}` : 'Chat'} 
                showBack={true}
                onBack={() => navigate('/messages')}
                showNavIcons={false}
            />

            <div className="messages-area">
                {isLoading ? (
                    <div style={{ margin: 'auto' }}>
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div style={{ margin: 'auto', color: 'var(--text-secondary)' }}>
                                Send a message to start the conversation...
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isMine = msg.senderId === user?.id;
                            const showAvatar = !isMine && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);

                            return (
                                <div key={msg.id} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                                    {!isMine && (
                                        <div className="message-avatar">
                                            {showAvatar && (recipient?.display_name || recipient?.username || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="message-bubble-wrapper">
                                        <div className="message-bubble">
                                            {msg.attachmentUrl && (
                                                <div className="message-attachment">
                                                    {msg.attachmentType === 'image' ? (
                                                        <img src={`${SERVER_URL}${msg.attachmentUrl}`} alt="attachment" />
                                                    ) : (
                                                        <a href={`${SERVER_URL}${msg.attachmentUrl}`} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                                            📎 View Attachment
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            {msg.content && <p style={{ margin: 0 }}>{msg.content}</p>}
                                        </div>
                                        
                                        <div className="message-meta">
                                            {isMine && (
                                                <span className={`read-receipt ${msg.isRead ? 'read' : 'unread'}`}>
                                                    {msg.isRead ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                            <span style={{ opacity: 0.6 }}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="chat-input-container">
                {previewUrl && (
                    <div className="attachment-preview">
                        <img src={previewUrl} alt="Preview" />
                        <button type="button" onClick={clearAttachment} className="remove-attachment">
                            <X size={14} />
                        </button>
                    </div>
                )}
                
                {messageError && (
                    <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        {messageError}
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="chat-form">
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
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                        <Paperclip size={20} />
                    </button>
                    
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sendingMessage}
                        className="chat-input"
                    />
                    
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !attachment) || sendingMessage}
                        className="send-btn"
                    >
                        {sendingMessage ? '...' : <Send size={20} />}
                    </button>
                </form>
            </div>
            <BottomNav />
        </div>
    );
};

export default ConversationDetail;
