// Mock implementation of the Supabase client for testing
import { vi } from 'vitest';

// Predefined mock data that tests can use
export const mockData = {
  users: [
    { id: 'user1', email: 'user1@example.com', full_name: 'Test User 1' },
    { id: 'user2', email: 'user2@example.com', full_name: 'Test User 2' }
  ],
  messages: [
    { id: 1, sender_id: 'user1', content: 'Hello, what is the topic for today?', created_at: '2023-01-01T12:00:00Z', group_id: '123' },
    { id: 2, sender_id: 'user2', content: 'We are discussing React hooks.', created_at: '2023-01-01T12:05:00Z', group_id: '123' }
  ],
  files: [
    { name: 'react-hooks.pdf', id: 'file1' },
    { name: 'useState-example.js', id: 'file2' }
  ],
  study_groups: [
    { id: '123', name: 'React Study Group', description: 'A group to learn React', created_by: 'user1' }
  ]
};

// Helper to create chainable query methods
const createQueryBuilder = (returnData = null) => {
  const queryMethods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 
                       'is', 'in', 'contains', 'containedBy', 'filter', 'order', 'limit', 'range', 'single', 'match'];
  
  const queryBuilder = {};
  
  // Create chainable methods that return the builder
  queryMethods.forEach(method => {
    queryBuilder[method] = vi.fn(() => queryBuilder);
  });
  
  // Add the final promise resolution
  queryBuilder.then = vi.fn(callback => Promise.resolve(callback({ data: returnData, error: null })));
  
  // Add explicit promise resolution methods
  queryBuilder.data = returnData;
  queryBuilder.error = null;
  
  return queryBuilder;
};

// Create the main supabase mock
export const supabaseMock = {
  // Table query methods
  from: vi.fn(tableName => {
    const tableData = mockData[tableName] || [];
    return {
      select: vi.fn(() => createQueryBuilder(tableData)),
      insert: vi.fn(data => createQueryBuilder([...data])),
      update: vi.fn(data => createQueryBuilder(data)),
      delete: vi.fn(() => createQueryBuilder([])),
      upsert: vi.fn(data => createQueryBuilder([...data])),
      eq: vi.fn(() => createQueryBuilder(tableData)),
      order: vi.fn(() => createQueryBuilder(tableData)),
      limit: vi.fn(() => Promise.resolve({ data: tableData, error: null })),
      single: vi.fn(() => Promise.resolve({ data: tableData[0] || null, error: null }))
    };
  }),

  // Storage methods
  storage: {
    from: vi.fn(bucketName => ({
      list: vi.fn(path => Promise.resolve({ data: mockData.files, error: null })),
      upload: vi.fn((path, file) => Promise.resolve({ 
        data: { path, id: 'mock-file-id' }, 
        error: null 
      })),
      download: vi.fn(path => Promise.resolve({
        data: new Blob(['mock file content']), 
        error: null
      })),
      remove: vi.fn(paths => Promise.resolve({ data: { path: paths }, error: null })),
      getPublicUrl: vi.fn(path => ({ 
        data: { publicUrl: `https://mock-url.com/${path}` } 
      }))
    }))
  },

  // Auth methods
  auth: {
    getUser: vi.fn(() => Promise.resolve({ 
      data: { user: mockData.users[0] }, 
      error: null 
    })),
    signIn: vi.fn(() => Promise.resolve({ 
      data: { user: mockData.users[0], session: { access_token: 'mock-token' } }, 
      error: null 
    })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
    onAuthStateChange: vi.fn(callback => {
      callback('SIGNED_IN', { user: mockData.users[0] });
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    }),
    getSession: vi.fn(() => Promise.resolve({ 
      data: { session: { access_token: 'mock-token', user: mockData.users[0] } }, 
      error: null 
    }))
  },

  // Realtime subscriptions
  channel: vi.fn(channelName => ({
    on: vi.fn((event, callback) => ({
      subscribe: vi.fn(() => {
        // Simulate a subscription by immediately calling the callback
        callback({ 
          new: { id: 'new-item', created_at: new Date().toISOString() },
          eventType: 'INSERT'
        });
        return { unsubscribe: vi.fn() };
      })
    }))
  })),

  removeChannel: vi.fn()
};

// Helper method to reset all mocks between tests
export const resetSupabaseMock = () => {
  vi.clearAllMocks();
};

// Default export for compatibility
export default supabaseMock; 