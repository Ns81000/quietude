import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'audio/mpeg': ['.mp3'],
  'audio/mp4': ['.m4a'],
  'audio/wav': ['.wav'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  className?: string;
}

export function DropZone({
  onFileSelect,
  isUploading = false,
  uploadProgress = 0,
  className,
}: DropZoneProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const errorCode = rejection.errors[0]?.code;
        
        if (errorCode === 'file-too-large') {
          setError('This file is over 20MB. Compress it or paste the text.');
        } else if (errorCode === 'file-invalid-type') {
          const ext = rejection.file.name.split('.').pop()?.toUpperCase() || 'this';
          setError(`We cannot read ${ext} files. Try PDF, image, or paste the text.`);
        } else {
          setError('File could not be accepted. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isUploading,
  });

  // Check if mobile for camera option
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-150 cursor-pointer bg-surface',
          isDragActive
            ? 'border-accent bg-accent-soft/30'
            : 'border-border hover:border-text-muted',
          isUploading && 'pointer-events-none opacity-75',
          error && 'border-incorrect/50'
        )}
      >
        <input {...getInputProps()} />

        {/* Upload progress bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-bg-2 rounded-t-xl overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 size={32} className="text-accent mb-4 animate-spin" strokeWidth={1.5} />
            <p className="text-text font-medium mb-1">Uploading...</p>
            <p className="text-sm text-text-muted">{uploadProgress}% complete</p>
          </div>
        ) : (
          <>
            <Upload
              size={32}
              className={cn(
                'mx-auto mb-4 transition-colors duration-150',
                isDragActive ? 'text-accent' : 'text-text-muted'
              )}
              strokeWidth={1.5}
            />
            <p className="text-text font-medium mb-1">
              {isDragActive ? 'Drop your file here' : 'Drop your study material here'}
            </p>
            <p className="text-sm text-text-muted">
              PDF, images, audio, or text files — up to 20MB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className="mt-6 px-6 py-2.5 rounded-lg bg-accent text-accent-text text-sm font-medium
                         hover:opacity-90 transition-opacity duration-150"
            >
              Browse files
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-incorrect">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile camera option */}
      {isMobile && !isUploading && (
        <label className="flex items-center gap-3 p-4 border border-border rounded-xl bg-surface
                          hover:border-text-muted transition-colors duration-150 cursor-pointer">
          <Camera size={20} className="text-text-muted" strokeWidth={1.5} />
          <div>
            <p className="text-sm text-text font-medium">Use camera</p>
            <p className="text-xs text-text-muted">Take a photo of your notes</p>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setError(null);
                onFileSelect(file);
              }
            }}
          />
        </label>
      )}
    </div>
  );
}
