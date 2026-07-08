"use client";

import { convertGoogleDriveUrl, isImageUrl } from "@/lib/utils";
import {
  Calendar,
  Clock,
  DollarSign,
  FileText,
  HouseIcon,
  Users,
} from "lucide-react";
import { Event } from "./types";

interface EventDetailsGridProps {
  event: Event;
  formattedDate: string;
  formattedTime: string;
  onImageClick: (url: string, label: string) => void;
}

export const EventDetailsGrid = ({
  event,
  formattedDate,
  formattedTime,
  onImageClick,
}: EventDetailsGridProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-2xl font-bold text-black text-center mb-5">
        {event.title}
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-1">Date</p>
            <p className="text-black font-medium">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-1">Buy-in</p>
            <p className="text-black font-medium">
              Min buy-in: ${event.buyInMin}
            </p>
            <p className="text-black font-medium">
              Max buy-in: ${event.buyInMax}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-1">Time</p>
            <p className="text-black font-medium">{formattedTime}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-600 mb-1">Blinds</p>
            <p className="text-black font-medium">
              {event.blinds || "TBD"}
            </p>
          </div>
        </div>

        {event.host?.user && (
          <div className="flex items-start gap-3">
            <HouseIcon className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Host</p>
              <p className="text-black font-medium">
                {event.host.user.firstName} {event.host.user.lastName}
              </p>
            </div>
          </div>
        )}

        {event.details1 && (
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Details</p>
              <p className="text-black font-medium whitespace-pre-line">
                {event.details1}
              </p>
              {event.details2 && (
                <p className="text-black font-medium whitespace-pre-line">
                  {event.details2}
                </p>
              )}
              {event.details3 && (
                <p className="text-black font-medium whitespace-pre-line">
                  {event.details3}
                </p>
              )}
            </div>
          </div>
        )}

        {event.links && event.links.length > 0 && (
          <div className="flex items-start gap-3 col-span-2">
            <HouseIcon className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Hospitality</p>
              <div className="flex flex-wrap gap-2">
                {event.links.map((link, index) => {
                  const isImage = isImageUrl(link.url);

                  if (isImage) {
                    return (
                      <button
                        key={index}
                        onClick={() => onImageClick(link.url, link.label)}
                        className="text-[#2FA0BC] underline font-medium cursor-pointer bg-transparent border-none p-0"
                      >
                        {link.label}
                      </button>
                    );
                  }

                  return (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2FA0BC] underline font-medium"
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <p className="col-span-2 text-sm text-green-900 mt-1">
          By registering or participating, players agreed these{" "}
          <a
            href="/participation-agreement"
            target="_blank"
            className="underline"
          >
            House Rules and Participation Agreement
          </a>
          .
        </p>
      </div>
    </div>
  );
};
