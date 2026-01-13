
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Globe, Sparkles } from 'lucide-react';
import { cotizar, ChatMessage } from '../services/chatService';
import { GUANA_LOGO } from '../constants';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'guana';
  timestamp: Date;
}

const CHAT_HISTORY_KEY = 'guanago_chat_history';

const GuanaChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedLang, setSelectedLang] = useState('es');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar historial de localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{
        id: 'init-1',
        text: "¡Hola! 🌴 Soy Guana Go, tu asistente de viajes en San Andrés. Puedo ayudarte a cotizar tours, reservar hoteles y planificar tu viaje. ¿Qué te gustaría hacer?",
        sender: 'guana',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Guardar historial al cambiar
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-30))); // Últimos 30 mensajes
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Convertir mensajes al formato de historial para Groq
  const getHistorialForGroq = (): ChatMessage[] => {
    return messages.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // Usar el cotizador con Groq AI
      const historial = getHistorialForGroq();
      const response = await cotizar(userMsg.text, historial);
      const guanaMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: response.reply, 
        sender: 'guana', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, guanaMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "¡Ups! Tuve un problema procesando tu solicitud. ¿Puedes intentar de nuevo? 🌴",
        sender: 'guana',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    setMessages([{
      id: 'init-1',
      text: "¡Hola de nuevo! 🌴 ¿En qué puedo ayudarte hoy?",
      sender: 'guana',
      timestamp: new Date()
    }]);
  };

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-end px-6 max-w-md mx-auto pointer-events-none font-sans">
      <div className="relative pointer-events-auto">
        {!isOpen && (
          <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-emerald-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center relative group hover:scale-105 transition-transform">
             <img src={GUANA_LOGO} alt="Chat" className="w-10 h-10 object-contain" />
             <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
               <Sparkles size={10} className="text-white" />
             </span>
          </button>
        )}

        {isOpen && (
          <div className="absolute bottom-0 right-0 bg-white w-[320px] h-[520px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 flex justify-between items-center text-white">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                   <Sparkles size={16} />
                 </div>
                 <div>
                   <span className="font-bold text-sm">Guana Go AI</span>
                   <span className="block text-[10px] text-emerald-100">Powered by Groq</span>
                 </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-lg transition-colors"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-emerald-500 text-white rounded-br-md' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md p-3 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Quick actions */}
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
              {['Cotizar tour', 'Hoteles', 'Tarifas taxi'].map(action => (
                <button 
                  key={action}
                  onClick={() => setInputText(action)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSend} className="p-3 border-t flex gap-2 bg-white">
               <input 
                 type="text" 
                 value={inputText} 
                 onChange={e => setInputText(e.target.value)} 
                 placeholder="Ej: Cotiza tour para 4 personas..." 
                 className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all" 
                 disabled={isTyping}
               />
               <button 
                 type="submit" 
                 disabled={isTyping || !inputText.trim()}
                 className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 p-2.5 rounded-xl text-white transition-colors"
               >
                 <Send size={18}/>
               </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuanaChatbot;
