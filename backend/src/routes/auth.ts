import { Router, Response } from 'express';
import { User } from '../models/User';
import { generateToken, authMiddleware, AuthRequest, verifyFirebaseIdToken } from '../services/auth';
import axios from 'axios';

const router = Router();

// Helper to send Twilio SMS
async function sendTwilioSMS(to: string, messageBody: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return false;
  }

  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('To', to);
    params.append('From', fromNumber);
    params.append('Body', messageBody);

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      params.toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return response.status === 200 || response.status === 201;
  } catch (error: any) {
    console.error('Twilio SMS sending failed:', error.response?.data || error.message);
    return false;
  }
}

// 1. Request OTP (SMS with Twilio, fallback to simulation)
const handleOtpRequest = async (req: any, res: any) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  const otpCode = '123456'; // Developer default or standard testing code
  const messageBody = `Your TravelSphere AI verification code is: ${otpCode}. Good luck on your travels!`;

  const twilioSent = await sendTwilioSMS(phone, messageBody);

  if (twilioSent) {
    console.log(`[Twilio SMS] OTP code '${otpCode}' sent to ${phone}`);
    return res.json({ success: true, message: 'OTP sent successfully via Twilio' });
  } else {
    console.log(`[SMS OTP Simulator] Sending 6-digit OTP '${otpCode}' to ${phone}`);
    return res.json({ success: true, message: 'OTP sent successfully (Simulator mode - Use code 123456 for testing)' });
  }
};

router.post('/otp/request', handleOtpRequest);
router.post('/auth/send-otp', handleOtpRequest);

// 2. Verify OTP
const handleOtpVerify = async (req: any, res: any) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ success: false, error: 'Phone and OTP are required' });
  }

  // Developer default testing bypass or standard OTP verification
  if (otp !== '123456') {
    return res.status(400).json({ success: false, error: 'Invalid OTP code' });
  }

  try {
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      user = new User({ phone });
      await user.save();
      isNewUser = true;
    }

    const token = generateToken(user._id.toString(), user.phone);
    return res.json({
      success: true,
      data: {
        token,
        is_new_user: isNewUser || !user.name,
        user
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

router.post('/otp/verify', handleOtpVerify);
router.post('/auth/verify-otp', handleOtpVerify);

// Google Login / Signup
const handleGoogleLogin = async (req: any, res: any) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Firebase ID Token is required' });
  }

  try {
    const payload = await verifyFirebaseIdToken(idToken);
    const { uid, email, name, picture } = payload;

    // Search for existing user by email or by Google/Firebase phone if available
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    }

    let isNewUser = false;

    if (!user) {
      // Create new user since they don't exist
      user = new User({
        email: email || undefined,
        name: name || 'Google User',
        profile_photo_url: picture || '',
        // Fallback phone format to bypass any dependencies expecting phone
        phone: `google_${uid.substring(0, 10)}`
      });
      await user.save();
      isNewUser = true;
    } else {
      // Update profile name and photo if they aren't set
      let updated = false;
      if (!user.name && name) {
        user.name = name;
        updated = true;
      }
      if (!user.profile_photo_url && picture) {
        user.profile_photo_url = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = generateToken(user._id.toString(), user.phone);
    return res.json({
      success: true,
      data: {
        token,
        is_new_user: isNewUser || !user.name,
        user
      }
    });
  } catch (error: any) {
    console.error('Google login verification failed:', error.message || error);
    return res.status(500).json({ success: false, error: error.message || 'Google login verification failed' });
  }
};

router.post('/auth/google', handleGoogleLogin);

// Email Login / Signup (Passwordless)
const handleEmailLogin = async (req: any, res: any) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = new User({
        email,
        name: email.split('@')[0],
        phone: `email_${email.split('@')[0]}_${Math.random().toString(36).substring(2, 6)}`
      });
      await user.save();
      isNewUser = true;
    }

    const token = generateToken(user._id.toString(), user.phone);
    return res.json({
      success: true,
      data: {
        token,
        is_new_user: isNewUser || !user.name,
        user
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

router.post('/auth/email', handleEmailLogin);

// 3. Onboard user profile
router.post('/onboard', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { name, profile_photo_url, home_city, travel_preferences } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        name,
        profile_photo_url: profile_photo_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        home_city,
        travel_preferences: travel_preferences || []
      },
      { new: true }
    );

    return res.json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get Current User Profile
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Update Profile / Preferences
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { name, bio, profile_photo_url, home_city, travel_preferences } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { name, bio, profile_photo_url, home_city, travel_preferences },
      { new: true }
    );
    return res.json({ success: true, data: user });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
