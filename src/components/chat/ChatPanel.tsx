import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader } from 'lucide-react';
import { ChatMessage, ChatResponse, loadChatMessages, saveChatMessages, sendMessageToWebhook } from '../../services/chatService';

interface ChatPanelProps {
  visible: boolean;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ visible, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved messages on initial render
  useEffect(() => {
    const savedMessages = loadChatMessages();
    setMessages(savedMessages);
  }, []);

  // Save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatMessages(messages);
    }
  }, [messages]);

  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus on input field when panel is opened
  useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('[ChatPanel] Sending message to server:', inputMessage);
      // Send message to webhook
      const data = await sendMessageToWebhook(inputMessage);
      console.log('[ChatPanel] Received raw response from server:', data);
      
      // Extract the reply from the response
      const replyText = data.reply;
      
      // Log if this is a fallback response
      if (data._note) {
        console.log('[ChatPanel] Fallback note:', data._note);
      }
      
      // Add system response
      const systemMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: replyText || 'Sorry, I could not process your request.',
        sender: 'system',
        timestamp: new Date(),
      };
      console.log('[ChatPanel] Adding system message to chat:', systemMessage.text);
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error('[ChatPanel] Error sending message:', error);
      // Add more detailed error message
      let errorMsg = 'Error connecting to the chat service. Please try again later.';
      
      // If there's a specific error message, include it
      if (error instanceof Error) {
        errorMsg = `Error: ${error.message}. Please check your network connection and try again.`;
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: errorMsg,
        sender: 'system',
        timestamp: new Date(),
      };
      console.log('[ChatPanel] Adding error message to chat:', errorMessage.text);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="absolute top-16 right-4 z-50 w-80 h-[30rem] bg-gray-900/40 backdrop-blur-sm border border-gray-800/30 rounded-lg overflow-hidden animate-slideIn flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/30 bg-gray-900/40">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          <span className="font-medium text-sm text-white">Chat</span>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-300 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.sender === 'user' 
                  ? 'bg-blue-600/30 border border-blue-500/30' 
                  : 'bg-gray-800/40 border border-gray-700/30'
              }`}
            >
              <div className={`${message.sender === 'user' ? 'text-blue-100' : 'text-gray-200'}`}>
                {message.text}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2 text-sm text-gray-300 flex items-center">
              <Loader size={14} className="animate-spin text-blue-400 mr-2" />
              <span>Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-gray-800/30 p-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800/40 text-white text-sm rounded-lg border border-gray-700/30 px-3 py-2 focus:outline-none focus:border-blue-500/30"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            className={`p-2 rounded-lg ${
              inputMessage.trim() && !isLoading
                ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/50'
                : 'bg-gray-800/30 text-gray-500 cursor-not-allowed'
            }`}
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel; 