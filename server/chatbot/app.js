require("dotenv").config();

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require("cors");
const Message = require("./models/message");

const app = express();

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: 'http://localhost:3001', // Must match your frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// Routes
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/send", async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Validation (unchanged)
    const lastUserMessage = messages.find(m => m.role === "user");
    const content = lastUserMessage.content.trim();

    // Save user message
    const userMessage = new Message({
      role: "user",
      content,
      timestamp: new Date()
    });
    await userMessage.save();

    // Get Ollama response
    const ollamaResponse = await axios.post('http://127.0.0.1:11434/api/chat', {
      model: "llama3",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        ...messages
      ],
      stream: false
    });

    const botResponse = ollamaResponse.data.message.content;

    // Save AI response
    const aiMessage = new Message({
      role: "assistant",
      content: botResponse,
      timestamp: new Date()
    });
    await aiMessage.save();

    // Key Fix: Return both messages in the response
    res.json({
      status: "success",
      userMessage: {
        _id: userMessage._id,
        role: "user",
        content,
        timestamp: userMessage.timestamp
      },
      aiMessage: {
        _id: aiMessage._id,
        role: "assistant",
        content: botResponse,
        timestamp: aiMessage.timestamp
      }
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ 
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err.message });
});

module.exports = app;