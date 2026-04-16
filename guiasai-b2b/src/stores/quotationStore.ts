import { create } from 'zustand'
import { calculateTourPrice } from '../services/airtableService'

interface QuotationState {
  mockQuotation: any
  setMockQuotation: (quotation: any) => void
  addTour: (tour: any, date: string, people: number, selectedSchedule?: string) => boolean
  clearQuotation: () => void
  
  // 🆕 Auth State
  isAuthenticated: boolean
  agencyInfo: { name: string; email: string } | null
  isSuperAdmin: boolean
  login: (info: { name: string; email: string }, isAdmin?: boolean) => void
  logout: () => void
}

export const useQuotationStore = create<QuotationState>((set, get) => ({
  mockQuotation: {
    id: `QT-${Date.now()}`,
    accommodations: [],
    tours: [],
    transports: [],
    total: 0,
    currency: 'COP',
    status: 'draft',
  },
  
  // 🆕 Auth State Initial Values
  isAuthenticated: false,
  agencyInfo: null,
  isSuperAdmin: false,

  setMockQuotation: (quotation: any) => {
    set({ mockQuotation: quotation })
  },

  addTour: (tour: any, date: string, people: number, selectedSchedule?: string) => {
    if (!date) {
      alert('Por favor selecciona una fecha para el tour')
      return false
    }

    if (people <= 0) {
      alert('Por favor indica el número de personas')
      return false
    }

    if (tour.horarios && tour.horarios.length > 0 && !selectedSchedule) {
      alert('⚠️ Por favor selecciona un horario disponible para este tour')
      return false
    }

    const total = calculateTourPrice(tour, people)
    const pricePerPerson = tour.precioPerPerson || 0

    const newTour = {
      id: Date.now().toString(),
      tourId: tour.id,
      tourName: tour.nombre,
      description: tour.descripcion,
      date: new Date(date),
      duration: tour.duracion || 'N/D',
      quantity: people,
      pricePerPerson,
      total,
      partnerConfirmed: false,
      included: tour.incluye || [],
      schedule: selectedSchedule || '',
      diasOperacion: tour.diasOperacion || '',
    }

    const state = get()
    set({
      mockQuotation: {
        ...state.mockQuotation,
        tours: [...state.mockQuotation.tours, newTour],
        total: state.mockQuotation.total + total,
      },
    })

    alert(`✓ ${tour.nombre} agregado a la cotización${selectedSchedule ? ` (${selectedSchedule})` : ''}`)
    return true
  },

  clearQuotation: () => {
    const state = get()
    set({
      mockQuotation: {
        ...state.mockQuotation,
        accommodations: [],
        tours: [],
        transports: [],
        total: 0,
      },
    })
  },

  // 🆕 Auth Actions
  login: (info, isAdmin = false) => {
    set({ isAuthenticated: true, agencyInfo: info, isSuperAdmin: isAdmin })
  },
  logout: () => {
    set({ isAuthenticated: false, agencyInfo: null, isSuperAdmin: false })
  }
}))
