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

export const sendMessageToWebhook = async (message: string): Promise<ChatResponse> => {
  // List of webhook URLs to try in order
  const webhooks = [
    'https://neon12.app.n8n.cloud/webhook/9245c9ee-ab3e-4a06-9fe7-1513a512720a/chat',
    'https://neon-test.app.n8n.cloud/webhook/9245c9ee-ab3e-4a06-9fe7-1513a512720a/chat',
    'https://n8n.neonmilitaryapp.com/webhook/chat'
  ];
  
  // Prepare the request body with the message
  const requestBody = JSON.stringify({
    message,
  });
  
  let lastError: Error | null = null;
  
  // First try to connect to real webhooks
  for (let i = 0; i < webhooks.length; i++) {
    const webhookUrl = webhooks[i];
    try {
      console.log(`[chatService] Attempting webhook #${i + 1}: ${webhookUrl}`);
      console.log(`[chatService] Message: "${message}"`);
      
      // Send to current webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: requestBody,
      });
      
      console.log(`[chatService] Response status from webhook #${i + 1}:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response text');
        console.error(`[chatService] HTTP error ${response.status} from webhook #${i + 1}: ${errorText}`);
        lastError = new Error(`HTTP error ${response.status} from webhook #${i + 1}`);
        // Continue to the next webhook
        continue;
      }
      
      // Parse the response as JSON
      const result = await response.json();
      console.log(`[chatService] Successful response from webhook #${i + 1}:`, JSON.stringify(result, null, 2));
      
      // Return the successful result
      return result;
    } catch (error) {
      console.error(`[chatService] Error in webhook #${i + 1}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      // Continue to the next webhook
    }
  }
  
  // If all webhooks failed, use local mock responses
  console.log('[chatService] All webhooks failed, using local mock responses');
  
  // Convert message to lowercase for matching
  const lowerMessage = message.toLowerCase();
  
  // Generate a meaningful mock response based on the question
  let reply = "I don't have specific information about that. How can I assist you with the military tracking system?";
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    reply = "Hello! I'm the fallback chat assistant for the military tracking system. How can I help you today?";
  }
  else if (lowerMessage.includes('help')) {
    reply = "I can help you with information about the tracking system, map features, and military units. Note: I'm currently operating in offline mode.";
  }
  else if (lowerMessage.includes('weather')) {
    reply = "The weather information is displayed in the top panel of your map. It updates based on the current map center location.";
  }
  else if (lowerMessage.includes('unit') || lowerMessage.includes('force') || lowerMessage.includes('troop')) {
    reply = "You can view all military units on the main map interface. Each unit is marked with its appropriate military symbol.";
  }
  else if (lowerMessage.includes('enemy') || lowerMessage.includes('hostile') || lowerMessage.includes('threat')) {
    reply = "Hostile forces are indicated with red symbols on the map. The system displays the latest intelligence data available.";
  }
  else if (lowerMessage.includes('location') || lowerMessage.includes('where') || lowerMessage.includes('position')) {
    reply = "Current location information for all units is displayed on the map. You can use the search function to locate specific units or places.";
  }
  else if (lowerMessage.includes('map')) {
    reply = "The map is the main interface of the system. It displays units, terrain, and tactical information. You can add shapes and markers using the tools at the bottom.";
  }
  else if (lowerMessage.includes('thank')) {
    reply = "You're welcome. I'm here to assist you with the military tracking system.";
  }
  
  console.log('[chatService] Generated mock response:', reply);
  
  // Return mock response 
  return { 
    reply: reply,
    _note: "This is a local fallback response. External service is currently unavailable." 
  };
}; 