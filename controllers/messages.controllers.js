import axios from 'axios';
import https from 'https';
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
import Message from '../models/message.model.js';
import Chat from '../models/chat.model.js';

export const getMessage = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Error receiving messages' });
  }
};

export const postMessage = async (req, res) => {
  const { text } = req.body;
  const { chatId } = req.params;
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Message text cannot be empty' });
  }

  try {
    const userMessage = await Message.create({
      chatId,
      text: text.trim(),
      isAutoResponse: false,
    });
    const io = req.app.get('io');
    io.to(chatId).emit('newMessage', userMessage);

    setTimeout(async () => {
      try {
        const quoteRes = await axios.get('https://favqs.com/api/qotd', { httpsAgent });
        const quote = quoteRes.data?.quote;
        const quoteText = quote?.body || 'Inspirational quote of the day!';
        const quoteAuthor = quote?.author || 'Unknown';

        const autoMessage = await Message.create({
          chatId,
          text: ` "${quoteText}" - ${quoteAuthor}`,
          isAutoResponse: true,
        });

        io.to(chatId).emit('newMessage', autoMessage);

        io.emit('autoResponseSent', {
          chatId,
          message: autoMessage,
          quote: {
            text: quoteText,
            author: quoteAuthor,
          },
        });
      } catch (error) {
        console.error(error);

        const fallbackMessage = await Message.create({
          chatId,
          text: 'Sorry, could not get a quote.',
          isAutoResponse: true,
        });

        io.to(chatId).emit('newMessage', fallbackMessage);

        io.emit('autoResponseSent', {
          chatId,
          message: fallbackMessage,
          fallback: true,
        });
      }
    }, 3000);

    res.status(201).json(userMessage);
  } catch (err) {
    res.status(500).json({ error: 'Error sending message' });
  }
};

export const sendRandomMessage = async io => {
  try {
    const chats = await Chat.find();
    if (chats.length === 0) return;
    const randomChat = chats[Math.floor(Math.random() * chats.length)];
    const quoteRes = await axios.get('https://favqs.com/api/qotd');
    const quoteText = quoteRes.data.quote.body || 'Random message!';

    const randomMessage = await Message.create({
      chatId: randomChat._id,
      text: quoteText,
      isAutoResponse: true,
    });

    io.to(randomChat._id.toString()).emit('newMessage', randomMessage);
    io.emit('randomMessageNotification', {
      chatId: randomChat._id,
      chatName: `${randomChat.firstName} ${randomChat.lastName}`,
      message: randomMessage,
    });
  } catch (error) {
    console.error('Error sending random message', error);
  }
};
