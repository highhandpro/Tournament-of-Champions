import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

        if (!token?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        if (!token.isAdmin) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        if (event.status !== 'ARCHIVED') {
            return NextResponse.json(
                { error: 'Event is not archived' },
                { status: 400 }
            );
        }

        event.status = 'ACTIVE';
        await event.save();

        return NextResponse.json({
            message: 'Event restored successfully',
            event
        });
    } catch (error) {
        console.error('Restore event error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
