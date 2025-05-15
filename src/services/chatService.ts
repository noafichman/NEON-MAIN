export interface ChatResponse {
  reply: string;
  _note?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

// Convert dates to strings for storage and back to dates when retrieving
const serializeMessages = (messages: ChatMessage[]): string => {
  return JSON.stringify(messages.map(message => ({
    ...message,
    timestamp: message.timestamp.toISOString(),
  })));
};

const deserializeMessages = (data: string): ChatMessage[] => {
  try {
    const parsed = JSON.parse(data);
    return parsed.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }));
  } catch (e) {
    console.error('Error deserializing messages:', e);
    return [];
  }
};

export const saveChatMessages = (messages: ChatMessage[]): void => {
  try {
    localStorage.setItem('neon_chat_messages', serializeMessages(messages));
  } catch (e) {
    console.error('Error saving chat messages:', e);
  }
};

export const loadChatMessages = (): ChatMessage[] => {
  try {
    const data = localStorage.getItem('neon_chat_messages');
    if (data) {
      return deserializeMessages(data);
    }
  } catch (e) {
    console.error('Error loading chat messages:', e);
  }
  
  // If no messages or error, return a welcome message
  return [
    {
      id: '1',
      text: 'Welcome to the chat system. How can I assist you today?',
      sender: 'system',
      timestamp: new Date(),
    },
  ];
};

let chatSessionId: string | null = null;

export const sendMessageToWebhook = async (chatInput: string): Promise<ChatResponse> => {
  // Generate or reuse a sessionId for the chat session
  if (!chatSessionId) {
    chatSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  }

  const payload = {
    action: 'sendMessage',
    sessionId: chatSessionId,
    chatInput,
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to send message to chat server');
  }

  return await response.json();
}; 