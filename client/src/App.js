import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, Paper, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get('http://localhost:3000/messages');
      setMessages(response.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      addSystemMessage('Failed to load chat history');
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    try {
      // Optimistically add user message
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      const response = await axios.post('http://localhost:3000/send', {
        messages: [{ role: "user", content: input }]
      });

      // Add both messages from response
      setMessages(prev => [
        ...prev,
        response.data.userMessage,
        response.data.aiMessage
      ]);
    } catch (err) {
      console.error("Request failed:", err);
      addSystemMessage(err.response?.data?.error || "Failed to get AI response");
    } finally {
      setIsLoading(false);
    }
  };

  const addSystemMessage = (content) => {
    setMessages(prev => [...prev, {
      role: 'system',
      content,
      timestamp: new Date(),
      isError: true
    }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box sx={{ maxWidth: 600, margin: 'auto', padding: 2 }}>
      <Typography variant="h4" gutterBottom style={{color:"#1EBEA5",textAlign:"center"}}>AI Chatbot</Typography>
      <Paper elevation={3} sx={{ height: 400, overflow: 'auto', marginBottom: 2 }}>
        <List>
          {messages.map((message, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                textAlign: message.role === 'user' ? 'right' : 'left'
              }}
            >
              <ListItemText 
                primary={message.content} 
                secondary={formatTime(message.timestamp)}
                sx={{
                  backgroundColor: message.role === 'user' ? '#1EBEA5' : '#273443 ',
                  color:"white",
          
                  fontWeight: message.isError ? 'bold' : 'normal',
                  padding: 2,
                  borderRadius: 2,
                  maxWidth: '70%',
                  display: 'inline-block',
                  wordBreak: 'break-word'
                }}
              />
            </ListItem>
          ))}
          {isLoading && (
            <ListItem sx={{ justifyContent: 'flex-start' }}>
              <CircularProgress size={24} />
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
        />
        <Button style={{backgroundColor:"#1EBEA5",color:"white"}}
          variant="contained" 
          onClick={handleSend}
          disabled={isLoading || input.trim() === ''}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;