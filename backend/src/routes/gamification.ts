import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../services/auth';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { Post } from '../models/Post';

const router = Router();

router.get('/rewards/stats', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Dynamic calculations based on user actions
    const bookingCount = await Booking.countDocuments({ user_id: userId, status: 'confirmed' });
    const postCount = await Post.countDocuments({ user_id: userId });

    // Points rules
    const calculatedPoints = 150 + (bookingCount * 250) + (postCount * 100);
    
    // Level boundary check
    let level = 'Beginner Traveler 🚶';
    let progressToNext = 0;
    if (calculatedPoints >= 2000) {
      level = 'Globe Trotter Pro ✈️';
      progressToNext = Math.min(100, Math.round(((calculatedPoints - 2000) / 3000) * 100));
    } else if (calculatedPoints >= 800) {
      level = 'Nomadic Explorer 🧭';
      progressToNext = Math.round(((calculatedPoints - 800) / 1200) * 100);
    } else {
      progressToNext = Math.round((calculatedPoints / 800) * 100);
    }

    // Badges
    const badges = ['Starter Badge 🛡️'];
    if (bookingCount > 0) badges.push('First Class Flyer ✈️');
    if (postCount >= 2) badges.push('Social Influencer 📸');
    if (calculatedPoints > 1000) badges.push('Nomad Legend 👑');

    // Update user profile with calculations
    user.points = calculatedPoints;
    user.badges = badges;
    await user.save();

    return res.json({
      success: true,
      data: {
        points: calculatedPoints,
        level,
        progress_to_next: progressToNext,
        badges,
        referral_code: user.referral_code || `${userId.substring(0, 5).toUpperCase()}_REF`,
        referred_count: Math.floor(calculatedPoints / 500) // Simulated count
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
