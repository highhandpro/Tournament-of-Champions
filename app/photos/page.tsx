"use client";

import { Navbar } from "@/components/Navbar";
import { api } from "@/lib/api";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { Camera, ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface Photo {
  _id: string;
  cloudinaryUrl: string;
  caption?: string;
  uploadedBy: { firstName: string; lastName: string };
  createdAt: string;
}

export default function PhotosPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  const goToNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }, [lightboxIndex, photos.length]);

  const goToPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }, [lightboxIndex, photos.length]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      else if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, goToNext, goToPrev, closeLightbox]);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getApprovedPhotos();
      setPhotos(data.photos);
    } catch {
      showErrorToast("Failed to load photos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user, fetchPhotos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showErrorToast("File size must be under 10MB");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      await api.uploadPhoto(selectedFile, caption || undefined);
      showSuccessToast("Photo uploaded! It will be visible after admin approval.");
      resetUpload();
      fetchPhotos();
    } catch (error: any) {
      showErrorToast(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    setShowUploadModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-[22px] sm:text-[30px] md:text-[36px] font-semibold tracking-wide text-black leading-tight">
            Photos
          </h1>
          {user && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-[#2a558c] hover:bg-[#2a558c]/80 text-white text-sm sm:text-base font-bold px-4 sm:px-6 py-2.5 rounded-xl transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#cc2616] mx-auto mb-4"></div>
              <p className="text-black">Loading photos...</p>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-black text-lg mb-2">No photos yet</p>
            <p className="text-gray-600">
              Be the first to share a photo from our events!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo._id}
                className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={photo.cloudinaryUrl}
                    alt={photo.caption || "Club photo"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
                {photo.caption && (
                  <div className="px-2.5 pt-2">
                    <p className="text-xs text-gray-800 line-clamp-1">{photo.caption}</p>
                  </div>
                )}
                <div className="px-2.5 py-2">
                  <p className="text-[11px] text-gray-500">
                    By {photo.uploadedBy.firstName} {photo.uploadedBy.lastName.charAt(0)}.
                    {" · "}
                    {new Date(photo.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            <button
              onClick={resetUpload}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-black">Upload Photo</h2>

            {previewUrl && (
              <div className="relative w-full aspect-video mb-4 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">
                Caption (optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                placeholder="Add a caption..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2a558c]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetUpload}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-black hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 bg-[#2a558c] text-white rounded-xl text-sm font-bold hover:bg-[#2a558c]/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Photos will be visible after admin approval.
            </p>
          </div>
        </div>
      )}

      {/* Lightbox - Google Photos style */}
      {lightboxPhoto && lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
            <div className="text-white text-sm">
              <span className="text-gray-400">
                {lightboxIndex + 1} / {photos.length}
              </span>
            </div>
            <div className="flex-1 text-center px-4">
              {lightboxPhoto.caption && (
                <p className="text-white text-sm truncate">{lightboxPhoto.caption}</p>
              )}
            </div>
            <button
              onClick={closeLightbox}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main image area with nav */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {/* Previous button */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div
              className="relative w-full h-full cursor-pointer"
              onClick={closeLightbox}
            >
              <div onClick={(e) => e.stopPropagation()} className="relative w-full h-full">
                <Image
                  key={lightboxPhoto._id}
                  src={lightboxPhoto.cloudinaryUrl}
                  alt={lightboxPhoto.caption || "Club photo"}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>
            </div>

            {/* Next button */}
            {photos.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-3 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom bar */}
          <div className="px-4 py-3 bg-black/60 backdrop-blur-sm text-center">
            <p className="text-gray-400 text-xs">
              By {lightboxPhoto.uploadedBy.firstName}{" "}
              {lightboxPhoto.uploadedBy.lastName.charAt(0)}.
              {" · "}
              {new Date(lightboxPhoto.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
