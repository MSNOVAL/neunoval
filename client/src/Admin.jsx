import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: '', version: '', description: '' });
  const [logoShape, setLogoShape] = useState('rounded-2xl'); // Default shape
  const [files, setFiles] = useState({ 
      logo: null, 
      screenshot: [], 
      file_android: null, 
      file_windows: null, 
      file_ios: null, 
      file_linux: null 
  });
  const [previews, setPreviews] = useState({ logo: null, screenshot: [] }); // Store preview URLs
  const [deployedApps, setDeployedApps] = useState([]); // List of existing apps
  const [systemLog, setSystemLog] = useState(["System initialized...", "Secure connection established."]);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const token = localStorage.getItem('neunoval_auth_token');
    if (!token) navigate('/');
    
    fetchApps(); // Load existing apps

    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const fetchApps = async () => {
      try {
          const response = await fetch(`${API_BASE}/api/apps`);
          if (response.ok) {
              setDeployedApps(await response.json());
          }
      } catch (error) {
          console.error("Failed to load library:", error);
      }
  };

  const handleEdit = (app) => {
      setFormData({
          name: app.name,
          description: app.description,
          version: '' // Reset version for update
      });
      if (app.logoShape) setLogoShape(app.logoShape); // Load existing shape
      window.scrollTo({ top: 0, behavior: 'smooth' });
      addLog(`SYSTEM: Loaded data for "${app.name}". Ready for update.`);
  };

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
      return () => {
          if (previews.logo) URL.revokeObjectURL(previews.logo);
          previews.screenshot.forEach(url => URL.revokeObjectURL(url));
      };
  }, [previews]);

  const addLog = (msg) => {
      setSystemLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (type, fileList) => {
      if (type === 'screenshot') {
          const newFiles = Array.from(fileList);
          
          if (files.screenshot.length + newFiles.length > 5) {
              alert("Limit Reached: You can only upload a maximum of 5 screenshots.");
              return;
          }

          setFiles(prev => ({
              ...prev,
              screenshot: [...prev.screenshot, ...newFiles]
          }));
          
          const newPreviews = newFiles.map(file => URL.createObjectURL(file));
          setPreviews(prev => ({
              ...prev,
              screenshot: [...prev.screenshot, ...newPreviews]
          }));
          
          addLog(`VISUAL: Added ${newFiles.length} screenshots.`);
      } else {
          const file = fileList[0];
          setFiles(prev => ({ ...prev, [type]: file }));
          
          if (type === 'logo') {
              const url = URL.createObjectURL(file);
              setPreviews(prev => ({ ...prev, logo: url }));
          }

          addLog(`${type.toUpperCase()} file loaded: ${file.name}`);
      }
  };

  const clearScreenshots = (e) => {
      e.preventDefault(); 
      e.stopPropagation();
      setFiles(prev => ({ ...prev, screenshot: [] }));
      setPreviews(prev => ({ ...prev, screenshot: [] }));
      addLog("VISUAL: Screenshot queue cleared.");
  };

  const handleLogout = () => {
      localStorage.removeItem('neunoval_auth_token');
      navigate('/');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Validate: Needs Name, Version, at least one platform, and Logo/Screenshots if it's a new app (Server handles strict checks, but basic client check helps)
    const hasPlatform = files.file_android || files.file_windows || files.file_ios || files.file_linux;
    
    if (!formData.name || !formData.version || !hasPlatform) {
        addLog("ERROR: Incomplete deployment data.");
        alert("System Notice: Name, Version, and at least ONE platform binary are required.");
        return;
    }

    if (files.screenshot.length > 5) {
        addLog("ERROR: Too many screenshots.");
        alert("System Notice: Maximum 5 screenshots allowed. Please clear gallery and select fewer.");
        return;
    }

    setUploading(true);
    addLog("Initiating upload sequence...");

    const data = new FormData();
    // CRITICAL: Append 'name' FIRST so Multer can read it in the destination callback
    data.append('name', formData.name);
    data.append('version', formData.version);
    data.append('description', formData.description);
    data.append('logoShape', logoShape); // Append Shape
    
    if (files.logo) data.append('appLogo', files.logo);
    files.screenshot.forEach(file => data.append('screenshot', file));

    // Append Platforms
    if (files.file_android) data.append('file_android', files.file_android);
    if (files.file_windows) data.append('file_windows', files.file_windows);
    if (files.file_ios) data.append('file_ios', files.file_ios);
    if (files.file_linux) data.append('file_linux', files.file_linux);

    const token = localStorage.getItem('neunoval_auth_token');

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': token },
        body: data,
      });

      if (response.ok) {
        addLog("SUCCESS: Package deployed to repository.");
        alert('System Update: Application deployed successfully.');
        setFormData({ name: '', version: '', description: '' });
        setFiles({ logo: null, screenshot: [], file_android: null, file_windows: null, file_ios: null, file_linux: null });
        setPreviews({ logo: null, screenshot: [] });
        setLogoShape('rounded-2xl'); // Reset shape
        
        // Reset file inputs visually
        document.querySelectorAll('input[type="file"]').forEach(input => input.value = "");
        fetchApps(); // Refresh library list
      } else {
        let errMsg = `Server Error (${response.status})`;
        try {
            const errData = await response.json();
            errMsg = errData.message || errMsg;
        } catch (e) {
            // response was not JSON (likely 500 HTML or 404)
            console.error("Non-JSON Error Response:", e);
        }
        
        addLog(`FAILURE: ${errMsg}`);
        alert(`Deployment Failed: ${errMsg}`);
        
        if (response.status === 403 || response.status === 401) handleLogout();
      }
    } catch (error) {
      console.error(error);
      addLog("CRITICAL: Connection failed.");
      alert('Network Error: Make sure the server is running and accessible.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-mono text-sm selection:bg-green-900/50">
      
      {/* TOP HEADER */}
      <header className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-bold tracking-[0.2em] text-white">NEUNOVAL COMMAND CENTER</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-gray-500">
              <span>CPU: NORMAL</span>
              <span>MEM: OPTIMAL</span>
              <span className="text-white">{currentTime}</span>
              <button onClick={handleLogout} className="text-red-500 hover:text-red-400 font-bold uppercase tracking-wider">[ Terminate ]</button>
          </div>
      </header>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
          
          {/* SIDEBAR INFO */}
          <aside className="w-full md:w-80 border-r border-white/10 bg-[#080808] p-6 hidden md:flex flex-col gap-8 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
              <div>
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">System Log</h3>
                  <div className="bg-black border border-white/5 p-4 rounded h-48 overflow-y-auto text-[10px] text-green-500/80 font-mono leading-relaxed custom-scrollbar">
                      {systemLog.map((log, i) => (
                          <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</div>
                      ))}
                  </div>
              </div>
              <div>
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Deployment Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded text-center">
                          <div className="text-2xl font-bold text-white mb-1">Active</div>
                          <div className="text-[9px] uppercase text-gray-500">Node Status</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded text-center">
                          <div className="text-2xl font-bold text-indigo-500 mb-1">Secure</div>
                          <div className="text-[9px] uppercase text-gray-500">Connection</div>
                      </div>
                  </div>
              </div>
          </aside>

          {/* MAIN FORM */}
          <main className="flex-1 p-6 md:p-12 overflow-y-auto">
              <div className="max-w-4xl mx-auto mb-20">
                  <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">New Package Deployment</h1>
                  <p className="text-gray-600 mb-10 text-xs uppercase tracking-widest">Authorized Personnel Only - ID: 822010</p>

                  <form onSubmit={handleUpload} className="space-y-8">
                      
                      {/* Section 1: Metadata */}
                      <div className="bg-[#0e0e0e] border border-white/5 p-6 rounded relative group hover:border-indigo-500/30 transition-colors">
                          <div className="absolute top-0 left-0 bg-white/5 text-[9px] text-gray-400 px-2 py-1 uppercase tracking-widest">Metadata Config</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              <div>
                                  <label className="block text-[10px] text-gray-500 uppercase mb-2">Application Name</label>
                                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-black border border-white/10 p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors rounded-sm" placeholder="e.g. Project Alpha" required />
                              </div>
                              <div>
                                  <label className="block text-[10px] text-gray-500 uppercase mb-2">Version Tag</label>
                                  <input type="text" name="version" value={formData.version} onChange={handleInputChange} className="w-full bg-black border border-white/10 p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors rounded-sm" placeholder="v1.0.0" required />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-[10px] text-gray-500 uppercase mb-2">System Description</label>
                                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-black border border-white/10 p-3 text-white focus:border-indigo-500 focus:outline-none transition-colors rounded-sm" placeholder="Technical specifications..." required />
                              </div>
                          </div>
                      </div>

                      {/* Section 2: Assets */}
                      <div className="bg-[#0e0e0e] border border-white/5 p-6 rounded relative group hover:border-indigo-500/30 transition-colors">
                          <div className="absolute top-0 left-0 bg-white/5 text-[9px] text-gray-400 px-2 py-1 uppercase tracking-widest">Asset Injection</div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                              {/* LOGO UPLOAD (NEW) */}
                              <div className="relative group md:col-span-1">
                                  <label className="block text-[10px] text-indigo-400 uppercase mb-2 font-bold flex justify-between items-center">
                                      <span>1. App Icon / Logo</span>
                                      <span className="text-[9px] text-gray-500">Shape: {logoShape.replace('rounded-', '')}</span>
                                  </label>
                                  
                                  <div className="h-48 border border-dashed border-white/20 bg-black/50 rounded flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-indigo-500 transition-all relative overflow-hidden mb-2">
                                      <input type="file" accept="image/*" onChange={(e) => handleFileChange('logo', e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer z-10" required={!formData.name} />
                                      {previews.logo ? (
                                          <div className="relative w-full h-full p-6 flex items-center justify-center">
                                              <img src={previews.logo} alt="Logo Preview" className={`w-32 h-32 object-cover shadow-2xl ${logoShape}`} />
                                              <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm ${logoShape}`}>
                                                  <span className="text-[10px] uppercase font-bold text-white tracking-widest">Change Icon</span>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex flex-col items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                              <div className={`w-16 h-16 bg-white/5 flex items-center justify-center border border-white/10 ${logoShape}`}>
                                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                              </div>
                                              <span className="text-[9px] text-gray-400 uppercase tracking-wide">Upload Logo</span>
                                          </div>
                                      )}
                                  </div>

                                  {/* Shape Selector */}
                                  <div className="flex bg-white/5 rounded p-1 gap-1">
                                      {['rounded-none', 'rounded-2xl', 'rounded-full'].map(shape => (
                                          <button
                                              key={shape}
                                              type="button"
                                              onClick={() => setLogoShape(shape)}
                                              className={`flex-1 py-1 text-[9px] uppercase font-bold transition-all rounded ${logoShape === shape ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                          >
                                              {shape === 'rounded-none' ? 'Square' : shape === 'rounded-full' ? 'Circle' : 'Rnd'}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              {/* SCREENSHOT UPLOAD */}
                              <div className="relative group md:col-span-2">
                                  <label className="block text-[10px] text-gray-500 uppercase mb-2 flex justify-between">
                                      <span>2. Visual Preview</span>
                                      {files.screenshot.length > 0 && (
                                          <button onClick={clearScreenshots} className="text-[9px] font-bold text-red-500 hover:text-white transition-colors z-30 relative uppercase tracking-wider">
                                              Clear Gallery
                                          </button>
                                      )}
                                  </label>
                                  <div className="h-48 border border-dashed border-white/20 bg-black/50 rounded flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 hover:border-white/40 transition-all relative overflow-hidden">
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        multiple 
                                        onChange={(e) => {
                                            handleFileChange('screenshot', e.target.files);
                                            e.target.value = null; 
                                        }} 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                                        required={files.screenshot.length === 0 && !formData.name}
                                      />
                                      
                                      {previews.screenshot.length > 0 ? (
                                          <div className="absolute inset-0 p-4 flex gap-4 overflow-x-auto items-center no-scrollbar z-10 pointer-events-none">
                                              {previews.screenshot.map((src, idx) => (
                                                  <div key={idx} className="relative w-32 h-full flex-shrink-0 border border-white/10 rounded-lg overflow-hidden bg-black/50 shadow-xl">
                                                      <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover opacity-90" />
                                                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white flex items-center justify-center text-[9px] font-bold rounded-full shadow-md z-20">
                                                          {idx + 1}
                                                      </div>
                                                  </div>
                                              ))}
                                              <div className="flex-shrink-0 w-24 h-24 flex items-center justify-center bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                                                  <span className="text-2xl text-white/20 font-light">+</span>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="flex flex-col items-center gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                              </div>
                                              <span className="text-[9px] text-gray-400 uppercase tracking-wide">Drop Screenshots<br/>(Select Multiple)</span>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              {/* PLATFORM BINARIES */}
                              <div className="md:col-span-3">
                                  <label className="block text-[10px] text-gray-500 uppercase mb-4 font-bold border-b border-white/10 pb-2">3. Platform Distribution Packages (At least one required)</label>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {/* Android */}
                                      <div className={`relative border border-dashed rounded p-4 flex items-center justify-between transition-colors ${files.file_android ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 hover:bg-white/5'}`}>
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center p-2">
                                                  <img src="https://cdn.simpleicons.org/android/A1A1AA" className="w-full h-full object-contain" alt="Android" />
                                              </div>
                                              <div>
                                                  <div className="text-[10px] uppercase font-bold text-gray-400">Android</div>
                                                  <div className="text-[9px] text-gray-600">.APK / .AAB</div>
                                              </div>
                                          </div>
                                          <input type="file" onChange={(e) => handleFileChange('file_android', e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                          {files.file_android && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                                      </div>

                                      {/* Windows */}
                                      <div className={`relative border border-dashed rounded p-4 flex items-center justify-between transition-colors ${files.file_windows ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/20 hover:bg-white/5'}`}>
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center p-2">
                                                  <img src="https://api.iconify.design/mdi:microsoft-windows.svg?color=%23A1A1AA" className="w-full h-full object-contain" alt="Windows" />
                                              </div>
                                              <div>
                                                  <div className="text-[10px] uppercase font-bold text-gray-400">Windows</div>
                                                  <div className="text-[9px] text-gray-600">.EXE / .MSI</div>
                                              </div>
                                          </div>
                                          <input type="file" onChange={(e) => handleFileChange('file_windows', e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                          {files.file_windows && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                                      </div>

                                      {/* iOS */}
                                      <div className={`relative border border-dashed rounded p-4 flex items-center justify-between transition-colors ${files.file_ios ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/20 hover:bg-white/5'}`}>
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center p-2">
                                                  <img src="https://cdn.simpleicons.org/apple/A1A1AA" className="w-full h-full object-contain" alt="iOS" />
                                              </div>
                                              <div>
                                                  <div className="text-[10px] uppercase font-bold text-gray-400">iOS</div>
                                                  <div className="text-[9px] text-gray-600">.IPA</div>
                                              </div>
                                          </div>
                                          <input type="file" onChange={(e) => handleFileChange('file_ios', e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                          {files.file_ios && <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>}
                                      </div>

                                      {/* Linux */}
                                      <div className={`relative border border-dashed rounded p-4 flex items-center justify-between transition-colors ${files.file_linux ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/20 hover:bg-white/5'}`}>
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center p-2">
                                                  <img src="https://cdn.simpleicons.org/linux/A1A1AA" className="w-full h-full object-contain" alt="Linux" />
                                              </div>
                                              <div>
                                                  <div className="text-[10px] uppercase font-bold text-gray-400">Linux</div>
                                                  <div className="text-[9px] text-gray-600">.DEB / .RPM</div>
                                              </div>
                                          </div>
                                          <input type="file" onChange={(e) => handleFileChange('file_linux', e.target.files)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                          {files.file_linux && <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-end pt-4">
                          <button 
                            type="submit" 
                            disabled={uploading}
                            className={`px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] ${uploading ? 'opacity-50 cursor-wait' : ''}`}
                          >
                              {uploading ? 'Executing Upload Protocol...' : 'Initiate Deployment'}
                          </button>
                      </div>

                  </form>
              </div>

              {/* DEPLOYED LIBRARY SECTION */}
              <div className="max-w-4xl mx-auto border-t border-white/10 pt-12">
                  <h2 className="text-xl font-bold text-white mb-8 uppercase tracking-tight flex items-center gap-3">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                      Active Deployment Library
                  </h2>
                  
                  <div className="grid gap-4">
                      {deployedApps.map((app) => (
                          <div key={app.id} className="bg-[#0e0e0e] border border-white/5 p-4 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-white/20 transition-colors gap-4">
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                  <div className={`w-12 h-12 bg-black p-2 border border-white/5 overflow-hidden flex items-center justify-center flex-shrink-0 ${app.logoShape || 'rounded-2xl'}`}>
                                      {app.logoUrl && <img src={app.logoUrl} alt="Logo" className="w-full h-full object-contain" />}
                                  </div>
                                  <div className="min-w-0">
                                      <h3 className="text-sm font-bold text-white uppercase tracking-wide truncate">{app.name}</h3>
                                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                                          <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">v{app.versions ? app.versions[0].version : app.version}</span>
                                          <span className="hidden sm:inline text-[10px] text-gray-600">|</span>
                                          <span className="text-[10px] text-gray-500">Updated: {new Date(app.versions ? app.versions[0].date : app.dateUploaded).toLocaleDateString()}</span>
                                      </div>
                                  </div>
                              </div>
                              <button 
                                  onClick={() => handleEdit(app)}
                                  className="w-full sm:w-auto px-4 py-2 bg-white/5 hover:bg-indigo-600 hover:text-white text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded transition-all text-center"
                              >
                                  Update / Edit
                              </button>
                          </div>
                      ))}
                      
                      {deployedApps.length === 0 && (
                          <div className="text-center py-12 text-gray-600 text-xs font-mono uppercase">
                              No active deployments found in registry.
                          </div>
                      )}
                  </div>
              </div>
          </main>
      </div>
    </div>
  );
}

export default Admin;