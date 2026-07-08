"use client";

import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { Check, Edit3, Save, Trash2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

interface Photo {
  _id: string;
  cloudinaryUrl: string;
  originalName: string;
  fileSize: number;
  caption?: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  uploadedBy: { firstName: string; lastName: string; email: string };
  approvedBy?: { firstName: string; lastName: string };
  approvedAt?: string;
  createdAt: string;
}

type FilterStatus = "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export default function AdminPhotosPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("PENDING");
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const response = await fetch("/api/auth/check-admin");
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } catch {
          console.error("Error checking admin status");
        }
      }
    };
    checkAdmin();
  }, [user]);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const status = filter === "ALL" ? undefined : filter;
      const data = await api.getAdminPhotos(status);
      setPhotos(data.photos);
    } catch {
      showErrorToast("Failed to load photos.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAdmin) {
      fetchPhotos();
    }
  }, [isAdmin, fetchPhotos]);

  const handleApprove = async (id: string) => {
    try {
      await api.approvePhoto(id);
      showSuccessToast("Photo approved");
      fetchPhotos();
    } catch {
      showErrorToast("Failed to approve photo");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.rejectPhoto(id);
      showSuccessToast("Photo rejected");
      fetchPhotos();
    } catch {
      showErrorToast("Failed to reject photo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this photo?")) return;
    try {
      await api.deletePhoto(id);
      showSuccessToast("Photo deleted");
      fetchPhotos();
    } catch {
      showErrorToast("Failed to delete photo");
    }
  };

  const handleSaveCaption = async (id: string) => {
    try {
      await api.updatePhotoCaption(id, captionText);
      showSuccessToast("Caption updated");
      setEditingCaption(null);
      fetchPhotos();
    } catch {
      showErrorToast("Failed to update caption");
    }
  };

  const startEditCaption = (photo: Photo) => {
    setEditingCaption(photo._id);
    setCaptionText(photo.caption || "");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundImage: "url('/assets/Faded-cards-background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p className="text-black text-lg">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/assets/Faded-cards-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Navbar />
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-16 lg:px-32 py-10 sm:py-14 pb-24">
        <h1 className="font-display text-[22px] sm:text-[30px] md:text-[36px] font-semibold tracking-wide text-black leading-tight mb-6">
          Photo Management
        </h1>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as FilterStatus[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  filter === status
                    ? "bg-[#2a558c] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                {status === "PENDING" && photos.length > 0 && filter === "PENDING" && (
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {photos.length}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4"></div>
              <p className="text-black">Loading photos...</p>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-600 text-lg">
              No {filter !== "ALL" ? filter.toLowerCase() : ""} photos found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo._id}
                className="bg-white rounded-lg overflow-hidden shadow-md"
              >
                {/* Image */}
                <div
                  className="relative aspect-[4/3] cursor-pointer"
                  onClick={() => setLightboxPhoto(photo)}
                >
                  <Image
                    src={photo.cloudinaryUrl}
                    alt={photo.caption || photo.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusColors[photo.approvalStatus]}`}
                    >
                      {photo.approvalStatus}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  {/* Caption editing */}
                  {editingCaption === photo._id ? (
                    <div className="flex gap-1.5 mb-2">
                      <input
                        type="text"
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        maxLength={500}
                        placeholder="Add a caption..."
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#2a558c]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveCaption(photo._id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCaption(null)}
                        className="p-1 text-gray-500 hover:bg-gray-50 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5 mb-2">
                      <p className="text-xs text-gray-800 flex-1 line-clamp-1">
                        {photo.caption || (
                          <span className="text-gray-400 italic">No caption</span>
                        )}
                      </p>
                      <button
                        onClick={() => startEditCaption(photo)}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                        title="Edit caption"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="text-[11px] text-gray-500 space-y-0.5 mb-2">
                    <p>
                      Uploaded by{" "}
                      <span className="font-medium">
                        {photo.uploadedBy.firstName} {photo.uploadedBy.lastName}
                      </span>
                    </p>
                    <p>
                      {new Date(photo.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {formatFileSize(photo.fileSize)}
                    </p>
                    {photo.approvedBy && (
                      <p>
                        Approved by {photo.approvedBy.firstName}{" "}
                        {photo.approvedBy.lastName}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5">
                    {photo.approvalStatus === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(photo._id)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(photo._id)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {photo.approvalStatus === "REJECTED" && (
                      <button
                        onClick={() => handleApprove(photo._id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(photo._id)}
                      className="flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded hover:bg-gray-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="relative w-full h-[80vh]">
              <Image
                src={lightboxPhoto.cloudinaryUrl}
                alt={lightboxPhoto.caption || "Photo"}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
