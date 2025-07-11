import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useUser } from '../context/UserContext';
import './ChatSection.css';

const ChatSection = ({ 
  patientData, 
  appointmentId,
  onClose,
  showToast // Pass showToast as a prop since useToast might not be available in all contexts
}) => {
  console.log('=== ChatSection component rendered ===');
  console.log('Props:', { patientData: patientData?.name, appointmentId, onClose: !!onClose, showToast: !!showToast });
  const { user } = useUser();
  const { 
    connectToChat, 
    disconnectFromChat, 
    sendMessage, 
    getMessages, 
    isConnected, 
    isOtherParticipantOnline,
    isConnecting,
    connectionError,
    markMessagesAsRead 
  } = useChat();
  
  const [newMessage, setNewMessage] = useState('');
  const [shouldReload, setShouldReload] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const hasAttemptedConnection = useRef(false);
  const unreadMessagesRef = useRef(new Set()); // Track unread message IDs
  const connectionMonitorRef = useRef(null); // Monitor connection status

  const messages = getMessages(appointmentId);

  // Connect to chat when component mounts
  useEffect(() => {
    console.log('=== ChatSection useEffect triggered ===');
    console.log('Appointment ID:', appointmentId);
    console.log('Component mounted, attempting to connect...');
    
    if (appointmentId && !hasAttemptedConnection.current) {
      hasAttemptedConnection.current = true;
      connectToChat(appointmentId);
    }

    // Cleanup on unmount
    return () => {
      console.log('=== ChatSection useEffect cleanup ===');
      console.log('Component unmounting, disconnecting...');
      if (appointmentId) {
        disconnectFromChat(appointmentId);
        hasAttemptedConnection.current = false;
      }
      
      // Clear connection monitor
      if (connectionMonitorRef.current) {
        clearTimeout(connectionMonitorRef.current);
        connectionMonitorRef.current = null;
      }
    };
  }, [appointmentId]); // Only depend on appointmentId, not the callback functions

  // Monitor connection status and trigger reload if not connected for 10 seconds
  useEffect(() => {
    // Clear any existing monitor
    if (connectionMonitorRef.current) {
      clearTimeout(connectionMonitorRef.current);
    }

    // If not connected and not currently connecting, start monitoring
    if (!isConnected(appointmentId) && !isConnecting) {
      console.log('🔍 Starting connection monitor - WebSocket not connected');
      
      connectionMonitorRef.current = setTimeout(() => {
        console.log('⏰ Connection monitor timeout - WebSocket still not connected after 10 seconds');
        console.log('🔄 Triggering chat reload...');
        
        // Disconnect first to clean up any existing connection attempts
        disconnectFromChat(appointmentId);
        hasAttemptedConnection.current = false;
        
        // Set reload flag to trigger reconnection
        setShouldReload(true);
        
        if (showToast) {
          showToast('Connection lost. Reconnecting...', 'info');
        }
      }, 10000); // 10 seconds
    } else {
      console.log('✅ Connection monitor cleared - WebSocket is connected or connecting');
    }

    // Cleanup function
    return () => {
      if (connectionMonitorRef.current) {
        clearTimeout(connectionMonitorRef.current);
        connectionMonitorRef.current = null;
      }
    };
  }, [isConnected(appointmentId), isConnecting, appointmentId, disconnectFromChat, showToast]);

  // Handle reload trigger
  useEffect(() => {
    if (shouldReload && appointmentId) {
      console.log('🔄 Reloading chat connection...');
      setShouldReload(false);
      
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        connectToChat(appointmentId);
      }, 1000);
    }
  }, [shouldReload, appointmentId, connectToChat]);

  // Track unread messages and mark them as read when they become visible
  useEffect(() => {
    // Update unread messages tracking
    messages.forEach(message => {
      if (!message.read && !isOwnMessage(message)) {
        unreadMessagesRef.current.add(message.id);
      } else {
        unreadMessagesRef.current.delete(message.id);
      }
    });

    // Mark messages as read when user is at bottom (viewing new messages)
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer && unreadMessagesRef.current.size > 0) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50; // Within 50px of bottom
      
      if (isNearBottom) {
        // Mark all unread messages as read
        markMessagesAsRead(appointmentId);
        unreadMessagesRef.current.clear();
      }
    }
  }, [messages, appointmentId, markMessagesAsRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending messages
  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected(appointmentId)) {
      return;
    }

    const success = sendMessage(appointmentId, newMessage.trim());
    if (success) {
      setNewMessage('');
      // Auto-resize textarea
      if (chatInputRef.current) {
        chatInputRef.current.style.height = 'auto';
      }
    } else {
      if (showToast) {
        showToast('Failed to send message. Please try again.', 'error');
      }
    }
  };

  // Handle Enter key in chat
  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Simple chat input change handler
  const handleChatInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  // Handle file attachment
  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (showToast) {
        showToast(`📎 File "${file.name}" selected for upload`, 'info');
      } else {
        console.log(`File "${file.name}" selected for upload`);
      }
      
      // TODO: Implement file upload to chat
      // For now, just show a message
      if (showToast) {
        showToast('File upload feature coming soon!', 'info');
      }
    }
  };

  // Handle audio call
  const handleAudioCall = () => {
    if (showToast) {
      showToast('📞 Audio call feature coming soon!', 'info');
    } else {
      console.log('Audio call feature coming soon!');
    }
  };



  // Format time for messages
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get patient avatar theme
  const getAvatarTheme = (fullName) => {
    const themes = ['#059669', '#7c3aed', '#ec4899', '#ea580c', '#0d9488', '#4f46e5', '#0891b2'];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = ((hash << 5) - hash) + fullName.charCodeAt(i);
      hash = hash & hash;
    }
    return themes[Math.abs(hash) % themes.length];
  };

  // Check if message is from current user
  const isOwnMessage = (message) => {
    return message.senderId === user?.id;
  };

  // Mark specific message as read when it becomes visible
  const markMessageAsRead = useCallback((messageId) => {
    if (unreadMessagesRef.current.has(messageId)) {
      unreadMessagesRef.current.delete(messageId);
      // Call backend to mark this specific message as read
      // For now, we'll use the existing markMessagesAsRead which marks all unread messages
      markMessagesAsRead(appointmentId);
    }
  }, [appointmentId, markMessagesAsRead]);

  // Get sender name for display
  const getSenderName = (message) => {
    // Debug: Log message structure
    console.log('Message for sender name:', {
      messageId: message.id,
      senderId: message.senderId,
      senderType: message.senderType,
      senderName: message.senderName,
      currentUserId: user?.id,
      currentUserRole: user?.role,
      isOwnMessage: isOwnMessage(message)
    });
    
    // If it's the current user's message, show "You"
    if (isOwnMessage(message)) {
      return 'You';
    }
    
    // For messages from others, show their first name
    // If the current user is a doctor, the other person is the patient
    // If the current user is a patient, the other person is the doctor
    if (user?.role === 'DOCTOR') {
      // Current user is doctor, so other person is patient
      // Use patientData.name (which should be the patient's name)
      return 'Patient';
    } else {
      // Current user is patient, so other person is doctor
      // Use the doctor's name from the message or appointment data
      if (message.senderType === 'DOCTOR' && message.senderName) {
        return message.senderName; // Use the doctor's name from the message
      } else {
        // Fallback: try to get doctor name from appointment data if available
        return 'Doctor';
      }
    }
  };

  return (
    <div className="chat-section">
      <div className="chat-header">
        <div className="chat-title">
          <div 
            className="chat-avatar" 
            style={{ background: getAvatarTheme(patientData.name) }}
          >
            {patientData.avatar}
          </div>
          <div className="chat-title-text">
            <h3>{patientData.name}</h3>
            <p className="chat-status">
              <span className={`status-dot ${isOtherParticipantOnline(appointmentId) ? 'online' : 'offline'}`}></span>
              {(() => {
                const otherOnline = isOtherParticipantOnline(appointmentId);
                const connected = isConnected(appointmentId);
                console.log('ChatSection status check - isConnecting:', isConnecting, 'connectionError:', connectionError, 'isConnected:', connected, 'otherOnline:', otherOnline, 'shouldReload:', shouldReload);
                
                if (shouldReload) {
                  return '🔄 Reconnecting...';
                } else if (isConnecting) {
                  return 'Connecting...';
                } else if (connectionError) {
                  return connectionError;
                } else if (!connected) {
                  return 'Disconnected';
                } else if (otherOnline) {
                  return 'Online';
                } else {
                  return 'Offline';
                }
              })()}
            </p>
          </div>
        </div>
        
        <div className="chat-header-actions">
          <button 
            className="chat-action-icon"
            onClick={handleAudioCall}
            title="Audio Call"
          >
            📞
          </button>
          <button className="chat-close-btn" onClick={onClose} title="Close Chat">
            ✕
          </button>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Show date divider for first message or different days
            const showDateDivider = index === 0 || 
              new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString();
            
            return (
              <React.Fragment key={message.id || index}>
                {showDateDivider && (
                  <div className="date-divider">
                    <span>{new Date(message.timestamp).toLocaleDateString()}</span>
                  </div>
                )}
                <div className={`message ${isOwnMessage(message) ? 'sent' : ''}`}>
                  <div className="message-content">
                    <div className="message-header">
                      <span className="sender-name">{getSenderName(message)}</span>
                    </div>
                    <div className="message-text">
                      {message.content}
                      <div className="message-footer">
                        <div className="message-time">{formatTime(message.timestamp)}</div>
                        {isOwnMessage(message) && (
                          <div className="message-status">
                                                    {/* Debug: Log message status */}
                        {console.log('Message status debug:', {
                          messageId: message.id,
                          sent: message.sent,
                          read: message.read,
                          senderId: message.senderId,
                          currentUserId: user?.id
                        })}
                        {/* Show sent indicator if message exists (all messages are sent) */}
                        {(!message.read || message.read === false) && (
                          <span className="sent-indicator">✓</span>
                        )}
                        {message.read && (
                          <span className="read-indicator">✓✓</span>
                        )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-section">
        <div className="chat-input-wrapper">
          <textarea 
            ref={chatInputRef}
            className="chat-input" 
            value={newMessage}
            onChange={handleChatInputChange}
            onKeyDown={handleChatKeyDown}
            placeholder={isConnected(appointmentId) ? "Type a message" : "Connecting..."}
            disabled={!isConnected(appointmentId)}
            rows="1"
          />
          <div className="chat-input-actions">
            <button 
              className="chat-action-btn plus-btn"
              onClick={handleAttachment}
              title="Attach File"
              disabled={!isConnected(appointmentId)}
            >
              +
            </button>
            <button 
              className="send-btn" 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected(appointmentId)}
              title="Send Message"
            >
              {'➤'}
            </button>
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
      </div>
    </div>
  );
};

export default ChatSection;