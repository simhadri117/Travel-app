import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, optionalAuthMiddleware } from '../services/auth';
import { generateItinerary, ItineraryFilters } from '../services/ai';
import { orchestrateLiveData, getPlacePhotoUrl, RealtimeFilters } from '../services/realtime-itinerary';
import { Itinerary } from '../models/Itinerary';
import { sendNotification } from '../services/notification';
import axios from 'axios';

const router = Router();

// ── NEW: Real-Time Itinerary Generation (SSE streaming) ──
router.post('/itinerary/generate-realtime', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const filters: RealtimeFilters = req.body;

  if (!filters.destination || !filters.startDate || !filters.endDate || !filters.budget) {
    return res.status(400).json({ success: false, error: 'destination, startDate, endDate, and budget are required' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send({ step: 'start', message: `Planning your trip to ${filters.destination}...`, progress: 5 });

    const onStep = (message: string, progress: number) => {
      send({ step: 'progress', message, progress });
    };

    const itinerary = await orchestrateLiveData(filters, onStep);

    // Save to DB
    const doc = new Itinerary({
      user_id: userId,
      destination: filters.destination,
      filters,
      generated_content: itinerary,
      status: 'draft'
    });
    await doc.save();

    if (userId) {
      await sendNotification(
        userId,
        'Real-Time Itinerary Ready! ✈️',
        `Your live AI itinerary for ${filters.destination} is ready with real attractions and weather data!`,
        'itinerary_ready'
      );
    }

    send({ step: 'done', itinerary, itinerary_id: doc._id.toString(), progress: 100 });
    res.end();
  } catch (err: any) {
    send({ step: 'error', message: err.message || 'Failed to generate itinerary', progress: 0 });
    res.end();
  }
});

// ── NEW: Google Place Photo Proxy (avoids CORS issues) ──
router.get('/itinerary/place-photo', async (req, res) => {
  const { ref, maxwidth = '800' } = req.query as { ref: string; maxwidth: string };
  if (!ref) return res.status(400).json({ error: 'ref required' });

  const url = getPlacePhotoUrl(String(ref), Number(maxwidth));
  if (!url) return res.status(404).json({ error: 'No Google Maps key configured' });

  try {
    const response = await axios.get(url, { responseType: 'stream', timeout: 8000 });
    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', typeof contentType === 'string' ? contentType : 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch {
    // Fallback to Unsplash Featured dynamic photo matching keywords
    const query = (req.query.name as string) || (req.query.destination as string) || 'travel';
    const fallbackUrl = `https://images.unsplash.com/featured/800x500/?${encodeURIComponent(query)}`;
    res.redirect(fallbackUrl);
  }
});


// 1. Generate Itinerary
router.post('/itinerary/generate', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const filters: ItineraryFilters = req.body;

  if (!filters.destination || !filters.days || !filters.budget || !filters.source) {
    return res.status(400).json({ success: false, error: 'Source, destination, days, and budget are required' });
  }

  try {
    const itineraryData = await generateItinerary(filters);
    
    // Create draft in database
    const itinerary = new Itinerary({
      user_id: userId,
      destination: filters.destination,
      filters,
      generated_content: itineraryData,
      status: 'draft'
    });
    await itinerary.save();

    // Trigger background notify check
    if (userId) {
      await sendNotification(
        userId,
        'Itinerary Ready! ✈️',
        `Your customized AI itinerary for ${filters.destination} has been successfully generated.`,
        'itinerary_ready'
      );
    }

    return res.json({
      success: true,
      data: {
        itinerary_id: itinerary._id,
        content: itineraryData
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Save Itinerary
router.post('/itinerary/save', authMiddleware, async (req: AuthRequest, res) => {
  const { itinerary_id } = req.body;

  try {
    const itinerary = await Itinerary.findByIdAndUpdate(
      itinerary_id,
      { status: 'saved' },
      { new: true }
    );
    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }
    return res.json({ success: true, data: itinerary });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Adjust Budget / Partial Regeneration
router.post('/itinerary/adjust-budget', authMiddleware, async (req: AuthRequest, res) => {
  const { itinerary_id, new_budget, category_breakdown } = req.body;
  // category_breakdown = { transport, accommodation, food, activities, miscellaneous }

  try {
    const itinerary = await Itinerary.findById(itinerary_id);
    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }

    const prevContent = JSON.parse(JSON.stringify(itinerary.generated_content));
    
    // Simulate updating only affected parts
    // Let's say accommodation budget has decreased/increased. We update hotel listings.
    const updatedContent = JSON.parse(JSON.stringify(prevContent));
    updatedContent.total_cost_estimate = new_budget;
    updatedContent.cost_breakdown = category_breakdown;

    // Recalculate hotel values
    const days = updatedContent.days || [];
    const hotelBudget = category_breakdown.accommodation;
    const hotelPricePerNight = Math.round(hotelBudget / days.length);

    let hotelTier = 'Budget Inn';
    if (hotelPricePerNight > 5000) hotelTier = 'Grand Palace Resort';
    else if (hotelPricePerNight > 2500) hotelTier = 'Executive Premium Hotel';
    else if (hotelPricePerNight > 1200) hotelTier = 'Cozy Comfort Residency';

    days.forEach((day: any) => {
      day.accommodation.hotel_name = `${itinerary.destination} ${hotelTier}`;
      day.accommodation.price_per_night = hotelPricePerNight;
      day.total_day_cost = Math.round(new_budget / days.length);
    });

    updatedContent.days = days;
    updatedContent.recommended_transport.estimated_cost = category_breakdown.transport;

    // Diff view description
    const diff = {
      accommodation: {
        previous: prevContent.cost_breakdown?.accommodation,
        updated: category_breakdown.accommodation,
        hotel_previous: prevContent.days?.[0]?.accommodation?.hotel_name,
        hotel_updated: updatedContent.days?.[0]?.accommodation?.hotel_name
      },
      transport: {
        previous: prevContent.cost_breakdown?.transport,
        updated: category_breakdown.transport
      }
    };

    itinerary.generated_content = updatedContent;
    await itinerary.save();

    return res.json({
      success: true,
      data: {
        itinerary,
        diff
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Public shareable read-only itinerary link
router.get('/itinerary/share/:id', async (req, res) => {
  try {
    const itinerary = await Itinerary.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ success: false, error: 'Itinerary not found' });
    }
    return res.json({ success: true, data: itinerary });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Sync Itineraries
router.post('/itineraries/sync', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  const { itinerary_ids } = req.body;

  if (!itinerary_ids || !Array.isArray(itinerary_ids)) {
    return res.status(400).json({ success: false, error: 'Itinerary IDs array is required' });
  }

  try {
    await Itinerary.updateMany(
      { _id: { $in: itinerary_ids }, $or: [{ user_id: { $exists: false } }, { user_id: null }] },
      { $set: { user_id: userId } }
    );
    return res.json({ success: true, message: 'Itineraries synced successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
