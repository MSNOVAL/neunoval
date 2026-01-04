import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Catalog() {
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    fetchApps();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
        setFilteredApps(apps);
    } else {
        const results = apps.filter(app => 
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredApps(results);
    }
  }, [searchTerm, apps]);

  const fetchApps = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/apps`);
      if (response.ok) {
        const data = await response.json();
        setApps(data);
        setFilteredApps(data);
      }
    } catch (error) {
      console.error("Failed to fetch apps:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-indigo-500/30">
      
      {/* Navbar Simple */}
      <nav className="border-b border-white/5 bg-[#050505]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => navigate('/')}>
             <span className="text-xs font-bold tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors uppercase">
              ← NeuNoval Home
            </span>
          </div>
          <div className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-widest border border-indigo-500/20 px-3 py-1 rounded-full bg-indigo-500/5">
              Archive Index
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        
        {/* HEADER & SEARCH SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/5 pb-10">
            <div className="max-w-xl">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tighter uppercase">Full <span className="text-indigo-500">Catalog</span></h1>
                <p className="text-gray-500 text-sm font-light leading-relaxed tracking-wide">
                    Akses perpustakaan lengkap aplikasi NeuNoval.
                </p>
            </div>
            
            <div className="w-full md:w-auto relative">
                <input 
                    type="text" 
                    className="block w-full md:w-96 pl-4 pr-4 py-4 bg-[#0a0a0a] border-b border-white/20 text-white placeholder-gray-700 focus:outline-none focus:border-indigo-500 transition-all text-sm tracking-widest uppercase font-mono"
                    placeholder="Search Database..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        {/* GRID RESULTS - UPDATED WITH LOGOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredApps.map((app, index) => (
                <div 
                    key={index} 
                    onClick={() => setSelectedApp(app)}
                    className="group cursor-pointer bg-[#0a0a0a] border border-white/5 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:bg-[#0f0f0f] relative overflow-hidden"
                >
                    <div className="p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 mb-6 bg-white/5 rounded-full p-2 group-hover:scale-110 transition-transform duration-300">
                             {app.logoUrl ? (
                                 <img src={app.logoUrl} alt="Icon" className="w-full h-full object-contain" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">NO ICON</div>
                             )}
                        </div>
                        <h3 className="text-sm font-bold text-white truncate w-full uppercase tracking-wider mb-2">{app.name}</h3>
                        <span className="text-[10px] font-mono text-gray-600 border border-white/10 px-2 py-0.5 rounded uppercase">v{app.version}</span>
                    </div>
                    
                    {/* Hover Effect Line */}
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                </div>
            ))}
        </div>

        {filteredApps.length === 0 && (
            <div className="py-32 text-center">
                <p className="text-gray-700 text-xs font-mono uppercase tracking-widest mb-4">No Matches Found</p>
                <button onClick={() => setSearchTerm("")} className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:text-white">Clear Filter</button>
            </div>
        )}

      </main>

      {/* --- MODAL DETAIL --- */}
      {selectedApp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="bg-[#050505] w-full max-w-5xl h-[80vh] border border-white/10 relative z-10 animate-fade-in shadow-2xl flex flex-col md:flex-row rounded-2xl overflow-hidden">
                <button onClick={() => setSelectedApp(null)} className="absolute top-4 right-4 z-50 text-white mix-blend-difference opacity-50 hover:opacity-100 p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                
                <div className="w-full md:w-2/3 h-1/2 md:h-full bg-zinc-900 relative flex flex-col">
                    <div className="flex-1 relative overflow-hidden">
                        <img 
                            src={selectedApp.activeScreenshot || selectedApp.screenshotUrl} 
                            alt="Screenshot" 
                            className="w-full h-full object-cover opacity-80 transition-all duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
                    </div>

                    {/* Gallery Thumbnails */}
                    {selectedApp.screenshots && selectedApp.screenshots.length > 1 && (
                        <div className="absolute bottom-6 left-6 right-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {selectedApp.screenshots.map((src, i) => (
                                <div 
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedApp({...selectedApp, activeScreenshot: src});
                                    }}
                                    className={`w-20 h-12 rounded border flex-shrink-0 cursor-pointer transition-all duration-300 ${
                                        (selectedApp.activeScreenshot || selectedApp.screenshotUrl) === src 
                                        ? 'border-white scale-105' 
                                        : 'border-white/10 opacity-40 hover:opacity-100'
                                    }`}
                                >
                                    <img src={src} className="w-full h-full object-cover" alt="thumb" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="w-full md:w-1/3 p-10 flex flex-col justify-center bg-[#050505] border-l border-white/5">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 border border-white/10 p-2 rounded-xl bg-white/5 shadow-lg">
                            {selectedApp.logoUrl && <img src={selectedApp.logoUrl} alt="Icon" className="w-full h-full object-contain" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-tight leading-tight">{selectedApp.name}</h2>
                            <span className="text-[10px] text-indigo-500 font-mono font-bold uppercase tracking-widest">v{selectedApp.version}</span>
                        </div>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed mb-10 font-light border-l border-white/5 pl-4">{selectedApp.description}</p>
                    <a href={selectedApp.appFileUrl} className="w-full py-4 bg-white text-black hover:bg-indigo-600 hover:text-white font-bold text-xs uppercase tracking-[0.2em] transition-all text-center rounded shadow-lg shadow-white/5">Download Package</a>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default Catalog;
