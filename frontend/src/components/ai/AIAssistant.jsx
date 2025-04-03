import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, ChevronDown, ChevronUp, Send, Sparkles, Loader, BookOpen, BrainCircuit, HelpCircle } from 'lucide-react';
import { aiService } from '../../services/aiService';

export const AIAssistant = ({ groupId, isOpen, onToggle }) => {
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const responseEndRef = useRef(null);
  
  const suggestionOptions = [
    { 
      id: 'summarize', 
      icon: <BookOpen size={16} />, 
      label: 'Summarize recent discussions',
      prompt: 'Please summarize the key points from recent discussions in this study group.'
    },
    { 
      id: 'quiz', 
      icon: <BrainCircuit size={16} />, 
      label: 'Generate quiz questions',
      prompt: 'Generate 5 quiz questions based on the topics discussed in this study group.'
    },
    { 
      id: 'explain', 
      icon: <HelpCircle size={16} />, 
      label: 'Explain a concept',
      prompt: 'Please explain the core concepts mentioned in the recent discussions.'
    }
  ];

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (isOpen && responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [responses, isOpen]);

  const handleSendPrompt = async (e) => {
    e?.preventDefault();
    
    if (!prompt.trim() && !selectedOption) return;
    
    const promptToSend = selectedOption ? selectedOption.prompt : prompt;
    const requestType = selectedOption ? selectedOption.label : 'a response';
    
    // Add user message to responses
    setResponses(prev => [...prev, { role: 'user', content: promptToSend, timestamp: new Date().toISOString() }]);
    
    // Clear input and selected option
    setPrompt('');
    setSelectedOption(null);
    setShowSuggestions(false);
    setIsLoading(true);
    
    try {
      // Get group messages and files for context
      const messages = await aiService.getGroupMessages(groupId);
      const files = await aiService.getGroupFiles(groupId);
      
      // Generate AI response
      const aiResponse = await aiService.generateResponse(promptToSend, messages, files, requestType);
      
      // Add AI response to the list
      setResponses(prev => [...prev, { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setResponses(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again later.', 
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    setPrompt(option.prompt);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="bg-white border-b shadow-sm mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-indigo-600 text-white">
        <div className="flex items-center gap-2">
          <Bot size={18} />
          <h3 className="font-medium text-sm">StudyAI Assistant</h3>
        </div>
        <button 
          onClick={onToggle}
          className="text-white/80 hover:text-white"
        >
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      
      {/* Messages area */}
      <div className="p-3 space-y-3 bg-gray-50 max-h-[250px] overflow-y-auto">
        {responses.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-4 text-gray-500">
            <Sparkles size={24} className="text-indigo-500 mb-2" />
            <h4 className="font-medium text-gray-700 mb-1 text-sm">AI Study Assistant</h4>
            <p className="text-xs mb-2">Ask me to summarize discussions, create quizzes, or explain concepts!</p>
          </div>
        )}
        
        {responses.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`rounded-lg px-3 py-2 max-w-[85%] ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white' 
                  : msg.isError 
                    ? 'bg-red-50 text-red-700 border border-red-100' 
                    : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200' : 'text-gray-400'}`}>
                {formatTimestamp(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-3 bg-white text-gray-800 border border-gray-200">
              <div className="flex items-center gap-2">
                <Loader size={16} className="animate-spin text-indigo-500" />
                <span className="text-sm">Generating response...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={responseEndRef} />
      </div>
      
      {/* Suggestion pills */}
      {showSuggestions && responses.length === 0 && (
        <div className="p-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestionOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs hover:bg-indigo-100"
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input area */}
      <form onSubmit={handleSendPrompt} className="p-2 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            placeholder="Ask StudyAI anything..."
            className="flex-1 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || (!prompt.trim() && !selectedOption)}
            className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}; 