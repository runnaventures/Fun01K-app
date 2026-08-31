import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { MarketingNavigation } from '../components/Navigation';
import { MarketingFooter } from '../components/Footer';
import { Upload, X, Image as ImageIcon, CheckCircle } from 'lucide-react';

export default function ImageUploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageName, setImageName] = useState('dashboard-mockup.png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Image must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setUploadError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Read file as ArrayBuffer
      const reader = new FileReader();
      const fileData = await new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(selectedFile);
      });

      // Convert to Base64
      const base64 = btoa(
        new Uint8Array(fileData).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // Save to localStorage as a simple storage (since we can't write to filesystem directly)
      // In production, this would be an API call to your backend
      const imageData = {
        name: imageName || selectedFile.name,
        data: `data:${selectedFile.type};base64,${base64}`,
        timestamp: Date.now(),
        type: selectedFile.type,
        size: selectedFile.size,
      };

      // Save to localStorage
      localStorage.setItem('heroImage', JSON.stringify(imageData));

      // Also save as a blob URL for immediate preview
      const url = URL.createObjectURL(selectedFile);
      
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        // Navigate back to home
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setUploadError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setUploadError('Please drop an image file');
      }
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F3]">
      <MarketingNavigation />
      
      <main className="flex-1 py-16">
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="font-[Fraunces] text-3xl md:text-4xl text-[#0B1F33]">
                Upload Hero Image
              </h1>
              <p className="mt-2 text-[#5B6472]">
                Upload an image to appear on the homepage hero section.
              </p>
              <p className="text-sm text-[#5B6472]">
                Recommended size: 1200 x 800px (landscape)
              </p>
            </div>

            {/* Upload Area */}
            <div
              className={`relative rounded-2xl border-2 border-dashed p-8 transition-all ${
                preview
                  ? 'border-[#B8935A] bg-[#FAF8F3]'
                  : 'border-[#E7E2D8] bg-white hover:border-[#B8935A]/50'
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {preview ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-[#0B1F33]">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-auto max-h-[400px] object-contain"
                    />
                    <button
                      onClick={handleClear}
                      className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <ImageIcon className="w-4 h-4 text-[#B8935A]" />
                    <span className="text-[#0B1F33]">{selectedFile?.name}</span>
                    <span className="text-[#5B6472]">
                      ({(selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : 0)} KB)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[#0B1F33]/5 flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-[#B8935A]" />
                  </div>
                  <h3 className="text-lg font-medium text-[#0B1F33]">
                    Drop your image here
                  </h3>
                  <p className="text-sm text-[#5B6472] mt-2">
                    or click to browse files
                  </p>
                  <p className="text-xs text-[#5B6472] mt-1">
                    Supports: JPG, PNG, GIF, WebP (max 5MB)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Image Name Input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-[#0B1F33] mb-1">
                Image Name (optional)
              </label>
              <input
                type="text"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="dashboard-mockup.png"
                className="w-full px-4 py-2.5 rounded-lg border border-[#E7E2D8] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8935A]"
              />
              <p className="text-xs text-[#5B6472] mt-1">
                This will be the filename in the public folder
              </p>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {uploadError}
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Image uploaded successfully! Redirecting...
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex gap-4">
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-[#0B1F33] hover:bg-[#0B1F33]/90 text-white flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!selectedFile}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Container>
      </main>

      <MarketingFooter />
    </div>
  );
}