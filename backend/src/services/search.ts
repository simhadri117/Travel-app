import axios from 'axios';
import { Post } from '../models/Post';

/**
 * Searches destinations or posts using Algolia if configured.
 * If Algolia keys are missing, queries database using MongoDB regex search.
 */
export async function searchDestinationsAndPosts(searchQuery: string): Promise<any[]> {
  const algoliaAppId = process.env.ALGOLIA_APP_ID;
  const algoliaApiKey = process.env.ALGOLIA_API_KEY;

  if (algoliaAppId && algoliaApiKey) {
    try {
      console.log(`[Algolia Search] Querying index for: "${searchQuery}"`);
      // Standard Algolia search REST API
      const response = await axios.post(
        `https://${algoliaAppId}-dsn.algolia.net/1/indexes/destinations/query`,
        {
          params: `query=${encodeURIComponent(searchQuery)}&hitsPerPage=10`
        },
        {
          headers: {
            'X-Algolia-Application-Id': algoliaAppId,
            'X-Algolia-API-Key': algoliaApiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const hits = response.data?.hits || [];
      if (hits.length > 0) {
        return hits.map((hit: any) => ({
          name: hit.name || hit.destination_tag || 'Adventure Destination',
          state: hit.state || 'India',
          country: hit.country || 'India',
          highlights: hit.highlights || hit.caption || '',
          rating: hit.rating || 4.5,
          photo: hit.photo || hit.media_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300'
        }));
      }
    } catch (err: any) {
      console.warn('[Algolia Service] Query failed, falling back to database:', err.response?.data || err.message);
    }
  }

  // Fallback to local MongoDB search on feed posts
  try {
    const matchedPosts = await Post.find({
      $or: [
        { destination_tag: { $regex: searchQuery, $options: 'i' } },
        { caption: { $regex: searchQuery, $options: 'i' } },
        { hashtags: { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .limit(10)
    .populate('user_id', 'name');

    return matchedPosts.map(post => ({
      name: post.destination_tag || 'Destination',
      state: 'Local Discovery',
      country: 'India',
      highlights: post.caption || '',
      rating: 4.5,
      photo: post.media_urls?.[0] || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=300'
    }));
  } catch (error: any) {
    console.error('[Search Service] Local search query failed:', error.message);
    return [];
  }
}
