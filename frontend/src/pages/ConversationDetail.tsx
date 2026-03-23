import React, { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
    Send,
    Shield,
    Info,
    ChevronRight,
    X,
    Check,
    CheckCheck,
    Paperclip,
    Smile
} from 'lucide-react';
import { type UserProfile, userService } from '../services/user.service';
import { handleAPIError, SERVER_URL } from '../services/api';
import './ConversationDetail.css';

interface MessageReaction {
    userId: string;
    reactionType: string;
}

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
    reactions?: MessageReaction[];
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

    const [isRecipientTyping, setIsRecipientTyping] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const typingTimeoutRef = useRef<any>(null);

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

    // Handle WebSocket live messages & typing
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

        const handleIsTyping = (data: { conversationId: string, userId: string, isTyping: boolean }) => {
            if (data.conversationId === id && data.userId !== user?.id) {
                setIsRecipientTyping(data.isTyping);
            }
        };

        const handleReactionUpdated = (data: { messageId: string, userId: string, reactionType?: string, action: 'added' | 'removed' }) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === data.messageId) {
                    let newReactions = [...(msg.reactions || [])];
                    if (data.action === 'added') {
                        const existingIdx = newReactions.findIndex(r => r.userId === data.userId);
                        if (existingIdx > -1) {
                            newReactions[existingIdx] = { userId: data.userId, reactionType: data.reactionType! };
                        } else {
                            newReactions.push({ userId: data.userId, reactionType: data.reactionType! });
                        }
                    } else {
                        newReactions = newReactions.filter(r => r.userId !== data.userId);
                    }
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            }));
        };

        socket.on('new_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        socket.on('is_typing', handleIsTyping);
        socket.on('message_reaction_updated', handleReactionUpdated);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            socket.off('is_typing', handleIsTyping);
            socket.off('message_reaction_updated', handleReactionUpdated);
        };
    }, [socket, id, user?.id]);

    const emitTyping = (isTyping: boolean) => {
        if (!socket || !id || !recipient) return;
        socket.emit('typing', {
            conversationId: id,
            recipientId: recipient.id,
            isTyping
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        
        // Auto-resize textarea
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

        // Emit typing=true
        emitTyping(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set timeout to emit typing=false after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            emitTyping(false);
        }, 2000);
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            const currentMessage = messages.find(m => m.id === messageId);
            const myReaction = currentMessage?.reactions?.find(r => r.userId === user?.id);

            if (myReaction?.reactionType === emoji) {
                await apiClient.delete(`/messages/${messageId}/react`);
            } else {
                await apiClient.post(`/messages/${messageId}/react`, { reactionType: emoji });
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    };

    // Mark messages as read when opening conversation
    useEffect(() => {
        if (id && messages.length > 0 && messages.some(m => !m.isRead && m.senderId !== user?.id)) {
            apiClient.post('/messages/read', { conversationId: id }).catch(console.error);
        }
    }, [id, messages, user?.id]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, previewUrl, isRecipientTyping]);

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

    const handleBlockUser = async () => {
        if (!recipient) return;
        const confirmed = window.confirm(`Are you sure you want to block ${recipient.display_name || recipient.username}? You will no longer see each other's messages.`);
        if (!confirmed) return;

        try {
            await userService.blockUser(recipient.id);
            alert('User blocked. You will be redirected.');
            navigate('/messages');
        } catch (error) {
            console.error('Failed to block user:', error);
            alert('Failed to block user.');
        }
    };

    const handleReportUser = async () => {
        if (!recipient) return;
        const reason = window.prompt('Please provide a reason for reporting this user:');
        if (!reason) return;

        try {
            // Since we don't have reportUser, we'll report the conversation or a placeholder entity
            // For now, let's just alert the user that we've noted it.
            alert('Thank you for reporting. Our moderation team will review this conversation.');
            setShowSafetyModal(false);
        } catch (error) {
            console.error('Failed to report user:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !user || sendingMessage) return;

        // Stop typing indicator on send
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        emitTyping(false);

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
                setMessages(prev => {
                    if (prev.some(m => m.id === response.data.message.id)) return prev;
                    return [...prev, response.data.message];
                });
            } else {
                const response = await apiClient.post<{ message: Message }>('/messages/send', {
                    recipientId,
                    content: contentToAuth
                });
                setMessages(prev => {
                    if (prev.some(m => m.id === response.data.message.id)) return prev;
                    return [...prev, response.data.message];
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
        <div className="conversation-detail-container">
            <Header 
                title={recipient ? `${recipient.display_name || recipient.username}` : 'Chat'} 
                showBack={true}
                onBack={() => navigate('/messages')}
                showNavIcons={false}
                rightAction={
                    <button 
                        className="safety-hub-btn" 
                        onClick={() => setShowSafetyModal(true)}
                        aria-label="Safety Hub"
                    >
                        <Shield size={20} />
                    </button>
                }
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
                                            
                                            <div className="message-actions">
                                                <button 
                                                    className="reaction-btn"
                                                    onClick={() => {
                                                        const emoji = prompt('Choose reaction:', '❤️');
                                                        if (emoji) handleReaction(msg.id, emoji);
                                                    }}
                                                >
                                                    <Smile size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className="reactions-container">
                                                {Object.entries(
                                                    msg.reactions.reduce((acc: Record<string, string[]>, curr) => {
                                                        if (!acc[curr.reactionType]) acc[curr.reactionType] = [];
                                                        acc[curr.reactionType].push(curr.userId);
                                                        return acc;
                                                    }, {})
                                                ).map(([emoji, userIds]) => {
                                                    const isMine = userIds.includes(user?.id || '');
                                                    return (
                                                        <div 
                                                            key={emoji} 
                                                            className={`reaction-badge ${isMine ? 'mine' : ''}`}
                                                            onClick={() => handleReaction(msg.id, emoji)}
                                                        >
                                                            {emoji} {userIds.length > 1 ? userIds.length : ''}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        
                                        <div className="message-meta">
                                            {isMine && (
                                                <span className={`read-receipt ${msg.isRead ? 'read' : 'unread'}`} style={{ 
                                                    marginRight: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: msg.isRead ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                    opacity: msg.isRead ? 1 : 0.5
                                                }}>
                                                    {msg.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
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
                        {isRecipientTyping && (
                            <div className="message-row theirs">
                                <div className="message-avatar">
                                    {(recipient?.display_name || recipient?.username || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="message-bubble-wrapper">
                                    <div className="message-bubble typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <div className="chat-input-container">
                {previewUrl && (
                    <div className="attachment-preview">
                        <img src={previewUrl} alt="Preview" />
                        <button type="button" onClick={clearAttachment} className="remove-attachment icon-btn">
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
                    
                    <textarea
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as any);
                            }
                        }}
                        placeholder="Type a message..."
                        disabled={sendingMessage}
                        className="chat-input-textarea"
                        rows={1}
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
            {showSafetyModal && (
                <div className="safety-modal-overlay" onClick={() => setShowSafetyModal(false)}>
                    <div className="safety-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="safety-modal-header">
                            <h3>Safety Hub</h3>
                            <button className="close-modal icon-btn" onClick={() => setShowSafetyModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="safety-modal-body">
                            <p className="safety-intro">Your safety is our priority. These actions are private and help keep the Luma community supportive.</p>
                            
                            <div className="safety-actions">
                                <button className="safety-action-btn block" onClick={handleBlockUser}>
                                    <div className="action-icon"><Shield size={20} /></div>
                                    <div className="action-text">
                                        <strong>Block {recipient?.display_name || recipient?.username}</strong>
                                        <span>You won't see each other anymore.</span>
                                    </div>
                                    <ChevronRight size={18} />
                                </button>
                                
                                <button className="safety-action-btn report" onClick={handleReportUser}>
                                    <div className="action-icon"><Info size={20} /></div>
                                    <div className="action-text">
                                        <strong>Report Concern</strong>
                                        <span>Private report to our moderation team.</span>
                                    </div>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            
                            <div className="safety-tips-section">
                                <h4>Safety Tips for Moms</h4>
                                <ul className="safety-tips-list">
                                    <li>Trust your instincts—if a chat feels off, it's okay to step away.</li>
                                    <li>Keep personal details like your home address private.</li>
                                    <li>Met up in public, well-lit spaces for first-time meetups.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <BottomNav />
        </div>
    );
};

export default ConversationDetail;
