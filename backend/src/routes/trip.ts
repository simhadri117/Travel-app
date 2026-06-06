import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../services/auth';
import { Trip } from '../models/Trip';
import { Booking } from '../models/Booking';
import { Itinerary } from '../models/Itinerary';
import { User } from '../models/User';
import { TripMessage } from '../models/TripMessage';
import { SharedExpense } from '../models/SharedExpense';
import { sendNotification } from '../services/notification';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';

const router = Router();

// 1. Get User Trips (Upcoming, Past, Cancelled)
router.get('/trips', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  try {
    const trips = await Trip.find({ user_id: userId }).sort({ start_date: 1 });
    const now = new Date();

    const upcoming = trips.filter(t => t.start_date >= now);
    const past = trips.filter(t => t.end_date < now);
    
    // We can fetch cancelled booking states if they affect trip statuses, but standard is sorted by dates
    return res.json({
      success: true,
      data: {
        upcoming,
        past,
        cancelled: [] // Add placeholder or cancelled models if needed
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Create a Trip
router.post('/trips', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id!;
  const { name, destination, start_date, end_date, itinerary_id, cover_photo_url } = req.body;

  if (!name || !destination || !start_date || !end_date) {
    return res.status(400).json({ success: false, error: 'Name, destination, start date and end date are required' });
  }

  try {
    // Autopopulate packing checklist if an itinerary is present
    let packing_list: any[] = [
      { id: uuidv4(), item: 'Toothbrush & Toiletries', category: 'Hygiene', checked: false, custom: false },
      { id: uuidv4(), item: 'First-aid kit', category: 'Medical', checked: false, custom: false },
      { id: uuidv4(), item: 'Mobile charger & powerbank', category: 'Electronics', checked: false, custom: false }
    ];

    if (itinerary_id) {
      const itinerary = await Itinerary.findById(itinerary_id);
      if (itinerary && itinerary.generated_content.packing_tips) {
        itinerary.generated_content.packing_tips.forEach((tip: string) => {
          packing_list.push({
            id: uuidv4(),
            item: tip,
            category: 'AI Recommendation',
            checked: false,
            custom: false
          });
        });
      }
    }

    const trip = new Trip({
      user_id: userId,
      name,
      destination,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      itinerary_id: itinerary_id ? new Types.ObjectId(itinerary_id) : null,
      packing_list,
      cover_photo_url: cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      share_token: uuidv4().substring(0, 8),
      is_public: false
    });

    await trip.save();
    return res.status(201).json({ success: true, data: trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get Trip Details with aggregated timeline bookings
router.get('/trips/:id', authMiddleware, async (req: AuthRequest, res) => {
  const tripId = req.params.id;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    // Aggregate all flight/train/bus bookings for this user that fall within travel dates
    const bookings = await Booking.find({
      user_id: trip.user_id,
      status: 'confirmed',
      'journey_details.date': {
        $gte: trip.start_date.toISOString().split('T')[0],
        $lte: trip.end_date.toISOString().split('T')[0]
      }
    });

    // Populate itinerary if connected
    let itinerary = null;
    if (trip.itinerary_id) {
      itinerary = await Itinerary.findById(trip.itinerary_id);
    }

    return res.json({
      success: true,
      data: {
        trip,
        bookings,
        itinerary: itinerary ? itinerary.generated_content : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Log Manual Expense
router.post('/trips/:id/expenses', authMiddleware, async (req, res) => {
  const { category, amount, date, note } = req.body;

  if (!category || !amount || !date) {
    return res.status(400).json({ success: false, error: 'Category, amount and date are required' });
  }

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const expense = {
      id: uuidv4(),
      category,
      amount: Number(amount),
      date: new Date(date),
      note
    };

    trip.expense_logs.push(expense);
    await trip.save();

    return res.json({ success: true, data: trip.expense_logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Delete Expense
router.delete('/trips/:id/expenses/:expId', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    trip.expense_logs = trip.expense_logs.filter(e => e.id !== req.params.expId);
    await trip.save();

    return res.json({ success: true, data: trip.expense_logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Export Expenses as CSV
router.get('/trips/:id/expenses/export', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).send('Trip not found');
    }

    let csvContent = 'ID,Date,Category,Amount,Note\n';
    trip.expense_logs.forEach(e => {
      const expDate = e.date.toISOString().split('T')[0];
      csvContent += `"${e.id}","${expDate}","${e.category}",${e.amount},"${e.note || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-trip-${trip.share_token}.csv`);
    return res.send(csvContent);
  } catch (error: any) {
    return res.status(500).send('Error exporting CSV');
  }
});

// 7. Toggle / Update Packing Checklist Item
router.put('/trips/:id/checklist', authMiddleware, async (req, res) => {
  const { itemId, checked, item, category } = req.body;

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (itemId) {
      // Toggle existing checkmark
      const pIdx = trip.packing_list.findIndex(p => p.id === itemId);
      if (pIdx > -1) {
        trip.packing_list[pIdx].checked = checked;
      }
    } else if (item) {
      // Add custom item
      trip.packing_list.push({
        id: uuidv4(),
        item,
        category: category || 'General',
        checked: false,
        custom: true
      });
    }

    await trip.save();
    return res.json({ success: true, data: trip.packing_list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Add / Update Journal Entry
router.put('/trips/:id/journal', authMiddleware, async (req, res) => {
  const { journalId, date, title, content, photo_urls, voice_note_url } = req.body;

  if (!title || !date) {
    return res.status(400).json({ success: false, error: 'Title and Date are required' });
  }

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    if (journalId) {
      const jIdx = trip.journal_entries.findIndex(j => j.id === journalId);
      if (jIdx > -1) {
        trip.journal_entries[jIdx] = {
          id: journalId,
          date: new Date(date),
          title,
          content: content || '',
          photo_urls: photo_urls || [],
          voice_note_url
        };
      }
    } else {
      trip.journal_entries.push({
        id: uuidv4(),
        date: new Date(date),
        title,
        content: content || '',
        photo_urls: photo_urls || [],
        voice_note_url
      });
    }

    await trip.save();
    return res.json({ success: true, data: trip.journal_entries });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Lookup Public Shared Trip read-only view
router.get('/shared/:token', async (req, res) => {
  try {
    const trip = await Trip.findOne({ share_token: req.params.token });
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Shared trip not found' });
    }

    // Populate itinerary if connected
    let itinerary = null;
    if (trip.itinerary_id) {
      itinerary = await Itinerary.findById(trip.itinerary_id);
    }

    return res.json({
      success: true,
      data: {
        trip: {
          name: trip.name,
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          cover_photo_url: trip.cover_photo_url
        },
        itinerary: itinerary ? itinerary.generated_content : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Invite Member to Trip
router.post('/trips/:id/invite', authMiddleware, async (req: AuthRequest, res) => {
  const tripId = req.params.id;
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({ success: false, error: 'Email or Phone is required' });
  }

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    // Find the user to invite
    const friend = await User.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!friend) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if user is already a member
    if (trip.user_id.toString() === friend._id.toString() || trip.members.some(m => m.toString() === friend._id.toString())) {
      return res.status(400).json({ success: false, error: 'User is already a member of this trip' });
    }

    trip.members.push(friend._id);
    await trip.save();

    await sendNotification(
      friend._id,
      'Trip Invitation! 🌍',
      `You have been invited to join the trip "${trip.name}" to ${trip.destination}!`,
      'trip_invite'
    );

    return res.json({ success: true, message: 'Member added successfully', data: trip });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Send Message to Trip Group Chat
router.post('/trips/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
  const tripId = req.params.id;
  const userId = req.user?.id!;
  const { message, media_url } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    // Verify membership
    const isMember = trip.user_id.toString() === userId || trip.members.some(m => m.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const msg = new TripMessage({
      trip_id: tripId,
      sender_id: userId,
      message,
      media_url
    });
    await msg.save();

    const populatedMsg = await msg.populate('sender_id', 'name profile_photo_url');

    return res.status(201).json({ success: true, data: populatedMsg });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Get Trip Chat History
router.get('/trips/:id/messages', authMiddleware, async (req: AuthRequest, res) => {
  const tripId = req.params.id;
  const userId = req.user?.id!;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const isMember = trip.user_id.toString() === userId || trip.members.some(m => m.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const messages = await TripMessage.find({ trip_id: tripId })
      .populate('sender_id', 'name profile_photo_url')
      .sort({ created_at: 1 });

    return res.json({ success: true, data: messages });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 13. Create a Shared Expense (Split Bill)
router.post('/trips/:id/shared-expenses', authMiddleware, async (req: AuthRequest, res) => {
  const tripId = req.params.id;
  const userId = req.user?.id!;
  const { amount, description, participants } = req.body;

  if (!amount || !description || !participants || participants.length === 0) {
    return res.status(400).json({ success: false, error: 'Amount, description, and participants list are required' });
  }

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const expense = new SharedExpense({
      trip_id: tripId,
      payer_id: userId,
      amount: Number(amount),
      description,
      participants
    });
    await expense.save();

    return res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 14. Get Expense Balances (Who owes whom)
router.get('/trips/:id/balances', authMiddleware, async (req: AuthRequest, res) => {
  const tripId = req.params.id;
  const userId = req.user?.id!;

  try {
    const trip = await Trip.findById(tripId).populate('members', 'name');
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }

    const expenses = await SharedExpense.find({ trip_id: tripId });
    const balanceMap: Record<string, number> = {};
    const allUserIds = [trip.user_id.toString(), ...trip.members.map(m => m._id.toString())];
    allUserIds.forEach(id => {
      balanceMap[id] = 0;
    });

    expenses.forEach(exp => {
      const payerId = exp.payer_id.toString();
      const amount = exp.amount;

      if (balanceMap[payerId] === undefined) balanceMap[payerId] = 0;
      balanceMap[payerId] += amount;

      exp.participants.forEach(p => {
        const pId = p.user_id.toString();
        if (balanceMap[pId] === undefined) balanceMap[pId] = 0;
        balanceMap[pId] -= p.share;
      });
    });

    const userDetails: Record<string, string> = {};
    const owner = await User.findById(trip.user_id);
    if (owner) userDetails[owner._id.toString()] = owner.name || 'Owner';
    for (const member of trip.members as any) {
      userDetails[member._id.toString()] = member.name || 'Member';
    }

    const balances = Object.keys(balanceMap).map(id => ({
      user_id: id,
      name: userDetails[id] || 'Unknown',
      balance: balanceMap[id]
    }));

    return res.json({ success: true, data: { balances, total_expenses: expenses.reduce((a, b) => a + b.amount, 0) } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
