import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, User, ChevronLeft, Loader2, MessageSquare } from 'lucide-react';
import { cotizar, atender, esMensajeCotizacion, ChatMessage } from '../services/chatService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'guana';
  timestamp: Date;
  escalado?: boolean;
}

type Pantalla = 'bienvenida' | 'chat_ia' | 'representante' | 'confirmado';

const CHAT_HISTORY_KEY = 'guanago_chat_history';
const API_URL = import.meta.env.VITE_API_URL || '/api';

const GuanaChatbot: React.FC = () => {
  const [isOpen, setIsOpen]         = useState(false);
  const [pantalla, setPantalla]     = useState<Pantalla>('bienvenida');
  const [isTyping, setIsTyping]     = useState(false);
  const [inputText, setInputText]   = useState('');
  const [messages, setMessages]     = useState<Message[]>([]);
  const [repMensaje, setRepMensaje] = useState('');
  const [repNombre, setRepNombre]   = useState('');
  const [enviando, setEnviando]     = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restaurar historial del chat IA al abrir
  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      try { setMessages(JSON.parse(saved)); return; } catch {}
    }
    setMessages(mensajeBienvenidaIA());
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-30)));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function mensajeBienvenidaIA(): Message[] {
    return [{
      id: 'init-1',
      text: '¡Hola! 🌴 Soy Guana Go, tu asistente en San Andrés. Puedo cotizar tours, responder preguntas sobre el destino y más. ¿En qué te ayudo?',
      sender: 'guana',
      timestamp: new Date(),
    }];
  }

  const getHistorial = (): ChatMessage[] =>
    messages.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    }));

  const handleSendIA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const historial = getHistorial();
      let replyText = '';
      let escalado = false;

      if (esMensajeCotizacion(userMsg.text)) {
        const res = await cotizar(userMsg.text, historial);
        replyText = res.reply;
      } else {
        const res = await atender(userMsg.text, historial);
        replyText = res.reply;
        escalado  = res.escalado;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'guana',
        timestamp: new Date(),
        escalado,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: '¡Ups! Tuve un problema. ¿Puedes intentar de nuevo? 🌴',
        sender: 'guana',
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEnviarRepresentante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repMensaje.trim() || enviando) return;
    setEnviando(true);
    try {
      await fetch(`${API_URL}/chatbot/atencion/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: repMensaje, nombre: repNombre || undefined }),
      });
    } catch { /* igual mostramos confirmación */ }
    setEnviando(false);
    setPantalla('confirmado');
  };

  const cerrar = () => {
    setIsOpen(false);
    setPantalla('bienvenida');
  };

  const volver = () => setPantalla('bienvenida');

  return (
    <div className="fixed bottom-40 right-4 md:right-8 lg:right-12 z-50 pointer-events-none font-sans">
      <div className="relative pointer-events-auto">

        {/* ── Botón flotante ── */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 rounded-full shadow-lg px-5 py-3 text-white font-bold text-sm relative hover:scale-105 transition-all"
          >
            <MessageSquare size={16} />
            Chat
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
              <Sparkles size={8} className="text-white" />
            </span>
          </button>
        )}

        {/* ── Panel del chat ── */}
        {isOpen && (
          <div className="absolute bottom-0 right-0 bg-white w-[320px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5"
            style={{ height: pantalla === 'bienvenida' ? 'auto' : '520px' }}>

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2">
                {(pantalla === 'chat_ia' || pantalla === 'representante') && (
                  <button onClick={volver} className="hover:bg-white/20 p-1 rounded-lg transition-colors mr-1">
                    <ChevronLeft size={16} />
                  </button>
                )}
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <div>
                  <span className="font-bold text-sm">
                    {pantalla === 'representante' ? 'Hablar con un asesor' :
                     pantalla === 'confirmado'    ? 'Mensaje enviado' :
                     pantalla === 'chat_ia'       ? 'Guana IA' :
                     'GuanaGO'}
                  </span>
                  <span className="block text-[10px] text-emerald-100">
                    {pantalla === 'chat_ia' ? 'Responde al instante · Groq AI' : 'San Andrés Isla, Colombia'}
                  </span>
                </div>
              </div>
              <button onClick={cerrar} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* ══ PANTALLA: BIENVENIDA ══ */}
            {pantalla === 'bienvenida' && (
              <div className="p-5 space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  ¡Hola! 👋 ¿Cómo te podemos ayudar hoy?
                </p>
                <button
                  onClick={() => { setMessages(mensajeBienvenidaIA()); setPantalla('chat_ia'); }}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <Bot size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">Guana IA</p>
                    <p className="text-xs text-gray-500">Responde al instante sobre tours, precios y destino</p>
                  </div>
                </button>
                <button
                  onClick={() => setPantalla('representante')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-800">Hablar con un asesor</p>
                    <p className="text-xs text-gray-500">Un representante del equipo te responderá pronto</p>
                  </div>
                </button>
              </div>
            )}

            {/* ══ PANTALLA: CHAT IA ══ */}
            {pantalla === 'chat_ia' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-500 text-white rounded-br-md'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                      }`}>
                        {msg.text}
                        {msg.escalado && (
                          <p className="mt-1.5 text-[10px] text-orange-400 font-medium">📋 Caso registrado para el equipo</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md p-3 shadow-sm">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                  {['Cotizar tour', '¿Cómo llego?', '¿Qué hacer?'].map(action => (
                    <button
                      key={action}
                      onClick={() => setInputText(action)}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors whitespace-nowrap"
                    >
                      {action}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendIA} className="p-3 border-t flex gap-2 bg-white shrink-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Pregunta o cotiza aquí..."
                    className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    disabled={isTyping}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !inputText.trim()}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 p-2.5 rounded-xl text-white transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}

            {/* ══ PANTALLA: REPRESENTANTE ══ */}
            {pantalla === 'representante' && (
              <form onSubmit={handleEnviarRepresentante} className="flex-1 flex flex-col p-5 gap-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Déjanos tu mensaje y un asesor de GuanaGO te responderá lo antes posible.
                </p>
                <div className="space-y-3 flex-1">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Tu nombre (opcional)</label>
                    <input
                      type="text"
                      value={repNombre}
                      onChange={e => setRepNombre(e.target.value)}
                      placeholder="Ej: María González"
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Tu mensaje *</label>
                    <textarea
                      value={repMensaje}
                      onChange={e => setRepMensaje(e.target.value)}
                      placeholder="¿En qué podemos ayudarte?"
                      rows={5}
                      required
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!repMensaje.trim() || enviando}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {enviando ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </form>
            )}

            {/* ══ PANTALLA: CONFIRMADO ══ */}
            {pantalla === 'confirmado' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✓</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-base">¡Mensaje enviado!</p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Un asesor de GuanaGO te responderá pronto. Gracias por contactarnos 🌴
                  </p>
                </div>
                <button
                  onClick={cerrar}
                  className="mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Cerrar
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default GuanaChatbot;
