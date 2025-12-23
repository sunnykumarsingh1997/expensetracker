'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileImage, FileText, Loader2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  category?: string;
  description?: string;
}

export default function FileUpload({
  onUploadComplete,
  category,
  description,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [category, description]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image (JPEG, PNG, GIF) or PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Show preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Upload to Paperless
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category);
      if (description) formData.append('description', description);

      const response = await fetch('/api/paperless/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadedFile({
          name: file.name,
          url: data.data.documentUrl,
        });
        onUploadComplete(data.data.documentUrl);
        toast.success('File uploaded to Paperless successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setPreview(null);
    onUploadComplete('');
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      {!uploadedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`upload-zone ${isDragging ? 'dragover' : ''}`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-hitman-red animate-spin mb-3" />
                <p className="text-gray-400">Uploading to Paperless...</p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-500 mb-3" />
                <p className="text-gray-400 mb-1">
                  Drag & drop or click to upload
                </p>
                <p className="text-gray-500 text-sm">
                  Supports: JPEG, PNG, GIF, PDF (max 10MB)
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Preview / Uploaded file */}
      {uploadedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-hitman-gunmetal/50 rounded-xl p-4"
        >
          <button
            onClick={clearUpload}
            className="absolute top-2 right-2 p-1 rounded-full bg-hitman-black/50 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            {/* Preview image or icon */}
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-hitman-black/50 rounded-lg flex items-center justify-center">
                {uploadedFile.name.endsWith('.pdf') ? (
                  <FileText className="w-10 h-10 text-hitman-red" />
                ) : (
                  <FileImage className="w-10 h-10 text-hitman-red" />
                )}
              </div>
            )}

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {uploadedFile.name}
              </p>
              <p className="text-green-400 text-sm mt-1">
                Uploaded to Paperless
              </p>
              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-hitman-red text-sm mt-2 hover:underline"
              >
                View in Paperless
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
