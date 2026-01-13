// 🔌 Ejemplos de Integración Frontend → Backend
// Archivo: services/api.ts (actualizado)

import axios from 'axios';

// Configuración base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado - redirigir a login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================

export const auth = {
  // Login
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Registro
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Obtener perfil
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Actualizar perfil
  updateProfile: async (updates: any) => {
    const response = await api.put('/auth/profile', updates);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

// ==================== SERVICES ====================

export const services = {
  // Listar servicios
  getAll: async (filters?: {
    category?: string;
    featured?: boolean;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.featured) params.append('featured', 'true');
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get(`/services?${params}`);
    return response.data;
  },

  // Obtener servicio por ID
  getById: async (id: string) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  // Verificar disponibilidad
  checkAvailability: async (serviceId: string, date: string, people: number) => {
    const response = await api.post('/services/check-availability', {
      serviceId,
      date,
      people
    });
    return response.data;
  },

  // Crear servicio (Partner/Admin)
  create: async (serviceData: any) => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },

  // Actualizar servicio (Partner/Admin)
  update: async (id: string, serviceData: any) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
  }
};

// ==================== RESERVATIONS ====================

export const reservations = {
  // Crear reserva
  create: async (reservationData: {
    serviceId: string;
    date: string;
    people: number;
    customerInfo: {
      name: string;
      email: string;
      phone: string;
    };
    paymentMethod: string;
  }) => {
    const response = await api.post('/reservations', reservationData);
    return response.data;
  },

  // Mis reservas
  getMy: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/reservations/my-reservations${params}`);
    return response.data;
  },

  // Reservas del partner
  getPartner: async (filters?: { status?: string; date?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    
    const response = await api.get(`/reservations/partner/reservations?${params}`);
    return response.data;
  },

  // Validar QR
  validate: async (reservationId: string, qrCode: string) => {
    const response = await api.post('/reservations/validate', {
      reservationId,
      qrCode
    });
    return response.data;
  },

  // Cancelar reserva
  cancel: async (id: string, reason?: string) => {
    const response = await api.post(`/reservations/${id}/cancel`, { reason });
    return response.data;
  }
};

// ==================== DIRECTORY ====================

export const directory = {
  // Listar lugares
  getAll: async (filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.featured) params.append('featured', 'true');
    
    const response = await api.get(`/directory?${params}`);
    return response.data;
  },

  // Obtener lugar por ID
  getById: async (id: string) => {
    const response = await api.get(`/directory/${id}`);
    return response.data;
  }
};

// ==================== CHATBOT ====================

export const chatbot = {
  // Enviar mensaje
  sendMessage: async (message: string, context?: string, conversationId?: string) => {
    const response = await api.post('/chatbot/message', {
      message,
      context,
      conversationId
    });
    return response.data;
  },

  // Obtener historial
  getHistory: async (conversationId: string) => {
    const response = await api.get(`/chatbot/conversation/${conversationId}`);
    return response.data;
  }
};

// ==================== TAXIS ====================

export const taxis = {
  // Obtener tarifas
  getRates: async (origin: string, destination: string, vehicleType?: string) => {
    const params = new URLSearchParams({ origin, destination });
    if (vehicleType) params.append('vehicleType', vehicleType);
    
    const response = await api.get(`/taxis/rates?${params}`);
    return response.data;
  },

  // Solicitar taxi
  request: async (requestData: {
    origin: string;
    destination: string;
    vehicleType?: string;
    pickupTime?: string;
    passengers?: number;
  }) => {
    const response = await api.post('/taxis/request', requestData);
    return response.data;
  }
};

// Exportar todo
export default {
  auth,
  services,
  reservations,
  directory,
  chatbot,
  taxis
};


// ==================== EJEMPLO DE USO EN COMPONENTES ====================

/*

// En Login.tsx
import { auth } from '@/services/api';

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const result = await auth.login(email, password);
    console.log('Login exitoso:', result.user);
    navigate('/dashboard');
  } catch (error) {
    console.error('Error:', error);
    alert('Credenciales inválidas');
  }
};


// En TourList.tsx
import { services } from '@/services/api';

useEffect(() => {
  const loadServices = async () => {
    try {
      const result = await services.getAll({ category: 'tour', featured: true });
      setTours(result.data);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };
  loadServices();
}, []);


// En Checkout.tsx
import { reservations } from '@/services/api';

const handleCheckout = async () => {
  try {
    const result = await reservations.create({
      serviceId: selectedService.id,
      date: selectedDate,
      people: numberOfPeople,
      customerInfo: {
        name: form.name,
        email: form.email,
        phone: form.phone
      },
      paymentMethod: 'card'
    });
    
    console.log('Reserva creada:', result.data);
    console.log('Transaction ID:', result.transactionId);
    navigate('/confirmation', { state: { reservation: result.data } });
  } catch (error) {
    console.error('Error:', error);
    alert('No se pudo completar la reserva');
  }
};


// En ChatWindow.tsx
import { chatbot } from '@/services/api';

const sendMessage = async () => {
  try {
    const result = await chatbot.sendMessage(userMessage, 'tourism', conversationId);
    setMessages([...messages, { 
      role: 'user', 
      content: userMessage 
    }, { 
      role: 'assistant', 
      content: result.response 
    }]);
    setConversationId(result.conversationId);
  } catch (error) {
    console.error('Error:', error);
  }
};


// En PartnerScanner.tsx
import { reservations } from '@/services/api';

const handleScan = async (qrCode: string) => {
  try {
    const result = await reservations.validate(reservationId, qrCode);
    alert('✓ Reserva validada: ' + result.data.customerName);
  } catch (error) {
    alert('✗ QR inválido o ya usado');
  }
};

*/
