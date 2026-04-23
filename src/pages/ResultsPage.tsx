import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Code, CheckCircle, User, Car, Package, ChevronRight, RefreshCw } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import { motion } from 'motion/react';

export function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, imageUrl } = location.state || {};

  useEffect(() => {
    if (!results || !imageUrl) {
      navigate('/');
      return;
    }

    // Auto-save to history if logged in
    const saveToHistory = async () => {
      if (auth.currentUser) {
        try {
          await addDoc(collection(db, 'scans'), {
            ...results,
            imageUrl,
            userId: auth.currentUser.uid,
            timestamp: serverTimestamp()
          });
        } catch (e) {
          console.error("Error saving scan:", e);
        }
      }
    };
    saveToHistory();
  }, [results, imageUrl, navigate]);

  if (!results) return null;

  const getIconForClass = (className: string) => {
    const lower = className.toLowerCase();
    if (lower.includes('person') || lower.includes('human')) return User;
    if (lower.includes('car') || lower.includes('vehicle')) return Car;
    return Package;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white font-['Space_Grotesk']">Detection Results</h2>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Real-time object verification session</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Main Visual Display */}
          <div className="relative aspect-video rounded-2xl overflow-hidden glass-panel border-0 group">
            <img src={imageUrl} alt="Result" className="w-full h-full object-contain opacity-60" />
            
            {/* Visual Overlays */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-accent-cyan opacity-50 animate-scan shadow-[0_0_10px_#22d3ee]"></div>
            
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-accent-cyan/30"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-accent-cyan/30"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-accent-cyan/30"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-accent-cyan/30"></div>
          </div>

          {/* Stats Bar */}
          <div className="glass-panel px-8 py-6 flex flex-wrap items-center justify-between gap-6 border-0">
            <div className="flex items-center gap-10">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Total Nodes</p>
                <p className="text-3xl font-bold font-['Space_Grotesk'] text-white">{results.totalItems}</p>
              </div>
              <div className="w-px h-10 bg-white/5"></div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Latency</p>
                <p className="text-3xl font-bold font-['Space_Grotesk'] text-white">{results.processingTime}<span className="text-sm font-normal text-slate-500 ml-1">ms</span></p>
              </div>
              <div className="w-px h-10 bg-white/5"></div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Cluster</p>
                <p className="text-3xl font-bold font-['Space_Grotesk'] text-white">Vortex-AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="indicator indicator-online"></span>
              <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest">Encryption Verified</span>
            </div>
          </div>

          {/* Class Distribution */}
          <div className="glass-panel p-8 border-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 font-['Space_Grotesk']">Resource Mapping</h3>
            <div className="space-y-6">
              {results.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-6">
                  <span className="w-20 font-bold text-xs uppercase text-slate-400 tracking-tighter">{item.className}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / results.totalItems) * 100}%` }}
                      className="h-full bg-accent-cyan rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                    />
                  </div>
                  <span className="w-8 font-bold text-lg text-white font-['Space_Grotesk']">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white px-2 font-['Space_Grotesk']">Identified Objects</h3>
            {results.items.map((item: any, i: number) => {
              const Icon = getIconForClass(item.className);
              return (
                <div key={i} className="glass-panel p-6 flex items-center justify-between group hover:border-accent-cyan/50 transition-all cursor-pointer border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                      <Icon className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{item.className}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Confidence: {(item.confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                  <p className="text-4xl font-bold font-['Space_Grotesk'] text-accent-cyan">{item.count}</p>
                </div>
              );
            })}
          </div>

          {/* Action Box */}
          <div className="glass-panel p-8 space-y-6 border-0">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white font-['Space_Grotesk']">Data Pipeline</h3>
            <button className="w-full flex items-center justify-between px-6 py-4 bg-accent-cyan text-bg-dark rounded-xl font-bold hover:bg-white active:scale-[0.98] transition-all">
              <span>Generate Archive</span>
              <Download className="w-5 h-5" />
            </button>
            <button className="w-full flex items-center justify-between px-6 py-4 border border-white/10 text-white rounded-xl font-bold hover:bg-white/5 active:scale-[0.98] transition-all">
              <span>Source Manifest</span>
              <Code className="w-5 h-5" />
            </button>
            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center gap-2 py-4 text-accent-cyan font-bold hover:text-white transition-colors uppercase tracking-widest text-xs"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Detect Another Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Final Action Footer */}
      <section className="pt-10 border-t border-white/5 flex justify-center">
        <button 
          onClick={() => navigate('/')}
          className="group flex items-center gap-4 px-10 py-6 rounded-2xl bg-white/5 border border-white/10 hover:border-accent-cyan/50 transition-all duration-300"
        >
          <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center text-accent-cyan group-hover:scale-110 transition-transform">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-lg">System Reset</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Initialize new detection sequence</p>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-700 group-hover:text-accent-cyan transition-colors ml-4" />
        </button>
      </section>
    </div>
  );
}
