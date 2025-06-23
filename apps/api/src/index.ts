import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { aiRoutes } from './routes/ai';
import { pdfRoutes } from './routes/pdf';
import { errorHandler } from './middleware/errorHandler';

config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware - configure Helmet to work with PDF downloads
app.use((req, res, next) => {
  // Skip certain Helmet protections for PDF routes that might interfere with binary downloads
  if (req.path === '/api/generate-pdf' || req.url.includes('/generate-pdf')) {
    helmet({
      contentSecurityPolicy: false, // Disable CSP for PDF route
      crossOriginEmbedderPolicy: false, // Allow cross-origin PDFs
      crossOriginOpenerPolicy: false, // Allow cross-origin PDFs
      crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow cross-origin resource
    })(req, res, next);
  } else {
    // Use default Helmet config for non-PDF routes
    helmet()(req, res, next);
  }
});
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Compression middleware - exclude PDF generation route to prevent binary corruption
app.use(
  compression({
    filter: (req, res) => {
      // Skip compression for PDF generation route
      if (req.path === '/api/generate-pdf' || req.url.includes('/generate-pdf')) {
        console.log('Skipping compression for PDF route:', req.path);
        return false;
      }
      // Use default compression filter for other routes
      return compression.filter(req, res);
    }
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional middleware to ensure no compression for PDF route
app.use((req, res, next) => {
  if (req.path === '/api/generate-pdf' || req.url.includes('/generate-pdf')) {
    // Set headers to prevent any interference with binary data
    res.set({
      'x-no-compression': '1',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Log detailed request information for debugging
    console.log(`PDF request received: ${req.method} ${req.url}`);
    console.log('PDF request headers:', req.headers);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to check API key configuration
app.get('/debug/api-key', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  const apiKeyLength = process.env.GEMINI_API_KEY?.length || 0;
  res.json({ 
    hasApiKey, 
    apiKeyLength,
    apiKeyPreview: process.env.GEMINI_API_KEY?.substring(0, 10) + '...' || 'Not set'
  });
});

// API routes
app.use('/api', aiRoutes);
app.use('/api', pdfRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;