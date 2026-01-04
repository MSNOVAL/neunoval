import { useNavigate } from 'react-router-dom';

function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-6 md:p-12 selection:bg-white/20">
      <button onClick={() => navigate('/')} className="mb-12 text-xs font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
        &larr; Back to Studio
      </button>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-medium text-white mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-12">Effective Date: January 01, 2026</p>
        
        <div className="space-y-10 text-sm leading-7 text-zinc-400 font-light">
          <section>
             <h2 className="text-lg text-white font-medium mb-4">1. Agreement to Terms</h2>
             <p>These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and NeuNoval Studio ("we," "us" or "our"), concerning your access to and use of our website and software.</p>
          </section>

          <section>
             <h2 className="text-lg text-white font-medium mb-4">2. Intellectual Property Rights</h2>
             <p>Unless otherwise indicated, the Site and our software are our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") are owned or controlled by us.</p>
          </section>

          <section>
             <h2 className="text-lg text-white font-medium mb-4">3. User Representations</h2>
             <p>By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary.</p>
          </section>
          
           <section>
             <h2 className="text-lg text-white font-medium mb-4">4. Prohibited Activities</h2>
             <p>You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5">
             <p className="text-[10px] text-zinc-600 uppercase tracking-widest">NeuNoval Studio Legal</p>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
