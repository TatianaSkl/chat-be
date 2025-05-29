import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import chatRoutes from './routes/chats.routes.js';
import messageRoutes from './routes/messages.routes.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/chats', chatRoutes);
app.use('/messages', messageRoutes);

export default app;
