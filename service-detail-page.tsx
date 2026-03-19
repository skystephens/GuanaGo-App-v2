// src/pages/ServiceDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { airtableService } from '../services/airtableService';

interface Service {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  precio_base: number;
  imagenes: string[];
  amenidades: string[];
  ubicacion: string;
  proveedor: string;
  autenticidad_raizal: string; // NUEVO: Destacar cultura local
  experiencia_unica: string; // NUEVO: Lo que hace único este servicio
}

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadService();
  }, [slug]);

  async function loadService() {
    try {
      // Convertir slug a nombre: tour-acuario-johnny-cay → Tour Acuario Johnny Cay
      const serviceName = slug
        ?.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const data = await airtableService.searchServiceBySlug(slug);
      setService(data);
    } catch (error) {
      console.error('Error loading service:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleWhatsAppShare() {
    const message = encodeURIComponent(
      `🌴 *${service?.nombre}* - San Andrés Islas\n\n` +
      `💰 Desde $${service?.precio_base} USD\n\n` +
      `📱 Ver detalles: ${window.location.href}\n\n` +
      `✨ ${service?.experiencia_unica}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  function handleQuoteNow() {
    // Scroll to quote form o abrir modal
    const quoteSection = document.getElementById('quote-form');
    quoteSection?.scrollIntoView({ behavior: 'smooth' });
  }

  if (loading) {
    return <div className="loading-skeleton">Cargando servicio...</div>;
  }

  if (!service) {
    return (
      <div className="error-state">
        <h2>Servicio no encontrado</h2>
        <button onClick={() => navigate('/agencias')}>Ver todos los servicios</button>
      </div>
    );
  }

  return (
    <div className="service-detail-page">
      {/* HERO SECTION */}
      <section className="service-hero">
        <div className="hero-gallery">
          <img src={service.imagenes[0]} alt={service.nombre} className="hero-image" />
          <div className="hero-overlay">
            <div className="hero-badges">
              <span className="badge-raizal">🌴 Experiencia Raizal Auténtica</span>
              <span className="badge-type">{service.tipo}</span>
            </div>
          </div>
        </div>

        <div className="hero-content">
          <h1 className="service-title">{service.nombre}</h1>
          <div className="service-location">
            <span>📍</span>
            <span>{service.ubicacion}</span>
          </div>
          
          {/* AUTENTICIDAD DESTACADA */}
          <div className="authenticity-badge">
            <div className="badge-icon">✨</div>
            <div className="badge-content">
              <h3>Experiencia Auténtica</h3>
              <p>{service.autenticidad_raizal}</p>
            </div>
          </div>

          <div className="price-section">
            <span className="price-label">Precio desde</span>
            <span className="price-amount">${service.precio_base}</span>
            <span className="price-currency">USD</span>
          </div>

          <div className="cta-buttons">
            <button className="btn-primary" onClick={handleQuoteNow}>
              💼 Cotizar para Agencia
            </button>
            <button className="btn-secondary" onClick={handleWhatsAppShare}>
              📱 Compartir por WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* DESCRIPCIÓN */}
      <section className="service-description">
        <h2>Sobre esta experiencia</h2>
        <p>{service.descripcion}</p>
        
        <div className="unique-experience">
          <h3>Lo que hace única esta experiencia:</h3>
          <p>{service.experiencia_unica}</p>
        </div>
      </section>

      {/* AMENIDADES */}
      <section className="service-amenities">
        <h2>¿Qué incluye?</h2>
        <div className="amenities-grid">
          {service.amenidades.map((amenidad, index) => (
            <div key={index} className="amenity-item">
              <span className="amenity-icon">✓</span>
              <span>{amenidad}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PROVEEDOR LOCAL */}
      <section className="local-provider">
        <h2>Tu anfitrión local</h2>
        <div className="provider-card">
          <div className="provider-info">
            <h3>{service.proveedor}</h3>
            <p>Operador local certificado con más de 10 años de experiencia compartiendo la cultura raizal de San Andrés.</p>
          </div>
          <div className="provider-badge">
            <span>🏆</span>
            <span>Proveedor Verificado</span>
          </div>
        </div>
      </section>

      {/* FORMULARIO DE COTIZACIÓN */}
      <section id="quote-form" className="quote-section">
        <h2>Solicita tu cotización</h2>
        <QuoteForm serviceId={service.id} serviceName={service.nombre} />
      </section>

      {/* META TAGS PARA SEO Y WHATSAPP */}
      <MetaTags service={service} />
    </div>
  );
}

// Componente de Meta Tags para compartir en WhatsApp
function MetaTags({ service }: { service: Service }) {
  useEffect(() => {
    // Open Graph tags para WhatsApp preview
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', service.nombre);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', service.experiencia_unica);
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', service.imagenes[0]);
  }, [service]);

  return null;
}
