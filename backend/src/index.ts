import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRouter from './routes/auth';
import itineraryRouter from './routes/itinerary';
import bookingRouter from './routes/booking';
import socialRouter from './routes/social';
import tripRouter from './routes/trip';
import adminRouter from './routes/admin';
import destinationRouter from './routes/destination';
import notificationRouter from './routes/notification';
import assistantRouter from './routes/assistant';
import gamificationRouter from './routes/gamification';
import { User } from './models/User';
import { Post } from './models/Post';
import { DestinationImage } from './models/DestinationImage';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'Healthy', timestamp: new Date() });
});

// API Routes
app.use('/api/v1', authRouter);
app.use('/api/v1', itineraryRouter);
app.use('/api/v1', bookingRouter);
app.use('/api/v1', socialRouter);
app.use('/api/v1', tripRouter);
app.use('/api/v1', adminRouter);
app.use('/api/v1', destinationRouter);
app.use('/api/v1', notificationRouter);
app.use('/api/v1', assistantRouter);
app.use('/api/v1', gamificationRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

// DB Connection & Seeder
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wanderwise';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB Connected Successfully.');
    await seedInitialData();
    // Clear old destination image cache to allow high-precision regeneration
    await DestinationImage.deleteMany({});
    console.log('Cleared old DestinationImage cache to regenerate with high-precision pipeline.');
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`TravelSphere AI Backend Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Seeder function to populate initial users & feed posts
async function seedInitialData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping seeder.');
      return;
    }

    console.log('Seeding initial developer data...');

    // 1. Create seed users
    const user1 = new User({
      phone: '+919999999999',
      name: 'Rohan Sharma',
      email: 'rohan@gmail.com',
      bio: 'Travel blogger, mountain lover, explorer.',
      home_city: 'Delhi',
      travel_preferences: ['mountain', 'adventure', 'budget'],
      profile_photo_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      followers_count: 142,
      following_count: 98,
      posts_count: 2
    });
    await user1.save();

    const user2 = new User({
      phone: '+918888888888',
      name: 'Ananya Iyer',
      email: 'ananya@gmail.com',
      bio: 'Beach baby, food finder, photography enthusiast.',
      home_city: 'Mumbai',
      travel_preferences: ['beach', 'romantic', 'family'],
      profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      followers_count: 320,
      following_count: 240,
      posts_count: 2
    });
    await user2.save();

    // 2. Create seed posts
    const post1 = new Post({
      user_id: user1._id,
      media_urls: ['https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800'],
      media_types: ['image'],
      caption: 'Waking up to these glorious mountain views in Manali! True bliss. #mountain #travel #manali',
      destination_tag: 'Manali',
      hashtags: ['mountain', 'travel', 'manali'],
      likes_count: 42,
      likes: [user2._id],
      comments_count: 0,
      views_count: 124,
      visibility: 'everyone'
    });
    await post1.save();

    const post2 = new Post({
      user_id: user2._id,
      media_urls: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],
      media_types: ['image'],
      caption: 'Sunset strolls along the golden sand of Goa. Nothing matches this vibe. #goa #beach #sunset',
      destination_tag: 'Goa',
      hashtags: ['goa', 'beach', 'sunset'],
      likes_count: 88,
      likes: [user1._id],
      comments_count: 0,
      views_count: 320,
      visibility: 'everyone'
    });
    await post2.save();

    console.log('Seeder completed successfully.');
  } catch (error) {
    console.error('Seeder execution error:', error);
  }
}
// Touched for nodemon restart once again
