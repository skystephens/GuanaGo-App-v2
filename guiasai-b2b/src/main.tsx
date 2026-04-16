import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import { ServiceDetail } from './pages/services/ServiceDetail.tsx'
import { AgencyPanel } from './pages/AgencyPanel.tsx'
import { SuperAdminPanel } from './pages/SuperAdminPanel.tsx'
import { VouchersListPage } from './pages/VouchersListPage.tsx'
import { VoucherDetailPage } from './pages/VoucherDetailPage.tsx'
import PropuestaAlojamientosPage from './pages/PropuestaAlojamientosPage.tsx'
import './styles/guiasai-theme.css'

const HelmetWrapper = HelmetProvider as any

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetWrapper>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/panel" element={<AgencyPanel />} />
          <Route path="/admin" element={<SuperAdminPanel />} />
          <Route path="/servicio/:slug" element={<ServiceDetail />} />
          {/* Vouchers — lista (protegida) + detalle (público) */}
          <Route path="/vouchers" element={<VouchersListPage />} />
          <Route path="/vouchers/:id" element={<VoucherDetailPage />} />
          {/* Propuesta de alojamientos — pública, para compartir con clientes */}
          <Route path="/propuesta" element={<PropuestaAlojamientosPage />} />
        </Routes>
      </BrowserRouter>
    </HelmetWrapper>
  </React.StrictMode>,
)
