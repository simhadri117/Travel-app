import { Notification } from '../models/Notification';
import { Types } from 'mongoose';

export async function sendNotification(userId: string | Types.ObjectId, title: string, body: string, type: string) {
  try {
    const notif = new Notification({
      user_id: new Types.ObjectId(userId),
      title,
      body,
      type,
      read: false
    });
    await notif.save();
    
    // In production, we would call FCM admin SDK:
    // admin.messaging().sendToDevice(userToken, { notification: { title, body } });
    console.log(`[Notification FCM Simulated] Sent to ${userId}: "${title}" - ${body}`);
    return notif;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

export async function getNotifications(userId: string) {
  return Notification.find({ user_id: new Types.ObjectId(userId) }).sort({ created_at: -1 });
}

export async function markAsRead(notificationId: string) {
  return Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
}

export async function markAllAsRead(userId: string) {
  return Notification.updateMany({ user_id: new Types.ObjectId(userId), read: false }, { read: true });
}

export async function deleteNotification(notificationId: string) {
  return Notification.findByIdAndDelete(notificationId);
}
