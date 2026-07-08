import { ClientSession } from 'mongoose';
import RegistrationLog from '@/models/RegistrationLog';

type RegistrationActor = {
  userId?: string;
  email?: string;
};

type RegistrationTarget = {
  _id: { toString(): string } | string;
  firstName: string;
  lastName: string;
  email: string;
};

type RegistrationEvent = {
  _id: { toString(): string } | string;
  title: string;
};

type RegistrationTrackingInput = {
  event: RegistrationEvent;
  user: RegistrationTarget;
  action: string;
  actor?: RegistrationActor;
  note?: string;
  session?: ClientSession;
};

export async function logRegistrationAction({
  event,
  user,
  action,
  actor,
  note,
  session,
}: RegistrationTrackingInput) {
  const payload = {
    event: event._id,
    eventTitle: event.title,
    user: user._id,
    userFirstName: user.firstName,
    userLastName: user.lastName,
    userEmail: user.email.toLowerCase(),
    action,
    actorUser: actor?.userId,
    actorEmail: actor?.email?.toLowerCase(),
    note,
  };

  if (session) {
    await RegistrationLog.create([payload], { session });
    return;
  }

  await RegistrationLog.create(payload);
}
