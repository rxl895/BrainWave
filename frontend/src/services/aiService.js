// AI Service for interacting with OpenRouter API (DeepSeek)
import { supabase } from '../lib/supabase';

const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

class AIService {
  constructor() {
    this.apiKey = API_KEY;
  }

  // Fetch messages for context
  async getGroupMessages(groupId, limit = 100) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data || [];
  }
  
  // Get file listing with metadata
  async getGroupFiles(groupId) {
    try {
      const { data, error } = await supabase
        .storage
        .from('group-files')
        .list(`${groupId}`);
        
      if (error) throw error;
      
      if (data) {
        // Get file metadata for each file
        const filesWithMetadata = await Promise.all(
          data.map(async (file) => {
            const { data: metadata } = await supabase
              .from('group_files')
              .select('*')
              .eq('file_path', `${groupId}/${file.name}`)
              .single();
              
            return {
              ...file,
              metadata: metadata || {},
              url: supabase.storage.from('group-files').getPublicUrl(`${groupId}/${file.name}`).data.publicUrl
            };
          })
        );
        
        return filesWithMetadata;
      }
      return [];
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  }

  // Generate AI response
  async generateResponse(prompt, messages, files, requestType) {
    try {
      // Format messages for context
      const messageHistory = messages.map(msg => ({
        role: "user",
        content: `${msg.sender_id}: ${msg.content}`
      })).slice(0, 20); // Limit to 20 messages for context

      // Format files for context
      const filesList = files.map(file => 
        `File: ${file.metadata?.file_name || file.name} (${file.metadata?.file_type || 'unknown type'})`
      ).join('\n');

      // System message with context and instructions
      const systemMessage = {
        role: "system",
        content: `You are StudyAI, an AI assistant for a study group. 
Your task is to help students learn by providing ${requestType || 'helpful information'}.

CONTEXT:
The study group has the following recent messages:
${messageHistory.length > 0 ? '---' : 'No messages yet.'}
${messageHistory.map(m => m.content).join('\n')}
${messageHistory.length > 0 ? '---' : ''}

The study group has shared these files:
${filesList || 'No files shared yet.'}

Based on this context, ${prompt}`
      };

      // Full messages array for the API call
      const apiMessages = [
        systemMessage,
        {
          role: "user",
          content: prompt
        }
      ];

      // Make API call to OpenRouter
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate AI response');
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return `Sorry, I couldn't generate a response. ${error.message}`;
    }
  }
}

export const aiService = new AIService(); 