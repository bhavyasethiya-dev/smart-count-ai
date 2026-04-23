import { useState } from 'react';
import { BrainCircuit, Upload, Info, Construction, ShieldCheck, Sliders, ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export function SettingsPage() {
  const { user, login, logout } = useAuth();
  const [confidence, setConfidence] = useState(75);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-2">
        <h2 className="text-5xl font-bold text-white font-['Space_Grotesk']">Application Settings</h2>
        <p className="text-zinc-500 text-lg">Configure AI vision models and system preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Section */}
        <section className="glass-panel p-8 flex flex-col gap-6 md:col-span-2 border-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-accent-cyan w-6 h-6" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-['Space_Grotesk']">Matrix Access</h3>
          </div>
          <div className="flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-4">
                <img src={user.photoURL || ''} className="w-12 h-12 rounded-xl border border-white/20" alt="Avatar" />
                <div>
                  <p className="text-white font-bold">{user.displayName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Authenticate session to sync across neural clusters.</p>
            )}
            <button 
              onClick={user ? () => logout() : () => login()}
              className="px-6 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
            >
              {user ? 'Terminate' : 'Authorize'}
            </button>
          </div>
        </section>

        {/* Model Management */}
        <section className="glass-panel p-8 flex flex-col gap-6 border-0">
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-accent-cyan w-6 h-6" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-['Space_Grotesk']">Inference Core</h3>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Selected Engine</label>
            <div className="relative">
              <select className="w-full bg-bg-dark/50 border border-white/5 rounded-xl px-4 py-3 text-white appearance-none focus:border-accent-cyan outline-none transition-colors font-bold text-sm">
                <option>Gemini 1.5 Flash (Default)</option>
                <option>Vortex-Prime-v9</option>
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-500 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Custom Model Upload */}
        <section className="glass-panel p-8 flex flex-col gap-6 border-dashed border-white/10">
          <div className="flex items-center gap-3">
            <Upload className="text-accent-blue w-6 h-6" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-['Space_Grotesk']">Custom Weights</h3>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-xl p-6 hover:border-accent-blue/50 transition-colors cursor-pointer group bg-white/5">
            <Sliders className="w-8 h-8 text-slate-600 group-hover:text-accent-blue mb-2 transition-colors" />
            <span className="text-sm font-bold text-white uppercase tracking-widest font-['Space_Grotesk']">Inject Tensor</span>
          </div>
        </section>

        {/* Preferences */}
        <section className="glass-panel p-8 flex flex-col gap-6 md:col-span-2 border-0">
          <div className="flex items-center gap-3">
            <Sliders className="text-emerald-400 w-6 h-6" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-['Space_Grotesk']">Global Parameters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-white uppercase tracking-widest font-['Space_Grotesk']">Inference Sensitivity</label>
                <span className="text-accent-cyan font-bold text-sm">{confidence}%</span>
              </div>
              <input 
                type="range" 
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-cyan" 
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white uppercase tracking-widest font-['Space_Grotesk']">Advanced Telemetry</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Show raw probability matrices</span>
              </div>
              <div className="w-12 h-6 bg-accent-cyan rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-bg-dark rounded-full translate-x-6"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Maintenance */}
        <section className="bg-zinc-900/50 border border-white/10 p-8 rounded-xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Construction className="text-red-500 w-6 h-6" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-['Space_Grotesk']">Management</h3>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <p className="text-xs text-zinc-500 mb-6">Permanently erase all local inference session history and analytical data.</p>
            <button className="w-full py-4 bg-red-950/20 border border-red-900/30 text-red-500 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-950/40 transition-all font-['Space_Grotesk']">
              Nuke History
            </button>
          </div>
        </section>

        {/* App Info */}
        <section className="bg-zinc-900/50 border border-white/10 p-8 rounded-xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Info className="text-zinc-400 w-6 h-6" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-white font-['Space_Grotesk']">System Diagnostic</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Version</span>
              <span className="text-xs font-mono text-white">v12.4.9-Stable</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Registry Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Cloud Online</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Neural Layer</span>
              <span className="text-xs text-white uppercase font-bold">Tensor Engine X</span>
            </div>
          </div>
        </section>
      </div>

      <div className="p-8 bg-blue-600/5 border border-blue-600/20 rounded-xl flex items-start gap-6">
        <ShieldCheck className="text-blue-500 w-8 h-8 flex-shrink-0" />
        <div>
          <h4 className="text-lg font-bold text-white mb-1 font-['Space_Grotesk']">Enterprise-Grade Security</h4>
          <p className="text-sm text-zinc-400 leading-relaxed">SmartCount processes visual data through localized neural nodes first. No identifiable biometric data is transmitted or stored in persistent cloud storage without explicit cryptographic verification.</p>
        </div>
      </div>
    </div>
  );
}
