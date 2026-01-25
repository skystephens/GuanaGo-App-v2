import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Interfaces para el servicio
export interface PartnerStats {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueChange: number;
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  totalSales: number;
  monthlySales: number;
  salesChange: number;
  pendingPayouts: number;
  nextPayoutDate: string;
  avgRating: number;
  totalReviews: number;
}

export interface RecentSale {
  id: string;
  productName: string;
  customerName: string;
  amount: number;
  commission: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  bookingDate: string;
}

export interface ProductPerformance {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  views: number;
  conversionRate: number;
  status: 'active' | 'paused' | 'pending';
}

export interface Partner {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  category: 'Alojamiento' | 'Restaurante' | 'Tour' | 'Transporte' | 'Artesanías' | 'Servicios';
  commission: number;
  status: 'active' | 'pending' | 'suspended';
  rating: number;
  totalSales: number;
  createdAt: string;
  location?: {
    address: string;
    city: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface PartnerProduct {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: 'COP' | 'USD';
  images: string[];
  status: 'active' | 'paused' | 'pending' | 'rejected';
  isVisible: boolean;
  stock?: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  category: string;
  price: number;
  currency: 'COP' | 'USD';
  images: string[];
  duration?: string;
  capacity?: number;
  amenities?: string[];
  location?: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
}

class PartnerService {
  private getAuthHeaders() {
    const token = localStorage.getItem('partner_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // Autenticación
  async login(email: string, password: string): Promise<{ token: string; partner: Partner }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/partners/login`, {
        email,
        password,
      });
      
      // Guardar token
      localStorage.setItem('partner_token', response.data.token);
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  }

  async register(data: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    password: string;
    category: string;
    description?: string;
  }): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/partners/register`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al registrarse');
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('partner_token');
  }

  // Dashboard Stats
  async getDashboardStats(partnerId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<PartnerStats> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/dashboard/stats`,
        {
          ...this.getAuthHeaders(),
          params: { period },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar estadísticas');
    }
  }

  async getRecentSales(partnerId: string, limit: number = 10): Promise<RecentSale[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/sales/recent`,
        {
          ...this.getAuthHeaders(),
          params: { limit },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar ventas');
    }
  }

  async getTopProducts(partnerId: string, limit: number = 5): Promise<ProductPerformance[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/products/top`,
        {
          ...this.getAuthHeaders(),
          params: { limit },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar productos');
    }
  }

  // Products Management
  async getProducts(partnerId: string, filters?: {
    status?: string;
    category?: string;
    search?: string;
  }): Promise<PartnerProduct[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/products`,
        {
          ...this.getAuthHeaders(),
          params: filters,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar productos');
    }
  }

  async getProduct(partnerId: string, productId: string): Promise<PartnerProduct> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/products/${productId}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar producto');
    }
  }

  async createProduct(partnerId: string, data: CreateProductData): Promise<PartnerProduct> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/partners/${partnerId}/products`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear producto');
    }
  }

  async updateProduct(
    partnerId: string,
    productId: string,
    data: Partial<CreateProductData>
  ): Promise<PartnerProduct> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/partners/${partnerId}/products/${productId}`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar producto');
    }
  }

  async deleteProduct(partnerId: string, productId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/partners/${partnerId}/products/${productId}`,
        this.getAuthHeaders()
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar producto');
    }
  }

  async toggleProductStatus(partnerId: string, productId: string): Promise<PartnerProduct> {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/partners/${partnerId}/products/${productId}/toggle`,
        {},
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cambiar estado del producto');
    }
  }

  // Sales & Payments
  async getSales(partnerId: string, filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Promise<RecentSale[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/sales`,
        {
          ...this.getAuthHeaders(),
          params: filters,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar ventas');
    }
  }

  async getPayouts(partnerId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/payouts`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar pagos');
    }
  }

  async requestPayout(partnerId: string, amount: number): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/partners/${partnerId}/payouts/request`,
        { amount },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al solicitar pago');
    }
  }

  // Profile
  async getProfile(partnerId: string): Promise<Partner> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar perfil');
    }
  }

  async updateProfile(partnerId: string, data: Partial<Partner>): Promise<Partner> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/partners/${partnerId}`,
        data,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar perfil');
    }
  }

  // Image Upload
  async uploadImage(file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${API_BASE_URL}/partners/upload`,
        formData,
        {
          headers: {
            ...this.getAuthHeaders().headers,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al subir imagen');
    }
  }

  // Analytics
  async getAnalytics(partnerId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/analytics`,
        {
          ...this.getAuthHeaders(),
          params: { period },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar analíticas');
    }
  }

  // Reviews
  async getReviews(partnerId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/partners/${partnerId}/reviews`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al cargar reseñas');
    }
  }

  async respondToReview(partnerId: string, reviewId: string, response: string): Promise<any> {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/partners/${partnerId}/reviews/${reviewId}/respond`,
        { response },
        this.getAuthHeaders()
      );
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al responder reseña');
    }
  }
}

export const partnerService = new PartnerService();
export default partnerService;
