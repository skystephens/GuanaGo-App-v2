import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, User, ChevronLeft, Loader2, MessageSquare, FileText, Phone } from 'lucide-react';
import { cotizar, atender, esMensajeCotizacion, ChatMessage } from '../services/chatService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'guana';
  timestamp: Date;
  escalado?: boolean;
}

// Datos de contacto del visitante — opcionales, persisten en localStorage
interface ContactoVisitante {
  nombre?: string;
  telefono?: string;
  email?: string;
}

type Pantalla = 'bienvenida' | 'contacto_ia' | 'chat_ia' | 'representante' | 'confirmado';

const CHAT_HISTORY_KEY  = 'guanago_chat_history';
const CONTACTO_KEY      = 'guanago_contacto';
const API_URL           = import.meta.env.VITE_API_URL || '/api';

interface GuanaChatbotProps {
  onCotizar?: () => void;
}

const GuanaChatbot: React.FC<GuanaChatbotProps> = ({ onCotizar }) => {
  const [isOpen, setIsOpen]         = useState(false);
  const [pantalla, setPantalla]     = useState<Pantalla>('bienvenida');
  const [isTyping, setIsTyping]     = useState(false);
  const [inputText, setInputText]   = useState('');
  const [messages, setMessages]     = useState<Message[]>([]);
  const [enviando, setEnviando]     = useState(false);

  // Formulario "hablar con asesor"
  const [repMensaje, setRepMensaje] = useState('');
  const [repNombre, setRepNombre]   = useState('');
  const [repTel, setRepTel]         = useState('');
  const [repEmail, setRepEmail]     = useState('');

  // Datos de contacto del visitante para el chat IA
  const [contacto, setContacto]     = useState<ContactoVisitante>({});
  const [ctNombre, setCtNombre]     = useState('');
  const [ctTel, setCtTel]           = useState('');
  const [ctEmail, setCtEmail]       = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar contacto guardado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONTACTO_KEY);
      if (saved) setContacto(JSON.parse(saved));
    } catch {}
  }, []);

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

  // Guardar contacto y arrancar el chat IA
  const confirmarContactoIA = () => {
    const datos: ContactoVisitante = {
      nombre:   ctNombre.trim() || undefined,
      telefono: ctTel.trim()    || undefined,
      email:    ctEmail.trim()  || undefined,
    };
    setContacto(datos);
    try { localStorage.setItem(CONTACTO_KEY, JSON.stringify(datos)); } catch {}
    setMessages(mensajeBienvenidaIA());
    setPantalla('chat_ia');
  };

  const abrirChatIA = () => {
    // Si ya tenemos datos de contacto guardados, ir directo al chat
    const saved = localStorage.getItem(CONTACTO_KEY);
    if (saved) {
      try {
        setContacto(JSON.parse(saved));
        setMessages(mensajeBienvenidaIA());
        setPantalla('chat_ia');
        return;
      } catch {}
    }
    setPantalla('contacto_ia');
  };

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

      // Pasar datos de contacto al backend para que queden en Airtable si se escala
      const contactoExtra = {
        visitante_nombre:   contacto.nombre,
        visitante_telefono: contacto.telefono,
        visitante_email:    contacto.email,
      };

      if (esMensajeCotizacion(userMsg.text)) {
        const res = await cotizar(userMsg.text, historial);
        replyText = res.reply;
      } else {
        const res = await atender(userMsg.text, historial, undefined, contactoExtra);
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
    const contactInfo = [repNombre, repTel, repEmail].filter(Boolean).join(' | ');
    const mensajeCompleto = contactInfo
      ? `[Contacto: ${contactInfo}]\n${repMensaje}`
      : repMensaje;
    try {
      await fetch(`${API_URL}/chatbot/atencion/contacto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje:   mensajeCompleto,
          nombre:    repNombre || undefined,
          telefono:  repTel   || undefined,
          email:     repEmail  || undefined,
        }),
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

  const esBienvenida = pantalla === 'bienvenida';

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
          <div
            className="absolute bottom-0 right-0 bg-white w-[320px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-5"
            style={{ height: esBienvenida ? 'auto' : '540px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2">
                {(pantalla === 'chat_ia' || pantalla === 'representante' || pantalla === 'contacto_ia') && (
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
                     pantalla === 'contacto_ia'   ? 'Antes de empezar' :
                     'GuiaSAI'}
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
                {/* Opción Guana IA — OCULTA (decisión Sky jul-2026: sin IA por ahora, atención humana vía Chats_Atencion)
                <button
                  onClick={abrirChatIA}
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
                */}
                {onCotizar && (
                  <button
                    onClick={() => { cerrar(); onCotizar(); }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-orange-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800">Cotizar mi viaje</p>
                      <p className="text-xs text-gray-500">Arma tu cotización paso a paso con precios reales</p>
                    </div>
                  </button>
                )}
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

            {/* ══ PANTALLA: DATOS DE CONTACTO (antes del chat IA) ══ */}
            {pantalla === 'contacto_ia' && (
              <div className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Déjanos un dato de contacto para poder seguirte si necesitas ayuda.
                  <span className="text-gray-400"> (Todo es opcional)</span>
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Tu nombre</label>
                    <input
                      type="text"
                      value={ctNombre}
                      onChange={e => setCtNombre(e.target.value)}
                      placeholder="Ej: María González"
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">WhatsApp / Teléfono</label>
                    <input
                      type="tel"
                      value={ctTel}
                      onChange={e => setCtTel(e.target.value)}
                      placeholder="+57 300 000 0000"
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                    <input
                      type="email"
                      value={ctEmail}
                      onChange={e => setCtEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={confirmarContactoIA}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    <Bot size={16} />
                    Iniciar chat con Guana IA
                  </button>
                  <button
                    onClick={confirmarContactoIA}
                    className="text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
                  >
                    Continuar sin dejar datos
                  </button>
                </div>
              </div>
            )}

            {/* ══ PANTALLA: CHAT IA ══ */}
            {pantalla === 'chat_ia' && (
              <>
                {/* Contacto guardado — editable */}
                {(contacto.nombre || contacto.telefono || contacto.email) && (
                  <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
                    <Phone size={10} className="text-emerald-600 shrink-0" />
                    <span className="text-[10px] text-emerald-700 flex-1 truncate">
                      {[contacto.nombre, contacto.telefono, contacto.email].filter(Boolean).join(' · ')}
                    </span>
                    <button
                      onClick={() => {
                        setCtNombre(contacto.nombre || '');
                        setCtTel(contacto.telefono || '');
                        setCtEmail(contacto.email || '');
                        setPantalla('contacto_ia');
                      }}
                      className="text-[10px] text-emerald-600 hover:underline shrink-0"
                    >
                      Editar
                    </button>
                  </div>
                )}

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
              <form onSubmit={handleEnviarRepresentante} className="flex-1 flex flex-col p-5 gap-3 overflow-y-auto">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Déjanos tu mensaje y datos de contacto. Un asesor te responderá pronto.
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Nombre</label>
                    <input
                      type="text"
                      value={repNombre}
                      onChange={e => setRepNombre(e.target.value)}
                      placeholder="Ej: María González"
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">WhatsApp / Teléfono</label>
                    <input
                      type="tel"
                      value={repTel}
                      onChange={e => setRepTel(e.target.value)}
                      placeholder="+57 300 000 0000"
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                    <input
                      type="email"
                      value={repEmail}
                      onChange={e => setRepEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Tu mensaje *</label>
                    <textarea
                      value={repMensaje}
                      onChange={e => setRepMensaje(e.target.value)}
                      placeholder="¿En qué podemos ayudarte?"
                      rows={4}
                      required
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all resize-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!repMensaje.trim() || enviando}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors mt-auto"
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
                    Un asesor de GuiaSAI te responderá pronto. Gracias por contactarnos 🌴
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
