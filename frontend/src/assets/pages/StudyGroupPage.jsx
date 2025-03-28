import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Video, Phone, Menu, X, UserPlus, ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CallModal } from '../../components/calls/CallModal';

const StudyGroupPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isUserMember, setIsUserMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const [deletingMessage, setDeletingMessage] = useState(null);

  // Function to navigate back to dashboard
  const handleBack = () => {
    navigate('/dash');
  };

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          .select('*')
          .eq('study_group_id', id);

        if (membersError) throw membersError;
        
        // Check if current user is a member
        setIsUserMember(membersData.some(member => member.user_id === user.id));
        
        // Instead of trying to get profiles from a table, we'll use the member data directly
        // and add placeholder profile info where needed
        const membersWithBasicInfo = membersData.map(member => ({
          id: member.user_id,
          role: member.role,
          // Default values that will be displayed until we get real user info
          full_name: 'User',
          avatar_url: null
        }));
        
        setUsers(membersWithBasicInfo);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('group_id', id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        
        // Use simple message data without trying to join with user profiles
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
        // Add sender information to the new message
        const newMessage = {
          ...payload.new,
          // We'll identify if the message is from the current user or not
          sender_id: payload.new.sender_id
        };
        setMessages(prev => [...prev, newMessage]);
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

    // Create the message object
    const newMessageObject = {
      id: `temp-${Date.now()}`, // Temporary ID until we get the real one from the server
      content: newMessage,
      sender_id: user.id,
      group_id: id,
      created_at: new Date().toISOString()
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, newMessageObject]);
    setNewMessage(''); // Clear input immediately

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          sender_id: user.id,
          group_id: id,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      // On error, we could remove the optimistic message or show an error indicator
      setMessages(prev => prev.filter(msg => msg.id !== newMessageObject.id));
      alert('Failed to send message. Please try again.');
    }
  };

  const handleStartCall = (type) => {
    setCallType(type);
    setCallActive(true);
  };

  const handleJoinGroup = async () => {
    if (!user || isUserMember) return;
    
    setJoinLoading(true);
    try {
      // First check if the user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('study_group_members')
        .select('*')
        .eq('study_group_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      // If already a member, just update the UI state
      if (existingMember) {
        setIsUserMember(true);
        
        // Refresh members list using the simplified approach
        const { data: refreshedMembers, error: refreshError } = await supabase
          .from('study_group_members')
          .select('*')
          .eq('study_group_id', id);
          
        if (!refreshError && refreshedMembers) {
          const updatedMembers = refreshedMembers.map(member => ({
            id: member.user_id,
            role: member.role,
            full_name: member.user_id === user.id ? user.user_metadata?.full_name || 'You' : 'User',
            avatar_url: null
          }));
          
          setUsers(updatedMembers);
        }
        
        return;
      }
      
      // If not a member, add them as a member
      const { error } = await supabase
        .from('study_group_members')
        .insert({
          study_group_id: id,
          user_id: user.id,
          role: 'member'
        });
        
      if (error) throw error;
      
      // Add the current user to the members list with available metadata
      setUsers(prevUsers => [
        ...prevUsers, 
        {
          id: user.id,
          role: 'member',
          full_name: user.user_metadata?.full_name || 'You',
          avatar_url: user.user_metadata?.avatar_url || null
        }
      ]);
      
      setIsUserMember(true);
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join the group. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  // Function to handle message deletion
  const handleDeleteMessage = async (messageId) => {
    if (deletingMessage) return; // Prevent multiple deletion requests
    
    // Ask for confirmation before deleting
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    setDeletingMessage(messageId);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      // Remove message from the UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    } finally {
      setDeletingMessage(null);
    }
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
                      w-64 bg-[#F7EFE5] text-white p-4 flex flex-col fixed lg:relative h-full z-10`}>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-black">{group.name}</h2>
          <p className="text-sm text-purple-600">{group.subject}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <h3 className="flex items-center gap-2 text-sm font-medium text-black mb-2">
            <Users size={16} />
            MEMBERS ({users.length}/{group.max_participants})
          </h3>
          <ul className="space-y-3">
            {users.map((user) => (
              <li key={user.id} className="flex items-center gap-2">
                <div className="relative">
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || user.id.substring(0, 5)}&background=random`} 
                    alt={user.full_name || user.id.substring(0, 5)}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                </div>
                <span className="text-sm text-black">
                  {user.full_name || (user.id === user?.id ? 'You' : `User ${user.id.substring(0, 5)}`)}
                  {user.id === group.owner_id && (
                    <span className="ml-2 text-xs bg-yellow-400 text-gray-800 px-1.5 rounded">owner</span>
                  )}
                  {user.role === 'admin' && (
                    <span className="ml-2 text-xs bg-purple-500 text-white px-1.5 rounded">admin</span>
                  )}
                  {user.role === 'member' && user.id !== group.owner_id && (
                    <span className="ml-2 text-xs bg-blue-400 text-white px-1.5 rounded">member</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          
          {!isUserMember && !group.is_private && (
            <button
              onClick={handleJoinGroup}
              disabled={joinLoading}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {joinLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></span>
                  Joining...
                </span>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Join Group</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          {isUserMember && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Main content: Chat */}
      <div className="flex-1 flex flex-col lg:ml-0 ml-0">
        {/* Chat header */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 text-purple-600 mr-2" />
            <h2 className="font-bold text-black text-lg"># {group.name}</h2>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
          {!isUserMember ? (
            <div className="text-center text-gray-500 my-8">
              <p>Join the group to see messages and participate in discussions.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 my-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex items-start gap-3 group hover:bg-gray-50 px-2 py-1 rounded">
                <img 
                  src={`https://ui-avatars.com/api/?name=${message.sender_id === user.id ? 'You' : message.sender_id.substring(0, 5)}&background=random`} 
                  alt={message.sender_id === user.id ? 'You' : `User ${message.sender_id.substring(0, 5)}`}
                  className="w-10 h-10 rounded-full mt-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start gap-2 justify-between w-full">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-black">
                        {message.sender_id === user.id ? 'You' : `User ${message.sender_id.substring(0, 5)}`}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.sender_id === user.id && (
                      <button 
                        onClick={() => handleDeleteMessage(message.id)}
                        disabled={deletingMessage === message.id}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0 ${deletingMessage === message.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Delete message"
                      >
                        {deletingMessage === message.id ? (
                          <span className="inline-block w-4 h-4 border-2 border-t-transparent border-red-500 rounded-full animate-spin"></span>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="w-full text-left">
                    <p className="text-gray-800 break-words">{message.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="px-4 py-3 bg-white border-t">
          {isUserMember ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                autoComplete="off"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 transition-colors"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="text-center text-gray-500">
              <p>Join the group to send messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyGroupPage; 