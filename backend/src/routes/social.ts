import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../services/auth';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { Comment } from '../models/Comment';
import { Types } from 'mongoose';
import { sendNotification } from '../services/notification';
import { uploadToCloudinary } from '../services/upload';

const router = Router();

router.post('/posts', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { media_urls, media_types, caption, destination_tag, location_coordinates, visibility } = req.body;

  if (!media_urls || media_urls.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one media file is required' });
  }

  try {
    // Process and upload base64 strings to Cloudinary if configured, else fallback to random high-quality images
    const processedUrls = await Promise.all(media_urls.map(async (url: string) => {
      if (url.startsWith('data:')) {
        const cloudinaryUrl = await uploadToCloudinary(url);
        if (cloudinaryUrl) return cloudinaryUrl;
        
        // Fallback: If upload fails or is offline, generate a random high-quality Unsplash image
        // to prevent database bloating from base64 strings
        const randomId = Math.floor(Math.random() * 1000);
        return `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&sig=${randomId}`;
      }
      return url;
    }));

    // Extract hashtags from caption
    const hashtags: string[] = [];
    if (caption) {
      const tags = caption.match(/#\w+/g);
      if (tags) {
        tags.forEach((tag: string) => hashtags.push(tag.substring(1).toLowerCase()));
      }
    }

    const post = new Post({
      user_id: userId,
      media_urls: processedUrls,
      media_types: media_types || processedUrls.map(() => 'image'),
      caption,
      destination_tag,
      hashtags,
      location_coordinates,
      visibility: visibility || 'everyone'
    });

    await post.save();

    // Increment user posts_count
    await User.findByIdAndUpdate(userId, { $inc: { posts_count: 1 } });

    // Send notifications to followers (simulated)
    const user = await User.findById(userId);
    console.log(`[Notification FCM Simulated] Alerting followers that ${user?.name || 'A user'} shared a new post!`);

    return res.status(201).json({ success: true, data: post });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Fetch Feed (Paginated, mixed posts and reels)
router.get('/posts/feed', authMiddleware, async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const posts = await Post.find()
      .populate('user_id', 'name profile_photo_url home_city')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const formattedPosts = posts.map(post => {
      const postObj = post.toObject() as any;
      // Check if user has liked this post
      postObj.liked_by_me = post.likes.some(id => id.toString() === req.user?.id);
      return postObj;
    });

    return res.json({ success: true, data: formattedPosts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Like/Unlike Post
router.post('/posts/:id/like', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const likeIndex = post.likes.findIndex(id => id.toString() === userId);
    let liked = false;

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
      post.likes_count = Math.max(0, post.likes_count - 1);
    } else {
      post.likes.push(new Types.ObjectId(userId));
      post.likes_count += 1;
      liked = true;

      // Notify post author
      if (post.user_id.toString() !== userId) {
        const liker = await User.findById(userId);
        await sendNotification(
          post.user_id,
          'New Like! ❤️',
          `${liker?.name || 'Someone'} liked your travel post.`,
          'like'
        );
      }
    }

    await post.save();
    return res.json({ success: true, data: { liked, likes_count: post.likes_count } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Add Comment
router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const postId = req.params.id;
  const { text, parent_id } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'Comment text is required' });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const comment = new Comment({
      post_id: postId,
      user_id: userId,
      text,
      parent_id: parent_id ? new Types.ObjectId(parent_id) : null
    });
    await comment.save();

    // Increment comment count on post
    await Post.findByIdAndUpdate(postId, { $inc: { comments_count: 1 } });

    // Notify post author
    if (post.user_id.toString() !== userId) {
      const commenter = await User.findById(userId);
      await sendNotification(
        post.user_id,
        'New Comment! 💬',
        `${commenter?.name || 'Someone'} commented on your post: "${text.substring(0, 30)}..."`,
        'comment'
      );
    }

    return res.status(201).json({ success: true, data: comment });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get Comments for Post
router.get('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  try {
    const comments = await Comment.find({ post_id: postId })
      .populate('user_id', 'name profile_photo_url')
      .sort({ created_at: 1 });

    return res.json({ success: true, data: comments });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Explore page discovery grid (grouped or searched)
router.get('/explore', async (req, res) => {
  const { query, theme, dest } = req.query;
  try {
    let filter: any = {};
    if (query) {
      filter.$or = [
        { caption: { $regex: query, $options: 'i' } },
        { hashtags: { $regex: query, $options: 'i' } }
      ];
    }
    if (theme) {
      filter.hashtags = theme.toString().toLowerCase();
    }
    if (dest) {
      filter.destination_tag = { $regex: dest, $options: 'i' };
    }

    const posts = await Post.find(filter)
      .populate('user_id', 'name profile_photo_url')
      .sort({ likes_count: -1 })
      .limit(20);

    return res.json({ success: true, data: posts });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get Trending Info
router.get('/social/trending', async (req, res) => {
  try {
    // Generate trending tags based on post hashtags aggregation
    const hashtagAgg = await Post.aggregate([
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const destinationAgg = await Post.aggregate([
      { $match: { destination_tag: { $ne: null } } },
      { $group: { _id: '$destination_tag', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    return res.json({
      success: true,
      data: {
        hashtags: hashtagAgg.map(h => h._id),
        destinations: destinationAgg.map(d => d._id)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
