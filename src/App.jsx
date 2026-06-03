import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  // --- STATE MANAGEMENT ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [currentView, setCurrentView] = useState('home');
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [loginStatus, setLoginStatus] = useState({ loading: false, error: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Trigger the fade-in only on the very first website load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // --- SESSION PERSISTENCE ---
  useEffect(() => {
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    
    return () => subscription.unsubscribe();
  }, []);

  
  const handleViewChange = (newView) => {
    setIsLoaded(false); 
    setCurrentView(newView); 
    setTimeout(() => {
      setIsLoaded(true);
    }, 50);
  };
  
  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false }); // Newest first
      
      if (data) setSubmissions(data);
      if (error) console.error("Error fetching:", error);
    };

    if (isLoggedIn) {
      fetchSubmissions();
    }
  }, [isLoggedIn]);
  const [status, setStatus] = useState({ loading: false, message: '', type: '' });

  // --- API BACKEND CONNECTION ---

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    
    if (!formData.name.trim()) {
      return setStatus({ loading: false, message: 'Please enter your full name.', type: 'error' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setStatus({ loading: false, message: 'Please enter a valid email address.', type: 'error' });
    }
    if (formData.message.trim().length < 10) {
      return setStatus({ loading: false, message: 'Your message must be at least 10 characters long.', type: 'error' });
    }
    

    setStatus({ loading: true, message: '', type: '' });

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit form');
      
      setStatus({ loading: false, message: 'Message sent successfully!', type: 'success' });
      setFormData({ name: '', email: '', message: '' }); 
    } catch (err) {
      setStatus({ loading: false, message: err.message, type: 'error' });
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminCreds.email)) {
      return setLoginStatus({ loading: false, error: 'Please enter a valid email format (e.g., admin@shecan.org).' });
    }
    if (adminCreds.password.length < 6) {
      return setLoginStatus({ loading: false, error: 'Password must be at least 6 characters long.' });
    }
    

    setLoginStatus({ loading: true, error: '' });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminCreds.email,
        password: adminCreds.password,
      });

      if (error) throw error;

      setIsLoggedIn(true);
      setLoginStatus({ loading: false, error: '' });
    } catch (err) {
      setLoginStatus({ 
        loading: false, 
        error: err.message || 'Invalid login details.' 
      });
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
  };
  // --- THEME COLORS ---
  const theme = {
    bg: isDarkMode ? 'bg-[#0f0f15]' : 'bg-gray-100',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    navBg: 'bg-[#fc5b2f]', 
    
    cardBg: isDarkMode 
      ? 'bg-[#1a1a24] border-white/5' 
      : 'bg-white border-slate-100 shadow-xl',
      
    inputBg: isDarkMode 
      ? 'bg-[#0f0f15] border-white/10 text-white placeholder-gray-500 focus:ring-slate-500/50 focus:border-slate-500/50'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-gray-400 focus:ring-slate-500/50 focus:border-slate-500/50',
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg} ${theme.text}`}>
      
      {/* --- TOP NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md px-8 py-4 transition-colors duration-300 ${theme.navBg}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
          
          {/* LOGO */}
          <div className="w-40 flex-shrink-0">
          <img 
            src="/logo.jpg" 
            alt="She Can Foundation Logo" 
            className="h-12 w-auto object-contain cursor-pointer" 
            onClick={() => window.location.reload()}
          />
          </div>

          {/* BUTTONS */}
          <div className="flex items-center gap-6 ml-auto">
            <button 
              onClick={() => handleViewChange(currentView === 'home' ? 'admin' : 'home')}
              className={`relative text-sm font-semibold transition-colors duration-300 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-full after:h-[2px] after:scale-x-0 after:origin-left after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                isDarkMode 
                  ? 'text-slate-900 hover:text-white after:bg-white' 
                  : 'text-white hover:text-slate-900 after:bg-slate-900'
              }`}
            >
              {currentView === 'home' ? 'Admin Login' : 'Back to Site'}
            </button>
                          
            {/* Dark/Light Mode Toggle Switch */}
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-slate-900 hover:text-white' 
                    : 'text-white hover:text-slate-900'
                }`}
                aria-label="Toggle Theme"
              >
                {isDarkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      {currentView === 'home' ? (
      <main className="max-w-7xl mx-auto px-8 pt-28 pb-20 min-h-screen flex items-start">

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center w-full">
          
          {/* LEFT SIDE - desktop only: Contact Us + image + stats */}
          <div className={`space-y-4 md:space-y-6 order-2 md:order-1 transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            
            {/* Contact Us text - hidden on mobile */}
            <div className="hidden md:block">
              <p className="text-xl font-bold uppercase tracking-widest text-[#fc5b2f] mb-2">Contact us</p>
              <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                Have questions about our programs or want to get involved? Drop us a message and our team will get back to you shortly.
              </p>
            </div>

            {/* Image */}
            <img
              src="/hero.avif"
              alt="Community"
              className="w-full h-[45vh] object-cover rounded-2xl shadow-2xl"
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { num: '500+', label: 'Girls reached' },
                { num: '12', label: 'Active programs' },
                { num: '98%', label: 'Completion rate' },
              ].map(({ num, label }) => (
                <div key={label} className={`rounded-xl p-3 border min-w-0 ${isDarkMode ? 'bg-[#1a1a24] border-white/5' : 'bg-white border-slate-100'}`}>
                  <p className="text-lg font-bold text-[#fc5b2f] leading-tight">{num}</p>
                  <p className={`text-[11px] mt-0.5 leading-tight break-words ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: The Form */}

        <div className={`order-1 md:order-2 transition-opacity duration-1000 delay-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>

          <div className="md:hidden mb-3 order-1">
            <p className="text-xl font-bold uppercase tracking-widest text-[#fc5b2f] mb-2">Contact us</p>
            <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>
              Have questions about our programs or want to get involved? Drop us a message and our team will get back to you shortly.
            </p>
          </div>
          <div className={`p-6 md:p-8 rounded-3xl border shadow-2xl ${theme.cardBg}`}>
          <div className="border-l-4 border-[#fc5b2f] pl-3 mb-6">
              <h2 className="text-xl font-bold">Send us a message</h2>
              <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>We respond within 24 hours</p>
            </div>
            {status.type === 'success' ? (
              <div className={`p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center transition-opacity duration-500 ${status.type === 'success' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">Message Sent!</h3>
                <p className="opacity-80 mb-6">Thank you for reaching out. We'll be in touch soon.</p>
                <button 
                  onClick={() => setStatus({ loading: false, message: '', type: '' })}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white underline transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">Full Name</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#fc5b2f]/50 transition-all ${theme.inputBg}`}
                    placeholder="Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">Email Address</label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#fc5b2f]/50 transition-all ${theme.inputBg}`}
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">Your Message</label>
                  <textarea
                    rows="4"
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#fc5b2f]/50 transition-all resize-none ${theme.inputBg}`}
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>

                {/* Status Messages */}
                {status.message && status.type === 'error' && (
                  <div className="p-4 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                    {status.message}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={status.loading}
                  className="w-full py-3.5 rounded-xl bg-[#fc5b2f] hover:bg-[#db481f] text-white font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status.loading ? 'Sending Message...' : 'Send Message'}
                </button>
                <p className={`text-xs text-center mt-2 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                  We respect your privacy and never share your information.
                </p>
              </form>
            )}
          </div>
        </div>
        </div>
      </main>
      ) : (
          /* ADMIN LOGIN PAGE */
          <main className="max-w-7xl mx-auto px-8 pt-36 pb-20 min-h-screen flex items-center justify-center w-full">
            <div className={`p-8 md:p-10 rounded-3xl border border-solid transform-gpu overflow-hidden transition-all duration-500 ease-in-out w-full shadow-2xl ${isLoggedIn ? 'max-w-6xl' : 'max-w-md'} ${theme.cardBg}`}>

          {/* Show Dashboard if Logged In, otherwise show Login Form */}
          {isLoggedIn ? (
              <div className="w-full max-w-4xl mx-auto transition-all duration-500 animate-fade-in">
                <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-500/20">
                  <h2 className="text-2xl font-bold">Inbox Overview</h2>
                  <button 
                    onClick={handleAdminLogout}
                    className="px-4 py-2 rounded-lg bg-[#fc5b2f] hover:bg-[#db481f] text-white font-semibold transition-colors text-sm shadow-md active:scale-[0.98]"
                  >
                    Logout
                  </button>
                </div>

                {/* Submissions List */}
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {submissions.length === 0 ? (
                    <p className="text-center opacity-60 py-10">No messages yet.</p>
                  ) : (
                    submissions.map((sub) => (
                      <div key={sub.id} className={`p-6 rounded-2xl border transition-all hover:shadow-md ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{sub.name}</h3>
                            <a href={`mailto:${sub.email}`} className="text-sm text-[#fc5b2f] hover:underline">{sub.email}</a>
                          </div>
                          <span className="text-xs font-medium opacity-60 bg-slate-500/10 px-3 py-1 rounded-full">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="opacity-90 leading-relaxed whitespace-pre-wrap">{sub.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Admin Access</h2>
              <form onSubmit={handleAdminLogin} className="space-y-4 " noValidate>
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">Admin Email</label>
                  <input
                    type="email"
                    required
                    value={adminCreds.email}
                    onChange={(e) => setAdminCreds({...adminCreds, email: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all ${theme.inputBg}`}
                    placeholder="admin@shecan.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 opacity-80">Password</label>
                  <input
                    type="password"
                    required
                    value={adminCreds.password}
                    onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-slate-500/50 transition-all ${theme.inputBg}`}
                    placeholder="••••••••"
                  />
                </div>

                {/* Red Error Message Box */}
                {loginStatus.error && (
                  <div className="p-3 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 text-center">
                    {loginStatus.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginStatus.loading}
                  className="w-full mt-4 py-3.5 rounded-xl bg-[#fc5b2f] hover:bg-[#db481f] text-white font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loginStatus.loading ? 'Authenticating...' : 'Login'}
                </button>
              </form>
            </>
          )}

        </div>
      </main>
      )}

    </div>
  );
}