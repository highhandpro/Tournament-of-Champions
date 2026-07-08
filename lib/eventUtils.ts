import Event from '@/models/Event';
import connectToDatabase from './mongodb';

export async function archivePastEvents(): Promise<number> {
  try {
    await connectToDatabase();
    
    const now = new Date();
    const cutoff = new Date(now.getTime() - 90 * 60 * 1000);
    const result = await Event.updateMany(
      { 
        status: 'ACTIVE',
        dateTime: { $lt: cutoff }
      },
      { status: 'ARCHIVED' }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('Error archiving past events:', error);
    return 0;
  }
}

export async function getUpcomingActiveEvents(limit: number = 3) {
  try {
    await connectToDatabase();
    
    const now = new Date();
    const cutoff = new Date(now.getTime() - 90 * 60 * 1000);
    await archivePastEvents();
    const events = await Event.find({
      status: 'ACTIVE',
      dateTime: { $gte: cutoff }
    })
    .populate('registeredPlayers', 'firstName lastName email')
    .sort({ dateTime: 1 })
    .limit(limit);

    return events;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
}

export function shouldSendReminder(eventDate: Date): boolean {
  const now = new Date();
  const reminderTime = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
  
  return now >= reminderTime && now < eventDate;
}