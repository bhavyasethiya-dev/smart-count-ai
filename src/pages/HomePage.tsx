import React, { useState, useRef, useEffect } from 'react';
import { Upload, Video, Link as LinkIcon, Play, Target, Cpu, Camera, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { detectObjects } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export function HomePage() {
  const [imageUrl, setImageUrl] = useState('');
  const [confidence, setConfidence] = useState(0.85);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraMode, setCameraMode] = useState<'user' | 'environment'>('user');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Unified attachment logic using a callback ref
  const setVideoRef = React.useCallback((node: HTMLVideoElement | null) => {
    if (node) {
      videoRef.current = node;
      if (streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().catch(e => console.warn("Auto-play blocked:", e));
      }
    }
  }, [isCameraActive, cameraMode]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // If user types a URL, we try to use it as preview directly
    // Note: detectObjects will need base64, so we handle that translation in handleRunDetection
    if (imageUrl && imageUrl.startsWith('http')) {
      setPreviewImage(imageUrl);
    }
  }, [imageUrl]);

  const startCamera = async () => {
    setIsCameraLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: cameraMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      setPreviewImage(null);
    } catch (err) {
      console.error("Camera access error:", err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallbackStream;
        setIsCameraActive(true);
        setPreviewImage(null);
      } catch (fallbackErr) {
        console.error("Fallback camera error:", fallbackErr);
        alert("Could not access camera. Please ensure you have granted camera permissions in your browser settings.");
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  const toggleCamera = () => {
    const newMode = cameraMode === 'user' ? 'environment' : 'user';
    setCameraMode(newMode);
    if (isCameraActive) {
      stopCamera();
      // Small timeout to ensure tracks are closed before reopening
      setTimeout(() => {
        navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newMode } 
        })
        .then(stream => {
          streamRef.current = stream;
          setIsCameraActive(true);
        })
        .catch(e => console.error("Toggle camera error:", e));
      }, 100);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Target a conservative resolution for faster AI processing (max 768px)
      const maxDim = 768;
      let width = video.videoWidth;
      let height = video.videoHeight;
      
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame to the canvas
        ctx.drawImage(video, 0, 0, width, height);
        // Use lower quality jpeg (0.6) to significantly reduce payload size
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setPreviewImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunDetection = async () => {
    if (!previewImage) return;
    setIsProcessing(true);
    try {
      let imageToProcess = previewImage;

      // If it's a URL, we must convert it to base64 for Gemini
      if (previewImage.startsWith('http')) {
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(previewImage)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error('Failed to fetch via proxy');
          const blob = await response.blob();
          const reader = new FileReader();
          imageToProcess = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.error("Failed to fetch image URL:", err);
          alert("Could not process image from the provided URL. It might be inaccessible or the server proxy encountered an error.");
          setIsProcessing(false);
          return;
        }
      }

      const results = await detectObjects(imageToProcess, confidence);
      // Navigate to results page with data
      navigate('/results', { state: { results, imageUrl: imageToProcess } });
    } catch (error: any) {
      console.error("Detection Error:", error);
      let message = 'Detection failed. Please try again.';
      
      if (error?.message?.includes('fetch')) {
        message = 'Network error: Please check your internet connection or VPN.';
      } else if (error?.message?.includes('API_KEY')) {
        message = 'Authentication error: Please verify your Gemini API Key in Vercel settings.';
      } else if (error?.message?.includes('Safety')) {
        message = 'Safety filter: The image content triggered a security block. Please try a clearer angle.';
      }
      
      alert(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-10 border-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/20 to-transparent"></div>
          <img 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZGDpbdUfnPN9uynHWrhpjlT7YybtDqhukbRXmgE7SG-ZqdTtkjRDd8DJVqhmCA5jm4pKTloXqdU3s9QuTM8mR4cRWUUqxuv4kgH22OBLDqQVIVycqB22v8NJwK7myUSmaENRuTTiSxHhvBWpBBg9K8rPkxj_3FTcw-0AiuD6E-BLXF1YNXLG5zZNVnv-siSWg63t52w0XTXvtQitKPi1RZGHOTQ42QbMtAqF-SVU-tDPuHsINHZq9M5nuhnkpmo6pBfujR3pXsr0" 
            alt="Hero Background"
          />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="indicator indicator-online"></span>
            <span className="font-bold text-[10px] uppercase tracking-widest">Neural Cluster Active</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight text-white max-w-2xl font-['Space_Grotesk']">SmartCount AI</h2>
          <p className="text-slate-400 max-w-xl text-lg leading-relaxed">
            Scalable object verification pipeline. Our neural engine processes high-density visual data with sub-millisecond precision.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Card */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-accent-cyan/50 transition-all duration-300 min-h-[280px]"
          >
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            <div className="w-16 h-16 rounded-2xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-6 border border-accent-cyan/20 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 font-['Space_Grotesk']">Upload Image</h3>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Local File System Pipeline</p>
          </div>

          {/* Webcam Card */}
          <div 
            onClick={isCameraActive ? stopCamera : startCamera}
            className={cn(
              "glass-panel p-8 flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 min-h-[280px]",
              isCameraActive ? "border-accent-cyan bg-accent-cyan/5" : "hover:border-accent-cyan/50"
            )}
          >
            <div className={cn(
              "w-16 h-16 rounded-2xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-6 border border-accent-cyan/20 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/10",
              isCameraActive && "animate-pulse"
            )}>
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1 font-['Space_Grotesk']">
              {isCameraActive ? "Stop Stream" : "Live Stream"}
            </h3>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">
              {isCameraActive ? "Active Feed Engine" : "Real-time Vision Cluster"}
            </p>
          </div>

          {/* URL Input Section */}
          <div className="md:col-span-2 glass-panel p-8 space-y-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="text-accent-cyan w-5 h-5" />
              <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Remote Data URI</label>
            </div>
            <input 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-white/5 border-b-2 border-white/5 focus:border-accent-cyan outline-none p-4 text-white transition-all placeholder:text-slate-600 rounded-lg" 
              placeholder="https://cdn.vortex.io/vision-data-01.jpg" 
            />
          </div>
        </div>

        {/* Settings Side Panel */}
        <aside className="lg:col-span-4 h-full">
          <div className="glass-panel p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-bold text-white font-['Space_Grotesk']">Matrix Parameters</h3>
              <Target className="text-slate-500 w-5 h-5" />
            </div>
            
            <div className="space-y-10 flex-grow">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Inference Threshold</label>
                  <span className="text-accent-cyan font-bold font-['Space_Grotesk']">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.01" 
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-cyan"
                />
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight">Vision Compute Engine v1.5</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Optimized for concurrent object resolution in high-load clusters.
                </p>
              </div>
            </div>

            <div className="pt-10 mt-auto">
              <button 
                onClick={handleRunDetection}
                disabled={!previewImage || isProcessing}
                className={cn(
                  "w-full py-6 rounded-xl font-bold text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10",
                  !previewImage || isProcessing 
                    ? "bg-white/5 text-slate-600 cursor-not-allowed border border-white/5" 
                    : "bg-accent-cyan text-bg-dark hover:bg-white transition-colors active:scale-95"
                )}
              >
                {isProcessing ? (
                   <span className="animate-spin rounded-full h-5 w-5 border-2 border-bg-dark/20 border-t-bg-dark"></span>
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                {isProcessing ? 'CALCULATING...' : 'EXECUTE SCAN'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Preview Section */}
      <section className="glass-panel overflow-hidden min-h-[400px] relative group border-0">
        <canvas ref={canvasRef} className="hidden" />
        <AnimatePresence mode="wait">
          {isCameraActive ? (
            <motion.div 
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black flex items-center justify-center"
            >
              <video 
                ref={setVideoRef} 
                autoPlay 
                playsInline 
                muted 
                onClick={() => {
                  console.log("Manual play trigger");
                  videoRef.current?.play();
                }}
                className={cn(
                  "w-full h-full object-cover bg-black",
                  cameraMode === 'user' && "-scale-x-100"
                )}
              />
              {isCameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                    <span className="text-[10px] text-accent-cyan font-bold uppercase tracking-widest">Bridging Neural Interface...</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
                <button 
                  onClick={captureImage}
                  className="bg-accent-cyan text-bg-dark p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group"
                >
                  <Camera className="w-8 h-8" />
                </button>
                <button 
                  onClick={stopCamera}
                  className="bg-white/10 backdrop-blur-md text-white p-4 rounded-full border border-white/20 hover:bg-white/20 transition-all"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>
              <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">Live Feed</span>
              </div>
              <div className="absolute top-6 right-6">
                <button 
                  onClick={toggleCamera}
                  className="bg-white/10 backdrop-blur-md text-white p-3 rounded-full border border-white/20 hover:bg-white/20 transition-all active:rotate-180 duration-500"
                  title="Flip Camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : previewImage ? (
            <motion.img 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={previewImage} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div key="placeholder" className="absolute inset-0 flex flex-col items-center justify-center text-slate-800 pointer-events-none">
              <Target className="w-24 h-24 mb-6 opacity-20" />
              <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">Awaiting inference sequence...</p>
            </div>
          )}
        </AnimatePresence>
        
        {/* Scanning line effect */}
        {isProcessing && (
           <motion.div 
             initial={{ top: '0%' }}
             animate={{ top: '100%' }}
             transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
             className="absolute w-full h-[1px] bg-accent-cyan shadow-[0_0_15px_#22d3ee]" 
           />
        )}
        
        {/* Corner Brackets */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-accent-cyan/20"></div>
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-accent-cyan/20"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-accent-cyan/20"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-accent-cyan/20"></div>
      </section>
    </div>
  );
}
