import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

import authRoutes from './routes/auth.js';
import laptopRoutes from './routes/laptops.js';
import userRoutes from './routes/users.js';
import dbUsersRoutes from './routes/db_users.js';
import dbConfigsRoutes from './routes/db_configs.js';
import dbEmployeeProfilesRoutes from './routes/db_employee_profiles.js';
import gitlabRoutes from './routes/gitlab.js';
import configRoutes from './routes/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/laptops', laptopRoutes);
app.use('/api/users', userRoutes);
app.use('/api/db-users', dbUsersRoutes);
app.use('/api/db-configs', dbConfigsRoutes);
app.use('/api/db-employee-profiles', dbEmployeeProfilesRoutes);
app.use('/api/gitlab', gitlabRoutes);
app.use('/api/config', configRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
