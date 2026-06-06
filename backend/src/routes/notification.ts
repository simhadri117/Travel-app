import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../services/auth';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notification';

const router = Router();

// 1. Get user notifications
router.get('/notifications', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  try {
    const list = await getNotifications(userId);
    return res.json({ success: true, data: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Mark all as read
router.put('/notifications/read-all', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  try {
    await markAllAsRead(userId);
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Mark single as read
router.put('/notifications/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notif = await markAsRead(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    return res.json({ success: true, data: notif });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Delete single notification
router.delete('/notifications/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notif = await deleteNotification(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    return res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
