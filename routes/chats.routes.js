import express from 'express';
import { deleteChats, getChats, postChats, putChats } from '../controllers/chats.controllers.js';

const router = express.Router();

router.get('/', getChats);
router.post('/', postChats);
router.put('/:id', putChats);
router.delete('/:id', deleteChats);

export default router;
