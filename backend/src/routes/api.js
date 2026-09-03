import express from 'express';
import { createTokenHandler } from '../controllers/tokenController.js';
import { listRoomsHandler, getRoomDetailsHandler } from '../controllers/roomController.js';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'web-video-api',
  });
});

// Authentication & Token Issuance
router.post('/token', createTokenHandler);

// Room Management
router.get('/rooms', listRoomsHandler);
router.get('/rooms/:roomName', getRoomDetailsHandler);

export default router;
