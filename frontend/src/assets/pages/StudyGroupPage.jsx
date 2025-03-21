import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, MessageSquare, Video, Phone, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CallModal } from '../../components/calls/CallModal';

const StudyGroupPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState(null);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('study_groups')
          .select('*')
          .eq('id', id)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);

        // Fetch group members
        const { data: membersData, error: membersError } = await supabase
          .from('study_group_members')
          .select('*, profiles:user_id(*)')
          .eq('study_group_id', id);

        if (membersError) throw membersError;
        setUsers(membersData.map(member => member.profiles));

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*, profiles:sender_id(name, avatar_url)')
          .eq('group_id', id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData);
      } catch (error) {
        console.error('Error fetching group details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupDetails();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:group_id=eq.${id}`)
      .on('INSERT', payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    // Subscribe to user presence
    const presenceSubscription = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        // Update online status
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(presenceSubscription);
    };
  }, [id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user.id,
          group_id: id,
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleStartCall = (type) => {
    setCallType(type);
    setCallActive(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Study Group Not Found</h2>
          <p className="text-gray-600 mt-2">The study group you're looking for doesn't exist or you don't have access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Call Modal */}
      <CallModal 
        isOpen={callActive} 
        onClose={() => setCallActive(false)} 
        callType={callType}
        groupName={group?.name || 'Study Group'}
      />

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <button 
          onClick={() => setShowSidebar(!showSidebar)}
          className="p-2 bg-purple-600 text-white rounded-full shadow-lg"
        >
          {showSidebar ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar: Members list */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} 
                      lg:translate-x-0 transition-transform duration-300 ease-in-out
                      w-64 bg-gray-800 text-white p-4 flex flex-col fixed lg:relative h-full z-10`}>
        <div className="mb-6">
          <h2 className="text-xl font-bold">{group.name}</h2>
          <p className="text-sm text-gray-400">{group.subject}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-2">
            <Users size={16} />
            MEMBERS ({users.length}/{group.max_participants})
          </h3>
          <ul className="space-y-3">
            {users.map((user) => (
              <li key={user.id} className="flex items-center gap-2">
                <div className="relative">
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                </div>
                <span className="text-sm">
                  {user.name}
                  {user.id === group.owner_id && (
                    <span className="ml-2 text-xs bg-yellow-400 text-gray-800 px-1.5 rounded">owner</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <button 
            onClick={() => handleStartCall('voice')}
            className="flex items-center gap-2 w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-md mb-2"
          >
            <Phone size={16} />
            <span>Voice Call</span>
          </button>
          <button 
            onClick={() => handleStartCall('video')}
            className="flex items-center gap-2 w-full py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-md"
          >
            <Video size={16} />
            <span>Video Call</span>
          </button>
        </div>
      </div>

      {/* Main content: Chat */}
      <div className="flex-1 flex flex-col lg:ml-0 ml-0">
        {/* Chat header */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="font-semibold text-gray-800"># general</h2>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3">
                <img 
                  src={message.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${message.profiles?.name || 'User'}&background=random`} 
                  alt={message.profiles?.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{message.profiles?.name || 'User'}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-800">{message.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message input */}
        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button 
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupPage; 