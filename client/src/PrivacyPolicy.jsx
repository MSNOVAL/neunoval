import { useNavigate } from 'react-router-dom';

function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-6 md:p-12 selection:bg-white/20">
      <button onClick={() => navigate('/')} className="mb-12 text-xs font-mono text-zinc-500 hover:text-white uppercase tracking-widest transition-colors">
        &larr; Back to Studio
      </button>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-3xl md:text-5xl font-medium text-white mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-12">Last updated: January 2026</p>
        
        <div className="space-y-10 text-sm leading-7 text-zinc-400 font-light">
          <section>
             <h2 className="text-lg text-white font-medium mb-4">1. Introduction</h2>
             <p>At NeuNoval Studio, we are committed to protecting your personal information and your right to privacy. When you visit our website and use our services, you trust us with your personal information. We take your privacy very seriously.</p>
          </section>

          <section>
             <h2 className="text-lg text-white font-medium mb-4">2. Information We Collect</h2>
             <p>We collect minimal personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and services.</p>
          </section>

          <section>
             <h2 className="text-lg text-white font-medium mb-4">3. How We Use Your Information</h2>
             <p>We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests.</p>
          </section>
          
          <section>
             <h2 className="text-lg text-white font-medium mb-4">4. Contact Us</h2>
             <p>If you have questions or comments about this policy, you may contact us through our social media channels.</p>
          </section>
        </div>
        
        <div className="mt-16 pt-8 border-t border-white/5">
             <p className="text-[10px] text-zinc-600 uppercase tracking-widest">NeuNoval Studio Legal</p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
