import { useEffect, useState } from 'react';
import { Search, Filter, Calendar, CheckSquare, Layers, History as HistoryIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth, login } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export function HistoryPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'scans'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScans(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center border border-white/10">
          <HistoryIcon className="w-10 h-10 text-zinc-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-white">Login Required</h2>
          <p className="text-zinc-500">Sign in to view your scan history and analytics.</p>
        </div>
        <button 
          onClick={() => login()}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-all font-['Space_Grotesk'] uppercase tracking-widest"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-bold text-white font-['Space_Grotesk'] mb-2">Scan History</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] font-['Space_Grotesk']">Calculated Brilliance / Archive</p>
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 font-['Space_Grotesk']">
          <CheckSquare className="w-4 h-4" />
          Select
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-center border-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            className="w-full bg-white/5 border-0 border-b border-white/5 focus:border-accent-cyan focus:ring-0 text-white pl-14 py-3 placeholder:text-slate-600 transition-all rounded-lg" 
            placeholder="Search by inference class..." 
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-3 bg-white/5 border border-white/5 text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 font-['Space_Grotesk'] rounded-lg hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4" />
            Matrix
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
             <div key={i} className="aspect-video glass-panel animate-pulse border-0" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {scans.length > 0 ? scans.map((scan) => (
            <motion.div 
              layout
              key={scan.id}
              className="group glass-panel overflow-hidden transition-all duration-300 hover:border-accent-cyan/40 border-0"
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={scan.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70" alt="Scan thumbnail" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark/90 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 bg-emerald-500/90 px-3 py-1 rounded-lg">
                  <span className="text-bg-dark font-bold text-[10px] uppercase tracking-widest">VERIFIED</span>
                </div>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="indicator indicator-online"></span>
                  <span className="text-[10px] text-white font-bold uppercase tracking-widest">PROCESSED</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                    {scan.timestamp?.toDate ? new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' }).format(scan.timestamp.toDate()) : 'Recent'}
                  </span>
                  <span className="text-2xl font-bold text-accent-cyan font-['Space_Grotesk']">
                    {scan.totalItems} <small className="text-[10px] uppercase text-slate-600 tracking-widest">nodes</small>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {scan.items?.slice(0, 3).map((item: any, i: number) => (
                    <span key={i} className="px-3 py-1 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-[10px] font-bold uppercase tracking-widest rounded-lg">
                      {item.className}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center text-zinc-600 font-['Space_Grotesk'] text-xl uppercase tracking-widest opacity-50">
              No scan history records found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
