"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, Image as ImageIcon, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: "image" | "pdf" | "xray" | "prescription";
  uploadedAt: string;
  fileSize?: string;
  description?: string;
}

interface FileUploaderProps {
  patientId: string;
  onUploadComplete?: (attachment: AttachmentItem) => void;
  isRTL: boolean;
}

export function FileUploader({ patientId, onUploadComplete, isRTL }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AttachmentItem["fileType"]>("xray");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error(isRTL ? "حجم الملف يتجاوز الحد الأقصى (15 ميجابايت)" : "File size exceeds 15MB limit");
      return;
    }

    setUploading(true);

    try {
      // Simulate file upload or send to API endpoint
      const simulatedUrl = URL.createObjectURL(file);

      setTimeout(() => {
        const newAttachment: AttachmentItem = {
          id: `att-${Date.now()}`,
          fileName: file.name,
          fileUrl: simulatedUrl,
          fileType: selectedCategory,
          uploadedAt: isRTL ? "الآن" : "Just now",
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          description: description || undefined,
        };

        if (onUploadComplete) {
          onUploadComplete(newAttachment);
        }

        toast.success(
          isRTL
            ? `✅ تم رفع الملف "${file.name}" وتخزينه بنجاح في ملف المريض!`
            : `✅ File "${file.name}" uploaded successfully to patient profile!`
        );
        setUploading(false);
        setDescription("");
      }, 600);
    } catch (error) {
      console.error(error);
      toast.error(isRTL ? "فشل رفع الملف" : "Failed to upload file");
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Selection */}
      <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
        <span className="text-slate-400">{isRTL ? "نوع المرفق:" : "Category:"}</span>
        {[
          { id: "xray", en: "X-Ray / Scan (أشعة)", ar: "أشعة ورنين" },
          { id: "prescription", en: "Prescription (روشتة)", ar: "روشتة طبية" },
          { id: "image", en: "Lab Report (تحاليل)", ar: "تقرير معملي" },
          { id: "pdf", en: "PDF Document (تقرير شامل)", ar: "مستند PDF" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id as AttachmentItem["fileType"])}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-[#0891B2] text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            {isRTL ? cat.ar : cat.en}
          </button>
        ))}
      </div>

      {/* Description optional */}
      <input
        type="text"
        placeholder={isRTL ? "وصف اختياري للملف (مثال: أشعة سينية على الصدر قبل العملية)..." : "Optional description (e.g. Chest X-Ray pre-op)..."}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0891B2]"
      />

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
          isDragging
            ? "border-[#0891B2] bg-cyan-50/50 dark:bg-cyan-950/30"
            : "border-slate-300 dark:border-slate-700 hover:border-[#0891B2] bg-slate-50/50 dark:bg-slate-900/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 text-[#0891B2] dark:text-cyan-400 flex items-center justify-center">
            {uploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {uploading
                ? (isRTL ? "جاري رفع ومعالجة الملف..." : "Uploading & processing file...")
                : (isRTL ? "اسحب الملف هنا أو اضغط للاختيار من جهازك" : "Drag and drop file here, or click to browse")}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
              {isRTL ? "يدعم الأشعة، الصور (JPEG/PNG) ومستندات PDF حتى 15 ميجابايت" : "Supports X-rays, Images (PNG/JPG) & PDF up to 15MB"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
