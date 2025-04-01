import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Video, Phone, Menu, X, UserPlus, ArrowLeft, Trash2, Search, XCircle, PaperclipIcon, File, Download, Maximize2, Eye } from 'lucide-react';
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
  
  // File sharing functionality
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = React.useRef(null);
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  // Function to navigate back to dashboard
  const handleBack = () => {
    navigate('/dash');
  };

  // Function to toggle search bar
  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) {
      // Clear search when closing
      setSearchQuery('');
      setSearchResults([]);
      setCurrentResultIndex(0);
    }
  };

  // Handle escape key to exit search mode
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isSearching) {
        toggleSearch();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isSearching]);

  // Function to search messages
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const query = searchQuery.toLowerCase();
    const results = messages.filter(message => 
      message.content.toLowerCase().includes(query)
    );
    
    setSearchResults(results);
    setCurrentResultIndex(0);
    
    // Scroll to first result if exists
    if (results.length > 0) {
      const element = document.getElementById(`message-${results[0].id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('bg-yellow-100');
        setTimeout(() => element.classList.remove('bg-yellow-100'), 1500);
      }
    }
  };

  // Navigate through search results
  const navigateResults = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentResultIndex(newIndex);
    
    const element = document.getElementById(`message-${searchResults[newIndex].id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-yellow-100');
      setTimeout(() => element.classList.remove('bg-yellow-100'), 1500);
    }
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
        
        // Fetch files for this group
        await fetchGroupFiles();
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

  // Function to fetch files for the group
  const fetchGroupFiles = async () => {
    try {
      const { data, error } = await supabase
        .storage
        .from('group-files')
        .list(`${id}`);
        
      if (error) throw error;
      
      if (data) {
        // Get file metadata for each file
        const filesWithMetadata = await Promise.all(
          data.map(async (file) => {
            const { data: metadata } = await supabase
              .from('group_files')
              .select('*')
              .eq('file_path', `${id}/${file.name}`)
              .single();
              
            return {
              ...file,
              metadata: metadata || {},
              url: supabase.storage.from('group-files').getPublicUrl(`${id}/${file.name}`).data.publicUrl
            };
          })
        );
        
        setFiles(filesWithMetadata);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };
  
  // Function to handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('group-files')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Store metadata in database
      const { error: metadataError } = await supabase
        .from('group_files')
        .insert({
          group_id: id,
          uploader_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString()
        });
        
      if (metadataError) throw metadataError;
      
      // Add file message to chat
      await supabase
        .from('messages')
        .insert({
          content: `Shared a file: ${file.name}`,
          sender_id: user.id,
          group_id: id,
          is_file: true,
          file_path: filePath
        });
      
      // Refresh files
      await fetchGroupFiles();
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = null;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };
  
  // Function to toggle files panel
  const toggleFilesPanel = () => {
    setShowFilesPanel(!showFilesPanel);
    
    // If opening panel, refresh files list
    if (!showFilesPanel) {
      fetchGroupFiles();
    }
  };
  
  // Function to preview file
  const handleFilePreview = (file) => {
    setFilePreview(file);
  };
  
  // Function to close file preview
  const closeFilePreview = () => {
    setFilePreview(null);
  };

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

  // Function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Function to get file preview content based on file type
  const getFilePreviewContent = (file) => {
    const fileType = file.metadata.file_type || '';
    const fileUrl = file.url;
    
    if (fileType.startsWith('image/')) {
      return (
        <img 
          src={fileUrl} 
          alt={file.metadata.file_name || file.name}
          className="max-w-full max-h-[70vh] object-contain"
        />
      );
    } else if (fileType.startsWith('video/')) {
      return (
        <video 
          src={fileUrl} 
          controls 
          className="max-w-full max-h-[70vh]"
        >
          Your browser does not support video playback.
        </video>
      );
    } else if (fileType.startsWith('audio/')) {
      return (
        <audio 
          src={fileUrl} 
          controls 
          className="w-full"
        >
          Your browser does not support audio playback.
        </audio>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <iframe 
          src={fileUrl} 
          title={file.metadata.file_name || file.name}
          className="w-full h-[70vh]"
        ></iframe>
      );
    } else {
      return (
        <div className="text-center p-10">
          <div className="bg-gray-100 p-10 rounded-lg">
            <File size={80} className="mx-auto mb-4 text-gray-600" />
            <h4 className="font-medium text-gray-900 mb-2">{file.metadata.file_name || file.name}</h4>
            <p className="text-gray-500 mb-4">This file cannot be previewed</p>
            <a
              href={fileUrl}
              download={file.metadata.file_name || file.name}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              <Download size={18} />
              Download
            </a>
          </div>
        </div>
      );
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
          <div className="flex items-center gap-3">
            {isSearching ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in conversation..."
                    className="w-full py-1 pl-8 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    autoFocus
                  />
                  <Search className="absolute left-2 top-1.5 w-4 h-4 text-gray-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                >
                  Search
                </button>
                {searchResults.length > 0 && (
                  <div className="flex items-center ml-2">
                    <button
                      type="button"
                      onClick={() => navigateResults('prev')}
                      className="px-1 py-1 text-gray-600 hover:bg-gray-100 rounded-l border border-gray-300"
                    >
                      &uarr;
                    </button>
                    <div className="px-2 text-xs border-t border-b border-gray-300">
                      {currentResultIndex + 1}/{searchResults.length}
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateResults('next')}
                      className="px-1 py-1 text-gray-600 hover:bg-gray-100 rounded-r border border-gray-300"
                    >
                      &darr;
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={toggleSearch}
                  className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Close search"
                >
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button
                onClick={toggleSearch}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-full"
                title="Search messages"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
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
            messages.map((message) => {
              // Check if this message is a search result
              const isSearchResult = searchResults.includes(message);
              const isCurrentResult = isSearchResult && searchResults[currentResultIndex]?.id === message.id;
              
              // Function to highlight search term in message content
              const highlightSearchMatch = (text, searchTerm) => {
                if (!searchTerm || !isSearchResult) return text;
                
                const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                const parts = text.split(regex);
                
                return parts.map((part, i) => 
                  regex.test(part) ? <mark key={i} className="bg-yellow-200">{part}</mark> : part
                );
              };
              
              return (
                <div 
                  id={`message-${message.id}`}
                  key={message.id} 
                  className={`flex items-start gap-3 group px-2 py-1 rounded transition-colors ${
                    isCurrentResult ? 'bg-yellow-50' : isSearchResult ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
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
                      <p className="text-gray-800 break-words">
                        {message.is_file ? (
                          <div className="flex items-center gap-2 text-purple-600 hover:text-purple-800">
                            <File size={16} />
                            <span 
                              className="underline cursor-pointer"
                              onClick={() => {
                                // Try to find the file in our files array
                                const file = files.find(f => f.metadata.file_path === message.file_path);
                                if (file) {
                                  handleFilePreview(file);
                                } else {
                                  // If not found, generate a simple file object with the URL
                                  const fileName = message.content.replace('Shared a file: ', '');
                                  const fileUrl = supabase.storage.from('group-files').getPublicUrl(message.file_path).data.publicUrl;
                                  handleFilePreview({
                                    name: fileName,
                                    metadata: {
                                      file_name: fileName,
                                      file_path: message.file_path
                                    },
                                    url: fileUrl
                                  });
                                }
                              }}
                            >
                              {highlightSearchMatch(message.content, searchQuery)}
                            </span>
                          </div>
                        ) : (
                          highlightSearchMatch(message.content, searchQuery)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
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
              <label className="relative flex items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingFile}
                />
                <div className={`py-2 px-3 rounded ${uploadingFile ? 'bg-gray-400' : 'bg-gray-200 hover:bg-gray-300'} text-gray-700 cursor-pointer`}>
                  {uploadingFile ? (
                    <span className="inline-block w-5 h-5 border-2 border-t-transparent border-gray-600 rounded-full animate-spin"></span>
                  ) : (
                    <PaperclipIcon size={20} />
                  )}
                </div>
              </label>
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
        
        {/* Files button (fixed) */}
        {isUserMember && (
          <button
            onClick={toggleFilesPanel}
            className="fixed right-4 bottom-20 z-10 p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors"
            title="View group files"
          >
            <File size={20} />
          </button>
        )}
        
        {/* Files panel */}
        {showFilesPanel && (
          <div className="fixed inset-0 z-30 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="text-xl font-semibold">Group Files</h3>
                <button 
                  onClick={toggleFilesPanel} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {files.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No files have been shared in this group yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {files.map((file) => (
                      <div key={file.id || file.name} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-200 p-2 rounded">
                              <File size={24} className="text-gray-700" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-medium text-gray-900 truncate">{file.metadata.file_name || file.name}</p>
                              <p className="text-sm text-gray-500">
                                {(file.metadata.file_size || file.metadata.size) ? 
                                  formatFileSize(file.metadata.file_size || file.size) : ''}
                                {file.metadata.uploaded_at && 
                                  ` · ${new Date(file.metadata.uploaded_at).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleFilePreview(file)}
                              className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                              title="Preview file"
                            >
                              <Eye size={18} />
                            </button>
                            <a 
                              href={file.url}
                              download={file.metadata.file_name || file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                              title="Download file"
                            >
                              <Download size={18} />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* File preview modal */}
        {filePreview && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-80 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-3 border-b">
                <h3 className="font-medium truncate flex-1">{filePreview.metadata.file_name || filePreview.name}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={filePreview.url}
                    download={filePreview.metadata.file_name || filePreview.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                    title="Download file"
                  >
                    <Download size={20} />
                  </a>
                  <button 
                    onClick={() => window.open(filePreview.url, '_blank')}
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                    title="Open in new tab"
                  >
                    <Maximize2 size={20} />
                  </button>
                  <button 
                    onClick={closeFilePreview} 
                    className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
                {getFilePreviewContent(filePreview)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroupPage; 