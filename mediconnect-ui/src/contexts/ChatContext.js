import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '../context/UserContext';
import tokenService from '../services/tokenService';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useUser();
  const [connections, setConnections] = useState(new Map());
  const [messages, setMessages] = useState(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [otherParticipantOnline, setOtherParticipantOnline] = useState(new Map()); // Track other participants' online status
  const reconnectTimeoutRef = useRef(null);
  const connectionAttempts = useRef(new Set()); // Track which appointments we've attempted to connect to
  const lastConnectionTime = useRef(0); // Track when the last connection was made
  const connectionCooldown = 5000; // 5 seconds cooldown between connections

  // Check if we have any active connections
  const hasActiveConnection = useCallback(() => {
    for (const [appointmentId, socket] of connections.entries()) {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        return true;
      }
    }
    return false;
  }, [connections]);

  // Check if enough time has passed since last connection
  const canMakeNewConnection = useCallback(() => {
    const now = Date.now();
    const timeSinceLastConnection = now - lastConnectionTime.current;
    return timeSinceLastConnection >= connectionCooldown;
  }, []);

  // Connect to chat for a specific appointment
  const connectToChat = useCallback(async (appointmentId) => {
    console.log('=== connectToChat called ===');
    console.log('Appointment ID:', appointmentId);
    console.log('User:', user);
    console.log('User ID:', user?.id);
    console.log('Current connections:', Array.from(connections.keys()));
    console.log('Connection states:', Array.from(connections.entries()).map(([id, socket]) => `${id}: ${socket.readyState}`));
    console.log('isConnecting state:', isConnecting);
    console.log('Previous connection attempts:', Array.from(connectionAttempts.current));
    console.log('Has active connection:', hasActiveConnection());
    console.log('Can make new connection:', canMakeNewConnection());
    
    if (!appointmentId) {
      console.warn('Cannot connect to chat: missing appointmentId');
      return;
    }

    // Check if already connected to this specific appointment
    if (connections.has(appointmentId)) {
      const existingSocket = connections.get(appointmentId);
      console.log('Existing socket state for', appointmentId, ':', existingSocket.readyState);
      if (existingSocket.readyState === WebSocket.OPEN) {
        console.log('✅ Already connected to chat for appointment:', appointmentId);
        return;
      } else if (existingSocket.readyState === WebSocket.CONNECTING) {
        console.log('🚫 BLOCKED: Already connecting to chat for appointment:', appointmentId);
        return;
      }
    }

    // Check if we've already attempted to connect to this appointment
    if (connectionAttempts.current.has(appointmentId)) {
      console.log('🚫 BLOCKED: Already attempted connection for appointment:', appointmentId);
      return;
    }

    // Check if we're already connecting to any appointment
    if (isConnecting) {
      console.log('🚫 BLOCKED: Already in connecting state, skipping new connection request');
      return;
    }

    // Check if there's any active connection (global check)
    if (hasActiveConnection()) {
      console.log('🚫 BLOCKED: Active connection exists, cannot create new connection');
      return;
    }

    // Check if enough time has passed since last connection
    if (!canMakeNewConnection()) {
      const timeToWait = connectionCooldown - (Date.now() - lastConnectionTime.current);
      console.log(`🚫 BLOCKED: Connection cooldown active. Need to wait ${Math.ceil(timeToWait / 1000)} more seconds`);
      return;
    }

    // Mark this appointment as attempted
    connectionAttempts.current.add(appointmentId);
    console.log('📝 Marked appointment as attempted:', appointmentId);

    // Update last connection time
    lastConnectionTime.current = Date.now();
    console.log('⏰ Updated last connection time:', new Date(lastConnectionTime.current).toISOString());

    // No delay for initial connection - proceed immediately
    console.log('🚀 Proceeding with WebSocket connection immediately...');

    // Double-check if we're still in a valid state
    if (isConnecting) {
      console.log('🚫 BLOCKED: Connection already in progress');
      return;
    }

    if (hasActiveConnection()) {
      console.log('🚫 BLOCKED: Active connection already exists');
      return;
    }

    if (connections.has(appointmentId)) {
      const existingSocket = connections.get(appointmentId);
      if (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING) {
        console.log('🚫 BLOCKED: Connection already established during delay');
        return;
      }
    }

    try {
      console.log('🚀 INITIATING: WebSocket connection for appointment:', appointmentId);
      setIsConnecting(true);
      setConnectionError(null);

      // Get JWT token
      const token = tokenService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Debug: Log token information (be careful with sensitive data)
      console.log('Token debug info:', {
        hasToken: !!token,
        tokenLength: token?.length,
        currentUser: user,
        currentUserRole: user?.role,
        currentUserId: user?.id
      });

      // Create WebSocket connection
      const wsUrl = `ws://localhost:8080/ws/chat?appointmentId=${appointmentId}&token=${token}`;
      console.log('Creating WebSocket with URL:', wsUrl);
      const socket = new WebSocket(wsUrl);
      
      // Set connection timeout (10 seconds)
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState === WebSocket.CONNECTING) {
          console.log('⏰ Connection timeout - closing socket');
          socket.close();
          setConnectionError('Connection timeout. Server may be down.');
          setIsConnecting(false);
          connectionAttempts.current.delete(appointmentId);
        }
      }, 10000);

      socket.onopen = () => {
        console.log('=== WebSocket onopen event fired ===');
        console.log('Appointment ID:', appointmentId);
        console.log('Socket readyState:', socket.readyState);
        console.log('Socket URL:', socket.url);
        
        // Clear connection timeout
        clearTimeout(connectionTimeout);
        
        setConnections(prev => {
          console.log('Setting connection in map for appointment:', appointmentId);
          const newMap = new Map(prev);
          newMap.set(appointmentId, socket);
          console.log('Updated connections map:', Array.from(newMap.keys()));
          return newMap;
        });
        
        setIsConnecting(false);
        setConnectionError(null); // Clear any previous errors
        console.log('isConnecting set to false');
        
        // Load chat history when connection is established
        console.log('Loading chat history for appointment:', appointmentId);
        loadChatHistory(appointmentId);
        
        // Set up inactivity timeout (30 minutes)
        const inactivityTimeout = setTimeout(() => {
          console.log('WebSocket closed due to inactivity');
          socket.close(1000, 'Inactivity timeout');
        }, 30 * 60 * 1000); // 30 minutes
        
        // Store timeout reference for cleanup
        socket.inactivityTimeout = inactivityTimeout;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleIncomingMessage(appointmentId, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onclose = (event) => {
        console.log('WebSocket disconnected for appointment:', appointmentId, 'Code:', event.code, 'Reason:', event.reason);
        
        // Clear inactivity timeout
        if (socket.inactivityTimeout) {
          clearTimeout(socket.inactivityTimeout);
          console.log('Cleared inactivity timeout for appointment:', appointmentId);
        }
        
        setConnections(prev => {
          const newConnections = new Map(prev);
          newConnections.delete(appointmentId);
          return newConnections;
        });
        
        // Remove from attempted connections so it can be retried if needed
        connectionAttempts.current.delete(appointmentId);
        console.log('🔄 Removed from attempted connections for potential retry:', appointmentId);
        
        // Set connection error based on close code
        if (event.code === 1006) {
          // Abnormal closure (server down, network issue)
          setConnectionError('Connection lost. Reconnecting...');
          console.log('🚨 Abnormal closure detected - server may be down');
        } else if (event.code === 1000) {
          // Normal closure
          setConnectionError(null);
          console.log('✅ Normal closure');
        } else {
          // Other closure codes
          setConnectionError(`Connection closed (Code: ${event.code})`);
          console.log(`⚠️ Connection closed with code: ${event.code}`);
        }
        
        // Auto-reconnection logic - respect 5-second cooldown
        if (event.code !== 1000) { // Don't reconnect on normal closure
          console.log('🔄 Will attempt reconnection after 5-second cooldown...');
          // The connectToChat function will handle the cooldown check
          setTimeout(() => {
            if (!connections.has(appointmentId) && !isConnecting) {
              console.log('🔄 Initiating reconnection...');
              connectToChat(appointmentId);
            }
          }, 5000);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error for appointment:', appointmentId, 'Error:', error);
        setConnectionError('Failed to connect to chat server. Please check if the server is running.');
        setIsConnecting(false);
        
        // Clear inactivity timeout
        if (socket.inactivityTimeout) {
          clearTimeout(socket.inactivityTimeout);
          console.log('Cleared inactivity timeout due to error for appointment:', appointmentId);
        }
        
        // Remove from attempted connections so it can be retried if needed
        connectionAttempts.current.delete(appointmentId);
        console.log('🔄 Removed from attempted connections due to error:', appointmentId);
        
        // Auto-retry after 5-second cooldown for connection errors
        console.log('🔄 Will retry connection after 5-second cooldown...');
        setTimeout(() => {
          if (!connections.has(appointmentId) && !isConnecting) {
            console.log('🔄 Retrying connection after error...');
            connectToChat(appointmentId);
          }
        }, 5000);
      };

    } catch (error) {
      console.error('Error connecting to chat:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
      
      // Remove from attempted connections so it can be retried if needed
      connectionAttempts.current.delete(appointmentId);
      console.log('🔄 Removed from attempted connections due to exception:', appointmentId);
    }
  }, [connections, isConnecting, hasActiveConnection, canMakeNewConnection]);

  // Disconnect from chat
  const disconnectFromChat = useCallback((appointmentId) => {
    const socket = connections.get(appointmentId);
    if (socket) {
      socket.close(1000, 'User disconnected');
      setConnections(prev => {
        const newConnections = new Map(prev);
        newConnections.delete(appointmentId);
        return newConnections;
      });
    }
    
    // Remove from attempted connections
    connectionAttempts.current.delete(appointmentId);
    console.log('🔄 Removed from attempted connections on disconnect:', appointmentId);
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [connections]);

  // Disconnect from all chats (for logout)
  const disconnectFromAllChats = useCallback(() => {
    console.log('🔄 Logging out - closing all WebSocket connections');
    
    // Close all WebSocket connections
    connections.forEach((socket, appointmentId) => {
      try {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'User logged out');
          console.log('✅ Closed WebSocket connection for appointment:', appointmentId);
        }
      } catch (error) {
        console.error('Error closing WebSocket connection:', error);
      }
    });
    
    // Clear all connections
    setConnections(new Map());
    
    // Clear attempted connections
    connectionAttempts.current.clear();
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Reset states
    setIsConnecting(false);
    setConnectionError(null);
    
    console.log('✅ All WebSocket connections closed for logout');
  }, [connections]);

  // Send message
  const sendMessage = useCallback((appointmentId, content, type = 'TEXT', fileUrl = null, fileMetadata = null) => {
    const socket = connections.get(appointmentId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      const message = {
        appointmentId,
        content,
        type,
        fileUrl,
        fileMetadata
      };

      socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [connections]);

  // Load chat history
  const loadChatHistory = useCallback(async (appointmentId) => {
    try {
      const token = tokenService.getAccessToken();
      const response = await fetch(`/api/chat/history/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const history = await response.json();
        console.log('Loaded chat history:', history);
        console.log('Sample message structure:', history[0]);
        setMessages(prev => new Map(prev).set(appointmentId, history));
        
        // Check if there are any unread messages from other users
        const unreadMessages = history.filter(message => 
          !message.read && message.senderId !== user?.id
        );
        
        console.log('Chat history loaded - checking for unread messages:', {
          totalMessages: history.length,
          unreadCount: unreadMessages.length,
          unreadMessageIds: unreadMessages.map(m => m.id)
        });
        
        // If there are unread messages, mark them as read and broadcast
        if (unreadMessages.length > 0) {
          console.log('📖 Found unread messages, marking as read and broadcasting...');
          setTimeout(async () => {
            try {
              const token = tokenService.getAccessToken();
              await fetch(`/api/chat/mark-read/${appointmentId}`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              console.log('✅ Successfully marked messages as read');
            } catch (error) {
              console.error('Error marking messages as read:', error);
            }
          }, 500); // Small delay to ensure messages are loaded
        } else {
          console.log('✅ No unread messages found in chat history');
        }
      } else {
        console.error('Failed to load chat history:', response.status);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [user?.id]);

  // Handle incoming messages
  const handleIncomingMessage = useCallback((appointmentId, message) => {
    // Debug: Log incoming message structure
    console.log('🔍 Incoming message structure:', {
      messageId: message.id,
      content: message.content,
      senderId: message.senderId,
      sent: message.sent,
      read: message.read,
      type: message.type,
      appointmentId: appointmentId
    });
    
    // Handle read status updates
    if (message.type === 'READ_STATUS_UPDATE') {
      console.log('Received read status update:', message);
      handleReadStatusUpdate(appointmentId, message);
      return;
    }
    
    // Handle user presence updates
    if (message.type === 'USER_PRESENCE_UPDATE') {
      console.log('👤 Received user presence update:', message);
      console.log('👤 Processing presence update for appointment:', appointmentId);
      handleUserPresenceUpdate(appointmentId, message);
      return;
    }
    
    // Filter out empty messages or system messages
    if (!message.content || message.content.trim() === '') {
      console.log('Filtering out empty message:', message);
      return;
    }
    
    // Filter out system messages (you can customize this based on your backend)
    if (message.type === 'SYSTEM' || message.type === 'CONNECTION') {
      console.log('Filtering out system message:', message);
      return;
    }
    
    setMessages(prev => {
      const newMessages = new Map(prev);
      const appointmentMessages = newMessages.get(appointmentId) || [];
      
      // Add new message to the end
      const updatedMessages = [...appointmentMessages, message];
      newMessages.set(appointmentId, updatedMessages);
      
      return newMessages;
    });
    
    // If this is a message from another user, mark it as read after a short delay
    // This simulates the user "reading" the message when it appears
    if (message.senderId !== user?.id) {
      setTimeout(() => {
        markMessagesAsRead(appointmentId);
      }, 1000); // 1 second delay to simulate reading
    }
  }, [user?.id]);

  // Handle read status updates
  const handleReadStatusUpdate = useCallback((appointmentId, readStatusUpdate) => {
    console.log('Processing read status update for appointment:', appointmentId, readStatusUpdate);
    
    setMessages(prev => {
      const newMessages = new Map(prev);
      const appointmentMessages = newMessages.get(appointmentId) || [];
      
      // Update the read status of messages that were marked as read
      const updatedMessages = appointmentMessages.map(message => {
        if (readStatusUpdate.messageIds.includes(message.id)) {
          return {
            ...message,
            read: true,
            readBy: message.readBy ? [...message.readBy, readStatusUpdate.readByUserId] : [readStatusUpdate.readByUserId]
          };
        }
        return message;
      });
      
      newMessages.set(appointmentId, updatedMessages);
      return newMessages;
    });
  }, []);

  // Handle user presence updates
  const handleUserPresenceUpdate = useCallback((appointmentId, presenceUpdate) => {
    console.log('👤 Processing user presence update for appointment:', appointmentId, presenceUpdate);
    
    // Handle both field names (isOnline and online) due to JSON serialization
    const isOnline = presenceUpdate.isOnline !== undefined ? presenceUpdate.isOnline : presenceUpdate.online;
    console.log('👤 Setting other participant online status to:', isOnline, '(from fields:', { isOnline: presenceUpdate.isOnline, online: presenceUpdate.online }, ')');
    
    setOtherParticipantOnline(prev => {
      const newMap = new Map(prev);
      newMap.set(appointmentId, isOnline);
      console.log('👤 Updated otherParticipantOnline map:', Array.from(newMap.entries()));
      return newMap;
    });
  }, []);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (appointmentId) => {
    try {
      const token = tokenService.getAccessToken();
      await fetch(`/api/chat/mark-read/${appointmentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Get messages for an appointment
  const getMessages = useCallback((appointmentId) => {
    return messages.get(appointmentId) || [];
  }, [messages]);

  // Check if connected to an appointment
  const isConnected = useCallback((appointmentId) => {
    const socket = connections.get(appointmentId);
    const connected = socket && socket.readyState === WebSocket.OPEN;
    console.log('isConnected check for', appointmentId, ':', connected, 'socket:', !!socket, 'readyState:', socket?.readyState);
    return connected;
  }, [connections]);

  // Check if other participant is online
  const isOtherParticipantOnline = useCallback((appointmentId) => {
    const isOnline = otherParticipantOnline.get(appointmentId) || false;
    console.log('👤 isOtherParticipantOnline check for', appointmentId, ':', isOnline, 'map:', Array.from(otherParticipantOnline.entries()));
    return isOnline;
  }, [otherParticipantOnline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Close all connections
      connections.forEach((socket, appointmentId) => {
        socket.close(1000, 'Component unmounted');
      });
      
      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connections]);

  // Handle tab close and page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔄 Tab/page closing - closing all WebSocket connections');
      
      // Close all WebSocket connections
      connections.forEach((socket, appointmentId) => {
        try {
          if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close(1000, 'Tab closed');
            console.log('✅ Closed WebSocket connection for appointment:', appointmentId);
          }
        } catch (error) {
          console.error('Error closing WebSocket connection:', error);
        }
      });
      
      // Clear any pending timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('🔄 Page hidden - closing WebSocket connections');
        handleBeforeUnload();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connections]);

  const value = {
    connections,
    messages,
    isConnecting,
    connectionError,
    connectToChat,
    disconnectFromChat,
    disconnectFromAllChats,
    sendMessage,
    getMessages,
    isConnected,
    isOtherParticipantOnline,
    markMessagesAsRead,
    loadChatHistory
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 