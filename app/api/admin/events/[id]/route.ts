import connectToDatabase from '@/lib/mongodb';
import Event from '@/models/Event';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
    request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await Promise.resolve(context.params);
        const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }
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
        const body = await request.json();

        await connectToDatabase();
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            body,
            { new: true, runValidators: true }
        );
        if (!updatedEvent) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }
        return NextResponse.json({
            message: 'Event updated successfully',
            event: updatedEvent
        });
    } catch (error) {
        console.error('Update event error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(
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
        // Check if user is admin
        if (!token.isAdmin) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid event ID' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Find event
        const event = await Event.findById(id);
        if (!event) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        // Check if already archived
        if (event.status === 'ARCHIVED') {
            return NextResponse.json(
                { error: 'Event is already archived' },
                { status: 400 }
            );
        }

        // Archive event (never delete)
        event.status = 'ARCHIVED';
        await event.save();

        return NextResponse.json({
            message: 'Event archived successfully'
        });

    } catch (error) {
        console.error('Archive event error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}