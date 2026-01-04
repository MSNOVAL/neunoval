import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [recentApps, setRecentApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Security States
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
        // Shortcut: Ctrl + Shift + A
        if (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            setShowSecurityModal(true);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/apps`);
      if (response.ok) {
        const data = await response.json();
        setRecentApps(data.slice(0, 4)); 
      }
    } catch (error) {
      console.error("Failed to fetch apps:", error);
    }
  };

  const handleSecurityCheck = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: accessCode })
        });
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) throw new Error("ServerOld");
        
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('neunoval_auth_token', data.token);
            navigate('/neunoval-private-access');
        } else {
            setErrorMsg("ACCESS DENIED");
            setAccessCode("");
        }
    } catch (err) {
        setErrorMsg("ERROR");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/20 overflow-x-hidden relative">
      
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/[0.03] rounded-full blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed w-full z-50 top-4 md:top-6 px-4 md:px-6">
        <div className="max-w-5xl mx-auto h-14 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-full flex items-center justify-between px-4 md:px-6 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
             <div className="w-2 h-2 bg-white rounded-full group-hover:scale-125 transition-transform"></div>
             <span className="text-xs md:text-sm font-semibold tracking-tight text-white group-hover:text-zinc-200 transition-colors">NeuNoval Studio</span>
          </div>
          <div className="flex items-center">
             <button onClick={() => navigate('/catalog')} className="text-[10px] md:text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 md:px-4 md:py-2 hover:bg-white/5 rounded-full">
                Catalog
             </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-32 md:pt-48 pb-20 md:pb-32">
        {/* HERO */}
        <div className="text-center mb-20 md:mb-32">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] mb-6 md:mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] md:text-[10px] font-medium text-zinc-400 uppercase tracking-widest">Est. 2026</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-medium tracking-tighter text-white mb-6 md:mb-8 leading-[0.9]">
               Digital<br/>
               <span className="text-zinc-500">Architecture.</span>
            </h1>
            <p className="text-sm md:text-lg text-zinc-400 font-light max-w-lg mx-auto mb-8 md:mb-12 leading-relaxed px-4">
               Crafting exclusive software solutions with precision, security, and minimalist aesthetics.
            </p>
            <button onClick={() => navigate('/catalog')} className="group relative inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-3 bg-white text-black rounded-full hover:bg-zinc-200 transition-all duration-300">
                <span className="text-xs md:text-sm font-semibold tracking-tight">Explore Work</span>
                <svg className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </button>
        </div>

        {/* PROJECTS GRID */}
        <div className="mb-24">
            <div className="flex items-baseline justify-between mb-8 md:mb-12 border-b border-white/10 pb-4 md:pb-6">
                <h2 className="text-xl md:text-2xl font-normal text-white tracking-tight">Selected Works</h2>
                <span className="text-[10px] md:text-xs font-mono text-zinc-600 uppercase tracking-widest">01 — 04</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {recentApps.map((app, index) => (
                    <div 
                        key={index} 
                        onClick={() => setSelectedApp(app)}
                        className="group relative aspect-[4/5] bg-zinc-900/20 border border-white/5 hover:border-indigo-500/20 rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:bg-zinc-900/40 shadow-xl"
                    >
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <div className={`w-16 h-16 mb-6 bg-white/5 p-3 shadow-xl border border-white/5 group-hover:scale-110 group-hover:border-white/10 transition-all duration-500 overflow-hidden flex items-center justify-center ${app.logoShape || 'rounded-2xl'}`}>
                                {app.logoUrl ? (
                                    <img src={app.logoUrl} alt="Logo" className={`w-full h-full object-cover ${app.logoShape || 'rounded-2xl'}`} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-zinc-700 font-mono">NULL</div>
                                )}
                            </div>
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors duration-300 text-center">{app.name}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-black z-10 relative">
          <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-2 opacity-60 select-none">
                 <div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
                 <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">NeuNoval Studio &copy; 2026</span>
              </div>
              <div className="flex flex-col items-start md:items-end gap-6">
                  <div className="flex gap-8">
                      <button onClick={() => navigate('/privacy')} className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest">Privacy</button>
                      <button onClick={() => navigate('/terms')} className="text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest">Terms</button>
                  </div>
                  <div className="flex gap-6 opacity-60">
                      <a href="https://saweria.co/NeuNoval" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-all transform hover:scale-110"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.39 2.1-1.39 1.31 0 1.96.59 2.22 1.5h1.43c-.24-1.21-1.16-2.1-2.55-2.38V6h-2v1.27c-1.51.33-2.55 1.29-2.55 2.56 0 1.65 1.35 2.48 3.31 2.97 2.15.53 2.59.9 2.59 1.76 0 .73-.49 1.48-2.29 1.48-1.39 0-2.17-.62-2.46-1.44h-1.45c.25 1.5 1.38 2.26 2.71 2.56V18h2v-1.29c1.53-.31 2.73-1.23 2.73-2.77 0-2.08-1.4-2.65-3.49-3.1z"/></svg></a>
                      <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-all transform hover:scale-110"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.58-1.11-.01 3.24.02 9.42-3.15 11.69-1.63 1.18-3.79 1.5-5.77 1.11-2.02-.38-3.86-1.74-4.82-3.56-1.17-2.18-.89-4.97.66-6.84 1.45-1.78 3.86-2.65 6.13-2.22v4.03c-1.45-.47-3.17-.18-4.26.83-.93.89-1.09 2.45-.33 3.55.77 1.12 2.37 1.48 3.63.88 1.25-.56 1.83-1.92 1.84-3.26.01-4.22.01-8.44.01-12.66-.02-.85-.04-1.28-.05-1.39z"/></svg></a>
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-all transform hover:scale-110"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
                      <a href="https://whatsapp.com/channel/0029VbBlGvUHwXb9Bj8BOB0p" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-all transform hover:scale-110"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg></a>
                  </div>
              </div>
          </div>
      </footer>

      {/* DETAIL MODAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="bg-[#09090b] w-full max-w-6xl h-[85vh] border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row relative animate-fade-in">
                <button onClick={() => setSelectedApp(null)} className="absolute top-6 right-6 z-50 text-white opacity-50 hover:opacity-100 p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                <div className="w-full h-1/2 md:h-full md:w-2/3 bg-black relative flex flex-col border-r border-white/5">
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
                        <img src={selectedApp.activeScreenshot || selectedApp.screenshotUrl} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl" />
                    </div>
                    {selectedApp.screenshots && selectedApp.screenshots.length > 1 && (
                        <div className="h-20 border-t border-white/5 bg-[#050505] flex items-center justify-center gap-3 px-6 overflow-x-auto no-scrollbar flex-shrink-0">
                            {selectedApp.screenshots.map((src, i) => (
                                <div key={i} onClick={(e) => { e.stopPropagation(); setSelectedApp({...selectedApp, activeScreenshot: src}); }} className={`h-12 w-20 rounded-md overflow-hidden cursor-pointer transition-all ${ (selectedApp.activeScreenshot || selectedApp.screenshotUrl) === src ? 'ring-2 ring-white opacity-100' : 'opacity-40 hover:opacity-80' }`}><img src={src} className="w-full h-full object-cover" /></div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="w-full h-1/2 md:h-full md:w-1/3 bg-[#09090b] flex flex-col overflow-hidden">
                    <div className="p-8 pb-4 border-b border-white/5 flex-shrink-0">
                        <div className="flex items-start gap-5">
                            <div className={`w-14 h-14 bg-white/5 p-2 border border-white/10 shadow-lg flex items-center justify-center overflow-hidden ${selectedApp.logoShape || 'rounded-2xl'}`}>
                                 {selectedApp.logoUrl && <img src={selectedApp.logoUrl} alt="Icon" className={`w-full h-full object-cover ${selectedApp.logoShape || 'rounded-2xl'}`} />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{selectedApp.name}</h2>
                                <span className="text-[10px] font-mono text-indigo-400">v{selectedApp.versions ? selectedApp.versions[0].version : selectedApp.version}</span>
                            </div>
                        </div>
                    </div>
                    {!selectedApp.viewPlatform ? (
                        <div className="flex-1 flex flex-col overflow-hidden p-8 pt-4">
                            <div className="flex-1 overflow-y-auto no-scrollbar mb-6">
                                <h3 className="text-[10px] font-bold text-zinc-600 uppercase mb-3 tracking-widest">About</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed font-light whitespace-pre-wrap">{selectedApp.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {['android', 'windows', 'ios', 'linux'].map(platform => {
                                    const versions = selectedApp.versions || [];
                                    const isAvailable = versions.some(v => v.files && v.files[platform]);
                                    return (
                                        <button key={platform} disabled={!isAvailable} onClick={() => setSelectedApp({ ...selectedApp, viewPlatform: platform })} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isAvailable ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08]' : 'opacity-20 cursor-not-allowed'}`}>
                                            <div className="w-5 h-5 flex items-center justify-center">
                                                <img src={`https://cdn.simpleicons.org/${platform === 'ios' ? 'apple' : platform === 'windows' ? 'windows11' : platform}/white`} className="w-full h-full object-contain" alt={platform} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase text-white">{platform}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col overflow-hidden p-8 pt-4 animate-fade-in">
                            <button onClick={() => setSelectedApp({ ...selectedApp, viewPlatform: null })} className="mb-6 text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">← Back</button>
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                {(() => {
                                    const versions = (selectedApp.versions || []).filter(v => v.files && v.files[selectedApp.viewPlatform]);
                                    const latest = versions[0];
                                    if (!latest) return null;
                                    return (
                                        <>
                                            <div className="bg-white/[0.03] border border-white/10 p-5 rounded-xl mb-8 flex flex-col gap-4">
                                                <div className="text-2xl font-bold text-white">v{latest.version}</div>
                                                <a href={latest.files[selectedApp.viewPlatform]} className="w-full py-3 bg-white text-black font-black uppercase text-[10px] rounded-lg text-center">Download Latest</a>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] font-bold text-zinc-600 uppercase">History</h4>
                                                {versions.slice(1).map((v, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white/[0.01] rounded-lg border border-white/5">
                                                        <div className="text-xs font-bold text-zinc-300">v{v.version}</div>
                                                        <a href={v.files[selectedApp.viewPlatform]} className="text-[9px] font-bold text-zinc-500 uppercase">Get</a>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {isLightboxOpen && selectedApp && (
        <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setIsLightboxOpen(false)}>
            <img src={selectedApp.activeScreenshot || selectedApp.screenshotUrl} className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* SECURITY MODAL */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-sm">
            <div className="w-full max-w-md p-12 text-center relative">
                <button onClick={() => setShowSecurityModal(false)} className="absolute top-8 right-8 text-zinc-600 hover:text-white">Esc</button>
                <form onSubmit={handleSecurityCheck}>
                    <input type="password" autoFocus value={accessCode} onChange={(e) => setAccessCode(e.target.value)} className="w-full bg-transparent border-b border-white/20 text-white py-4 text-center text-2xl tracking-[0.5em] focus:outline-none mb-8" placeholder="••••" />
                    <button type="submit" className="text-xs font-mono text-zinc-500 hover:text-white uppercase tracking-widest">{isLoading ? 'Verifying...' : 'Authenticate Request'}</button>
                </form>
                {errorMsg && <div className="mt-8 text-red-500 text-xs font-mono uppercase">{errorMsg}</div>}
            </div>
        </div>
      )}

    </div>
  );
}

export default Home;