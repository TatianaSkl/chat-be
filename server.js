import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import Message from './models/message.model.js';
import Chat from './models/chat.model.js';

const PORT = process.env.PORT || 3000;

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

const initChats = async () => {
  const count = await Chat.countDocuments();
  if (count === 0) {
    await Chat.insertMany([
      { firstName: 'Alice', lastName: 'Freedom' },
      { firstName: 'Josefina', lastName: 'Victory' },
      { firstName: 'Piter', lastName: 'Warrior' },
    ]);
  }
};

io.on('connection', socket => {
  socket.on('joinChat', chatId => {
    socket.join(chatId);
  });

  socket.on('leaveChat', chatId => {
    socket.leave(chatId);
  });

  socket.on('sendMessage', async data => {
    try {
      const message = await Message.create({
        chatId: data.chatId,
        text: data.text,
        isAutoResponse: false,
      });
      io.to(data.chatId).emit('newMessage', message);
    } catch (error) {
      console.error('Error sending message', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {});
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    await initChats();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Database connection successful');
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
