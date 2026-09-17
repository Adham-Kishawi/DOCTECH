"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move } from "lucide-react";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  isRTL?: boolean;
}

export function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isRTL = false,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset controls when a new image opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Perform Final Crop on 320x320 Canvas
  const handleCrop = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement("canvas");
    const CROP_SIZE = 320;
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // High quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Viewport diameter is 240px inside a 280px modal stage
    const VIEWPORT_SIZE = 240;
    const scaleFactor = CROP_SIZE / VIEWPORT_SIZE;

    ctx.save();
    // Center of canvas
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply pan translated to canvas coordinate system
    ctx.translate(position.x * scaleFactor, position.y * scaleFactor);

    // Apply zoom
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    // Draw the image centered
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );

    ctx.restore();

    const croppedResult = canvas.toDataURL("image/jpeg", 0.9);
    onCropComplete(croppedResult);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#131E2E] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isRTL ? "قص وتخصيص الصورة الشخصية" : "Crop & Position Photo"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRTL
                ? "اسحب الصورة لتحديد موضعها واستخدم شريط التكبير"
                : "Drag to reposition and use zoom slider to frame your avatar"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Stage with Circular Mask */}
        <div className="p-6 flex flex-col items-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-slate-900 overflow-hidden cursor-grab active:cursor-grabbing select-none border-2 border-slate-300 dark:border-slate-700 shadow-inner flex items-center justify-center"
          >
            {/* The Raw Draggable / Scalable Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? "none" : "transform 0.05s ease-out",
                maxWidth: "none",
              }}
              className="max-h-none pointer-events-none select-none"
            />

            {/* Visual Dimmed Mask Overlay with Circular Viewport */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]"
                style={{
                  boxShadow: "0 0 0 9999px rgba(11, 19, 30, 0.7)",
                }}
              />
            </div>

            {/* Drag hint */}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white/80 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
              <Move size={10} />
              <span>{isRTL ? "اسحب للتحريك" : "Drag to move"}</span>
            </div>
          </div>

          {/* Controls: Zoom Slider & Rotate */}
          <div className="w-full max-w-xs mt-5 space-y-3">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>

              <div className="flex-1 flex items-center">
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1A4B8C] dark:accent-blue-400"
                />
              </div>

              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>

              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
                title="Rotate 90deg"
              >
                <RotateCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isRTL ? "إلغاء" : "Cancel"}
          </button>

          <button
            type="button"
            onClick={handleCrop}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1A4B8C] hover:bg-blue-800 shadow-md shadow-blue-900/15 transition-all cursor-pointer"
          >
            <Check size={15} />
            <span>{isRTL ? "قص وتطبيق الصورة" : "Apply & Crop"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
