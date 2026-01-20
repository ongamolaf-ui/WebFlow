import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  Paperclip, 
  MessageSquare, 
  CheckCircle2, 
  ShieldCheck, 
  Rocket, 
  User, 
  X,
  PlusCircle,
  Lock,
  Unlock,
  Trophy,
  Hammer,
  ShieldAlert,
  ShieldEllipsis,
  Fingerprint,
  Wallet,
  ChevronLeft,
  Users
} from 'lucide-react';
import { Role, Message, FileAttachment } from './types';

// Der aktualisierte Passwort-Code für den Ersteller-Modus
const DEVELOPER_PASSWORD = "hakwnn72/(§(/€/„283"; 

// Hilfsfunktion zur Generierung einer persistenten Client-ID für den Besucher
const getMyClientId = () => {
  let id = localStorage.getItem('webflow_client_id');
  if (!id) {
    id = 'Kunde-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    localStorage.setItem('webflow_client_id', id);
  }
  return id;
};

const SecurityBadge = () => (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">E2EE Verschlüsselt</span>
  </div>
);

const ChatBubble = ({ message, currentRole }: { message: Message, currentRole: Role }) => {
  const isMe = message.senderId === currentRole;
  const senderLabel = message.senderId === 'developer' ? 'Ersteller' : 'Kunde';
  
  return (
    <div className={`flex flex-col mb-6 ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-3 shadow-lg ${
        isMe 
          ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-tr-none border border-indigo-500/30' 
          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
      }`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed font-semibold">{message.text}</p>
        
        {message.files && message.files.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.files.map((file, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl text-[10px] border ${
                isMe ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'
              }`}>
                <Paperclip size={12} />
                <span className="truncate max-w-[120px] font-bold">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={`flex items-center gap-2 mt-1.5 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black">
          {senderLabel} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isMe && <ShieldCheck size={8} className="text-indigo-500" />}
      </div>
    </div>
  );
};

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('client');
  const [isDevAuthenticated, setIsDevAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Globaler Speicher für alle Nachrichten (Simulation einer Datenbank)
  const [allMessages, setAllMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('webflow_pro_multi_chat_v1');
    if (saved) {
      try {
        return JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null); // Nur für Ersteller relevant
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const myClientId = getMyClientId();

  // Berechnete Liste der Chats für den Ersteller
  const chatList = useMemo(() => {
    const groups: Record<string, Message[]> = {};
    allMessages.forEach(m => {
      if (!groups[m.clientId]) groups[m.clientId] = [];
      groups[m.clientId].push(m);
    });
    return Object.entries(groups).map(([clientId, msgs]) => ({
      clientId,
      lastMessage: msgs[msgs.length - 1],
      count: msgs.length,
      unread: msgs.filter(m => m.senderId === 'client').length // Vereinfachte Logik
    })).sort((a, b) => b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime());
  }, [allMessages]);

  useEffect(() => {
    localStorage.setItem('webflow_pro_multi_chat_v1', JSON.stringify(allMessages));
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  useEffect(() => {
    if (isChatOpen && (currentRole === 'client' || selectedClientId)) {
      setTimeout(() => textAreaRef.current?.focus(), 500);
    }
  }, [isChatOpen, selectedClientId, currentRole]);

  const handleSendMessage = () => {
    const trimmedText = inputText.trim();
    if (trimmedText === '' && attachedFiles.length === 0) return;

    const targetClientId = currentRole === 'client' ? myClientId : selectedClientId;
    if (!targetClientId) return;

    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      senderId: currentRole,
      clientId: targetClientId,
      text: trimmedText,
      timestamp: new Date(),
      files: attachedFiles.map(f => ({ name: f.name, size: f.size, type: f.type, url: '#' }))
    };

    setAllMessages(prev => [...prev, newMessage]);
    setInputText('');
    setAttachedFiles([]);
    setTimeout(() => textAreaRef.current?.focus(), 10);
  };

  const currentChatMessages = useMemo(() => {
    const id = currentRole === 'client' ? myClientId : selectedClientId;
    return allMessages.filter(m => m.clientId === id);
  }, [allMessages, currentRole, selectedClientId, myClientId]);

  const handleDevLogin = () => {
    if (passwordInput === DEVELOPER_PASSWORD) {
      setIsDevAuthenticated(true);
      setCurrentRole('developer');
      setShowLoginModal(false);
      setPasswordInput('');
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-8 h-20 md:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white shadow-2xl">
              <Fingerprint size={28} />
            </div>
            <div>
              <span className="block font-poppins text-xl md:text-2xl font-black tracking-tighter leading-none">WebFlow<span className="text-indigo-600">Pro</span></span>
              <span className="text-[8px] md:text-[9px] uppercase tracking-[0.3em] font-black text-slate-400 mt-1">Sicherer Web-Bau</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-12">
            <SecurityBadge />
            <button 
              onClick={() => setIsChatOpen(true)}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl hover:bg-indigo-600 transition-all shadow-2xl font-bold text-[10px] uppercase tracking-widest"
            >
              Jetzt schreiben, was man will
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-32 md:pt-48 pb-32">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="space-y-8 md:space-y-12">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-xl">
              <ShieldCheck size={16} className="text-indigo-400" /> Profi-Webseiten Erstellung
            </div>
            <h1 className="text-5xl md:text-8xl font-poppins font-black leading-[1] text-slate-900 tracking-tighter">
              Ich erstelle Ihre <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-900 to-slate-900">Webseite für Leder & Sport.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 max-w-xl leading-relaxed font-medium">
              Sie brauchen eine professionelle Webseite? Ich baue sie für Sie. Sicher, schnell und exklusiv für Leder-Betriebe und Sportvereine.
            </p>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-full md:w-auto px-10 py-5 md:px-12 md:py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-base md:text-lg hover:bg-indigo-700 transition-all shadow-3xl flex items-center justify-center gap-4"
            >
              Jetzt schreiben, was man will <Rocket size={24} />
            </button>
          </div>
        </div>
      </main>

      {/* Admin Switcher */}
      <div className="fixed bottom-6 left-6 md:bottom-10 md:left-10 z-[60] flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-200 shadow-2xl">
          <button 
            onClick={() => { setCurrentRole('client'); setIsDevAuthenticated(false); setSelectedClientId(null); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest ${currentRole === 'client' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500'}`}
          >
            <User size={12} /> Kunde
          </button>
          <button 
            onClick={() => isDevAuthenticated ? setCurrentRole('developer') : setShowLoginModal(true)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest ${currentRole === 'developer' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500'}`}
          >
            {isDevAuthenticated ? <Unlock size={12} /> : <Lock size={12} />} Ersteller
          </button>
        </div>
      </div>

      {/* Security Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 bg-slate-900/95 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-3xl">
            <h2 className="text-2xl font-black text-center mb-2 tracking-tighter">Ersteller-Login</h2>
            <input 
              type="password"
              autoFocus
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDevLogin()}
              placeholder="Code eingeben..."
              className={`w-full px-6 py-4 rounded-2xl border-2 ${loginError ? 'border-red-500' : 'border-slate-100'} outline-none focus:border-indigo-600 transition-all mb-6 text-center text-xl font-black tracking-widest`}
            />
            <div className="flex gap-4">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px]">Abbruch</button>
              <button onClick={handleDevLogin} className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-[10px] rounded-xl shadow-xl">Login</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Portal */}
      {isChatOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-8 md:right-8 md:w-[450px] md:h-[700px] bg-white md:rounded-[3rem] shadow-3xl flex flex-col z-[70] overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              {currentRole === 'developer' && selectedClientId && (
                <button onClick={() => setSelectedClientId(null)} className="p-2 hover:bg-white/10 rounded-lg mr-2">
                  <ChevronLeft size={24} />
                </button>
              )}
              <div>
                <h3 className="font-black text-xl tracking-tight">
                  {currentRole === 'developer' 
                    ? (selectedClientId ? `Chat: ${selectedClientId}` : 'Kunden-Anfragen')
                    : 'Webseiten-Chat'}
                </h3>
                <div className="flex items-center gap-2 text-[8px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Live
                </div>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl"><X size={24} /></button>
          </div>

          <div className="flex-grow overflow-y-auto p-8 bg-slate-50/40">
            {currentRole === 'developer' && !selectedClientId ? (
              /* LISTE DER CHATS FÜR ERSTELLER */
              <div className="space-y-4">
                {chatList.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-medium italic">Noch keine Anfragen vorhanden.</div>
                ) : (
                  chatList.map(chat => (
                    <button 
                      key={chat.clientId} 
                      onClick={() => setSelectedClientId(chat.clientId)}
                      className="w-full bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left flex items-center gap-5 group"
                    >
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <User size={24} />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-black text-slate-900 tracking-tight">{chat.clientId}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate font-semibold">{chat.lastMessage.text || 'Datei gesendet'}</p>
                      </div>
                      <div className="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black">
                        {chat.count}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* INDIVIDUELLER CHAT-VERLAUF */
              <>
                {currentChatMessages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} currentRole={currentRole} />
                ))}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {(currentRole === 'client' || selectedClientId) && (
            <div className="bg-white p-6 border-t border-slate-100">
              {attachedFiles.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {attachedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-[9px] font-bold">
                      <Paperclip size={12} /> <span className="max-w-[120px] truncate">{file.name}</span>
                      <button onClick={() => setAttachedFiles(f => f.filter((_, idx) => idx !== i))}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="p-3.5 text-slate-300 hover:text-indigo-600"><PlusCircle size={24} /></button>
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={(e) => e.target.files && setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)])} />
                <div className="flex-grow">
                  <textarea 
                    ref={textAreaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder="Nachricht schreiben..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all resize-none font-semibold"
                  />
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={inputText.trim() === '' && attachedFiles.length === 0}
                  className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-20 transition-all"
                >
                  <Send size={22} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Chat Button mit Badge für Ersteller */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-16 h-16 md:w-20 md:h-20 bg-slate-900 text-white rounded-3xl shadow-3xl flex items-center justify-center hover:scale-105 hover:bg-indigo-600 transition-all z-50 border-4 border-white/10"
        >
          {currentRole === 'developer' ? <Users size={28} /> : <MessageSquare size={28} />}
          
          {currentRole === 'developer' && chatList.length > 0 && (
            <div className="absolute -top-2 -right-2 min-w-[28px] h-7 bg-red-600 text-[10px] font-black flex items-center justify-center rounded-xl border-2 border-white shadow-2xl px-1.5 animate-bounce">
              {chatList.length}
            </div>
          )}
          {currentRole === 'client' && currentChatMessages.length > 0 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 rounded-full border-2 border-white animate-pulse"></div>
          )}
        </button>
      )}
    </div>
  );
}