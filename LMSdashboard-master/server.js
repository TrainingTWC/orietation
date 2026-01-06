import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const port = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!apiKey 
  });
});

// Gemini insights endpoint
app.post('/api/insights', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'Gemini API key not configured',
        message: 'Please add GEMINI_API_KEY to your .env.local file' 
      });
    }

    console.log('🤖 Generating insights...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Insights generated successfully');
    res.json({ insights: text });

  } catch (error) {
    console.error('❌ Error generating insights:', error);
    
    let errorMessage = 'Failed to generate insights';
    let statusCode = 500;

    if (error.message?.includes('API_KEY') || error.message?.includes('invalid')) {
      errorMessage = 'Invalid API key. Please check your Gemini API key configuration.';
      statusCode = 401;
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      errorMessage = 'API quota exceeded. Please check your usage limits.';
      statusCode = 429;
    } else if (error.message?.includes('400')) {
      errorMessage = 'Bad request. The prompt might be too large or contain invalid content.';
      statusCode = 400;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Gemini API proxy server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔑 API Key configured: ${!!apiKey}`);
});