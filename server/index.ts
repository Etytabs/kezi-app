import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, checkConnection } from './db/connection';

import authRoutes from './routes/auth';
import merchantRoutes from './routes/merchants';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import storeRoutes from './routes/stores';
import journalRoutes from './routes/journal';
import healthRoutes from './routes/health';
import adminRoutes from './routes/admin';
import chatRoutes from './routes/chat';
import cycleRoutes from './routes/cycle';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/status', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/api/health-check', async (req: Request, res: Response) => {
  const dbConnected = await checkConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cycle', cycleRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

if (isProduction) {
  const staticPath = path.join(__dirname, '..', 'static-build');
  app.use(express.static(staticPath));
  
  app.use((req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
} else {
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });
}

async function startServer() {
  try {
    console.log('Connecting to database...');
    const connected = await checkConnection();
    
    if (!connected) {
      console.warn('Warning: Database connection failed. Starting server without database features.');
    } else {
      console.log('Database connected. Initializing schema...');
      try {
        await initializeDatabase();
      } catch (dbError) {
        console.warn('Warning: Database initialization had issues:', dbError);
      }
    }
    
    app.listen(PORT, () => {
      console.log(`Kezi API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health-check`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
