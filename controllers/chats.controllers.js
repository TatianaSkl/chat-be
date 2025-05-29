import Chat from '../models/chat.model.js';

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.aggregate([
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chatId',
          as: 'messages',
        },
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: [{ $slice: [{ $reverseArray: '$messages' }, 1] }, 0] },
        },
      },
      {
        $project: {
          messages: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error receiving chats' });
  }
};

export const postChats = async (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First and last name are required' });
  }

  try {
    const newChat = await Chat.create({ firstName, lastName });
    const io = req.app.get('io');
    io.emit('chatCreated', newChat);
    res.status(201).json(newChat);
  } catch (err) {
    res.status(500).json({ error: 'Error creating chat' });
  }
};

export const deleteChats = async (req, res) => {
  try {
    const deletedChat = await Chat.findByIdAndDelete(req.params.id);
    if (deletedChat) {
      const io = req.app.get('io');
      io.emit('chatDeleted', req.params.id);
    }
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting chat' });
  }
};

export const putChats = async (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First and last name are required' });
  }

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName },
      { new: true }
    );
    const io = req.app.get('io');
    io.emit('chatUpdated', updatedChat);
    res.json(updatedChat);
  } catch (err) {
    res.status(500).json({ error: 'Error updating chat' });
  }
};
