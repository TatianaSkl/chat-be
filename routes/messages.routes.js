import express from 'express';
import { getMessage, postMessage, sendRandomMessage } from '../controllers/messages.controllers.js';

const router = express.Router();

let randomMessageInterval = null;

router.get('/:chatId', getMessage);
router.post('/:chatId', postMessage);
router.post('/random/toggle', (req, res) => {
  const { enabled } = req.body;
  const io = req.app.get('io');

  if (enabled && !randomMessageInterval) {
    randomMessageInterval = setInterval(() => {
      sendRandomMessage(io);
    }, 10000);

    res.json({ message: 'Random messages enabled' });
  } else if (!enabled && randomMessageInterval) {
    clearInterval(randomMessageInterval);
    randomMessageInterval = null;

    res.json({ message: 'Random messages disabled' });
  } else {
    res.json({ message: 'No changes' });
  }
});

export default router;
