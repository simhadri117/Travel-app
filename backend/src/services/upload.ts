import crypto from 'crypto';
import axios from 'axios';

/**
 * Uploads a base64 encoded image or video to Cloudinary.
 * If CLOUDINARY_URL is missing or invalid, returns null (allowing fallback).
 * 
 * CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
 */
export async function uploadToCloudinary(base64Data: string): Promise<string | null> {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    return null;
  }

  try {
    // Parse Cloudinary credentials from URL
    const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@([^\/]+)/);
    if (!match) {
      console.warn('[Cloudinary Service] Invalid CLOUDINARY_URL format.');
      return null;
    }

    const apiKey = match[1];
    const apiSecret = match[2];
    const cloudName = match[3].trim();

    const timestamp = Math.round(Date.now() / 1000);
    
    // Compute signed request signature
    const signatureStr = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(signatureStr).digest('hex');

    console.log(`[Cloudinary Service] Uploading media to cloud: ${cloudName}...`);
    
    const response = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      file: base64Data,
      api_key: apiKey,
      timestamp,
      signature
    });

    if (response.data && response.data.secure_url) {
      console.log(`[Cloudinary Service] Upload successful! URL: ${response.data.secure_url}`);
      return response.data.secure_url;
    }

    return null;
  } catch (error: any) {
    console.error('[Cloudinary Service] Upload failed:', error.response?.data || error.message);
    return null;
  }
}
