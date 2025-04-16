import { describe, test, expect, beforeEach, vi } from 'vitest';
import { aiService } from '../../services/aiService';
import { supabase } from '../../lib/supabase';

// Mock console.error
console.error = vi.fn();

// Mock data
const mockMessages = [
  { id: 1, sender_id: 'user1', content: 'Hello, what is the topic for today?', created_at: '2023-01-01T12:00:00Z', group_id: '123' },
  { id: 2, sender_id: 'user2', content: 'We are discussing React hooks.', created_at: '2023-01-01T12:05:00Z', group_id: '123' }
];

const mockFiles = [
  { name: 'react-hooks.pdf', id: 'file1' },
  { name: 'useState-example.js', id: 'file2' }
];

const mockFileMetadata = {
  file_path: '123/react-hooks.pdf',
  file_name: 'React Hooks Guide',
  file_type: 'application/pdf',
  file_size: 1024000
};

// Setup more detailed mocks
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockOrder = vi.fn().mockReturnThis();
const mockLimit = vi.fn().mockImplementation(() => Promise.resolve({ data: mockMessages, error: null }));
const mockSingle = vi.fn().mockImplementation(() => Promise.resolve({ data: mockFileMetadata, error: null }));

const mockList = vi.fn().mockImplementation(() => Promise.resolve({ data: mockFiles, error: null }));
const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com/test.pdf' } });

// Mock the supabase module
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: mockSelect,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle
    })),
    storage: {
      from: vi.fn().mockImplementation(() => ({
        list: mockList,
        getPublicUrl: mockGetPublicUrl
      }))
    }
  }
}));

// Mock global fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: 'Mock AI response for testing' } }]
    })
  })
);

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations for each test
    mockSelect.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockReturnThis();
    mockLimit.mockImplementation(() => Promise.resolve({ data: mockMessages, error: null }));
    mockSingle.mockImplementation(() => Promise.resolve({ data: mockFileMetadata, error: null }));
    mockList.mockImplementation(() => Promise.resolve({ data: mockFiles, error: null }));
  });

  describe('getGroupMessages', () => {
    test('should fetch messages from supabase', async () => {
      const groupId = '123';
      const result = await aiService.getGroupMessages(groupId);
      
      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(mockSelect).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('group_id', groupId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockMessages);
    });

    test('should handle error from supabase', async () => {
      // Override mock to return an error
      mockLimit.mockImplementationOnce(() => Promise.resolve({ data: null, error: new Error('Database error') }));
      
      await expect(aiService.getGroupMessages('123')).rejects.toThrow('Database error');
    });
  });

  describe('getGroupFiles', () => {
    test('should fetch files with metadata', async () => {
      const groupId = '123';
      const result = await aiService.getGroupFiles(groupId);
      
      expect(supabase.storage.from).toHaveBeenCalledWith('group-files');
      expect(mockList).toHaveBeenCalledWith(groupId);
      
      // Should also call for metadata for each file
      expect(supabase.from).toHaveBeenCalledWith('group_files');
      
      // Result should be files with metadata added
      expect(result).toHaveLength(mockFiles.length);
      expect(result[0]).toHaveProperty('metadata');
      expect(result[0]).toHaveProperty('url');
    });

    test('should handle error from supabase storage', async () => {
      // Override mock to return an error
      mockList.mockImplementationOnce(() => Promise.resolve({ data: null, error: new Error('Storage error') }));
      
      // The implementation returns an empty array on error, not throws
      const result = await aiService.getGroupFiles('123');
      expect(result).toEqual([]);
      // Verify the error was logged
      expect(console.error).toHaveBeenCalled();
    });

    test('should return empty array if no files found', async () => {
      mockList.mockImplementationOnce(() => Promise.resolve({ data: null, error: null }));
      
      const result = await aiService.getGroupFiles('123');
      expect(result).toEqual([]);
    });
  });

  describe('generateResponse', () => {
    test('should call OpenRouter API with correct data', async () => {
      const prompt = 'Summarize the discussion';
      const messages = mockMessages;
      const files = [{ 
        ...mockFiles[0], 
        metadata: mockFileMetadata 
      }];
      const requestType = 'summary';
      
      await aiService.generateResponse(prompt, messages, files, requestType);
      
      // Check if fetch was called with right URL
      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringMatching(/^Bearer/)
          })
        })
      );
      
      // Verify the request body contains expected data
      const callData = fetch.mock.calls[0][1];
      const body = JSON.parse(callData.body);
      
      expect(body.model).toBe('deepseek/deepseek-chat');
      expect(body.messages).toHaveLength(2); // System message + user prompt
      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('You are StudyAI');
      expect(body.messages[0].content).toContain('summary');
      expect(body.messages[1].role).toBe('user');
      expect(body.messages[1].content).toBe(prompt);
    });

    test('should return AI response content', async () => {
      const response = await aiService.generateResponse('Test prompt', [], [], 'test');
      expect(response).toBe('Mock AI response for testing');
    });

    test('should handle API errors gracefully', async () => {
      // Mock a failed response
      global.fetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: { message: 'API error' } })
        })
      );
      
      const response = await aiService.generateResponse('Test prompt', [], [], 'test');
      expect(response).toContain('Sorry, I couldn\'t generate a response');
      expect(response).toContain('API error');
    });

    test('should handle network errors gracefully', async () => {
      // Mock a network error
      global.fetch.mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );
      
      const response = await aiService.generateResponse('Test prompt', [], [], 'test');
      expect(response).toContain('Sorry, I couldn\'t generate a response');
      expect(response).toContain('Network error');
    });
  });
}); 