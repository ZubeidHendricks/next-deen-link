'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sendMessageAction, markMessagesAsReadAction } from '../actions';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const conversationId = params.id as string;

  // Fetch conversation and messages
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [conversationResponse, messagesResponse, userResponse] = await Promise.all([
          fetch(`/api/messages/conversations/${conversationId}`),
          fetch(`/api/messages/conversations/${conversationId}/messages`),
          fetch('/api/auth/me')
        ]);

        if (!conversationResponse.ok || !messagesResponse.ok || !userResponse.ok) {
          throw new Error('Failed to fetch conversation data');
        }

        const conversationData = await conversationResponse.json();
        const messagesData = await messagesResponse.json();
        const userData = await userResponse.json();

        setConversation(conversationData);
        setMessages(messagesData);
        setCurrentUser(userData);
        setLoading(false);

        // Mark messages as read
        await markMessagesAsReadAction({ conversationId: parseInt(conversationId) });
      } catch (err) {
        console.error('Error fetching conversation:', err);
        setError('Failed to load conversation. Please try again.');
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchData();
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up polling for new messages
  useEffect(() => {
    if (!conversationId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/messages/conversations/${conversationId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const newMessages = await response.json();
        
        // Check if we have new messages
        if (newMessages.length > messages.length) {
          setMessages(newMessages);
          // Mark new messages as read
          await markMessagesAsReadAction({ conversationId: parseInt(conversationId) });
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [conversationId, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setSending(true);
    setError('');
    
    try {
      const result = await sendMessageAction({
        conversationId: parseInt(conversationId),
        content: newMessage,
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        // Fetch updated messages
        const response = await fetch(`/api/messages/conversations/${conversationId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        
        const updatedMessages = await response.json();
        setMessages(updatedMessages);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8 mx-auto">
        <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow">
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-center">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 mx-auto">
        <div className="max-w-4xl p-6 mx-auto bg-white rounded-lg shadow">
          <div className="p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/dashboard/messages')}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Back to Messages
            </button>
          </div>
        </div>
      </div>
    );
  }

  const otherPerson = currentUser?.id === conversation?.parent.id 
    ? conversation?.teacher 
    : conversation?.parent;

  return (
    <div className="container h-full py-8 mx-auto">
      <div className="flex flex-col h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow">
        {/* Conversation Header */}
        <div className="p-4 border-b">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <div className="flex items-center justify-center w-10 h-10 text-white bg-blue-500 rounded-full">
                {otherPerson?.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{otherPerson?.name}</h2>
              <p className="text-sm text-gray-500">{otherPerson?.email}</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isCurrentUser = message.sender.id === currentUser?.id;
                
                return (
                  <div
                    key={message.message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p>{message.message.content}</p>
                      <p className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                        {new Date(message.message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-gray-500">No messages yet. Start the conversation!</p>
            )}
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              disabled={sending}
            />
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-r-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
