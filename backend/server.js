import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';

import authRoutes from './routes/auth.js';
import laptopRoutes from './routes/laptops.js';
import userRoutes from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

// Init Database
initDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/laptops', laptopRoutes);
app.use('/api/users', userRoutes);

// ── Production: Serve frontend build ────────────────────────────────────────
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Catch-all: serve index.html for any non-API route (React Router support)
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Frontend served from: ${distPath}`);
});
