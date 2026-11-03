import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Briefcase,
  Code2,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Play,
  UserCheck,
  Smartphone,
  Moon,
  Sun,
  RotateCcw,
  ChevronRight,
  SlidersHorizontal,
  Package,
  DollarSign,
  Phone,
  Mail,
  Sparkles,
} from 'lucide-react';
import {
  Appointment,
  AppointmentStatus,
  ClientProfile,
  ProductItem,
  ServiceItem,
  StaffMember,
} from './types';
import {
  INITIAL_STAFF,
  INITIAL_SERVICES,
  INITIAL_PRODUCTS,
  INITIAL_CLIENTS,
  buildInitialAppointments,
  getTodayStr,
  addDaysStr,
} from './data/mockData';
import { BookingModal } from './components/BookingModal';
import { AppointmentPassModal } from './components/AppointmentPassModal';
import { AndroidCodeDrawer } from './components/AndroidCodeDrawer';

type NavTab = 'schedule' | 'bookings' | 'services' | 'clients' | 'android-code';

const STORAGE_KEYS = {
  APPOINTMENTS: 'kioskflow_appointments_v2',
  SERVICES: 'kioskflow_services_v2',
  STAFF: 'kioskflow_staff_v2',
  CLIENTS: 'kioskflow_clients_v2',
  PRODUCTS: 'kioskflow_products_v2',
  THEME: 'kioskflow_theme_v2',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatReadableDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAY_NAMES[dt.getDay()]}, ${MONTH_NAMES[dt.getMonth()]} ${d}, ${y}`;
};

export default function App() {
  // Persistent State Initialization
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return buildInitialAppointments();
      }
    }
    return buildInitialAppointments();
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [clients, setClients] = useState<ClientProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) === 'dark';
  });

  // UI Navigation & Filters
  const [activeTab, setActiveTab] = useState<NavTab>('schedule');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileFramePreview, setMobileFramePreview] = useState<boolean>(false);

  // Modals State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [prefillSlot, setPrefillSlot] = useState<{ startTime?: string; staffId?: string; serviceId?: string }>({});
  const [activePassAppointmentId, setActivePassAppointmentId] = useState<string | null>(null);

  // New Service Form State (for Services Tab)
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvCategory, setNewSrvCategory] = useState<ServiceItem['category']>('Consultation');
  const [newSrvDuration, setNewSrvDuration] = useState(45);
  const [newSrvPrice, setNewSrvPrice] = useState(85);
  const [newSrvDesc, setNewSrvDesc] = useState('');

  // New Client Form State (for Clients Tab)
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newCliName, setNewCliName] = useState('');
  const [newCliPhone, setNewCliPhone] = useState('');
  const [newCliEmail, setNewCliEmail] = useState('');
  const [newCliNotes, setNewCliNotes] = useState('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [darkMode]);

  // 7-Day Horizontal Scroller Dates around Today
  const weekDates = useMemo(() => {
    const today = getTodayStr();
    return [-1, 0, 1, 2, 3, 4, 5].map((offset) => {
      const dateStr = addDaysStr(today, offset);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return {
        dateStr,
        dayName: DAY_NAMES[dt.getDay()],
        dayNumber: d,
        isToday: offset === 0,
      };
    });
  }, []);

  // Filtered Appointments for Selected Date
  const dayAppointments = useMemo(() => {
    return appointments
      .filter((apt) => apt.date === selectedDate)
      .filter((apt) => (selectedStaffFilter === 'all' ? true : apt.staffId === selectedStaffFilter))
      .filter((apt) => (statusFilter === 'all' ? true : apt.status === statusFilter))
      .filter((apt) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          apt.clientName.toLowerCase().includes(q) ||
          apt.referenceCode.toLowerCase().includes(q) ||
          apt.clientPhone.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate, selectedStaffFilter, statusFilter, searchQuery]);

  // Daily KPIs
  const dailyMetrics = useMemo(() => {
    const allForDate = appointments.filter((a) => a.date === selectedDate && a.status !== 'cancelled');
    const completedList = allForDate.filter((a) => a.status === 'completed');
    const checkedInCount = allForDate.filter(
      (a) => a.status === 'checked-in' || a.status === 'in-progress'
    ).length;

    const realizedRevenue = completedList.reduce((acc, a) => {
      const addons = (a.addonProducts || []).reduce((s, p) => s + p.price * p.qty, 0);
      return acc + a.price + addons;
    }, 0);

    const projectedRevenue = allForDate.reduce((acc, a) => {
      const addons = (a.addonProducts || []).reduce((s, p) => s + p.price * p.qty, 0);
      return acc + a.price + addons;
    }, 0);

    return {
      totalBookings: allForDate.length,
      completedCount: completedList.length,
      checkedInCount,
      realizedRevenue,
      projectedRevenue,
    };
  }, [appointments, selectedDate]);

  // Handlers
  const handleSaveBooking = (data: {
    clientId: string;
    clientName: string;
    clientPhone: string;
    staffId: string;
    serviceId: string;
    date: string;
    startTime: string;
    endTime: string;
    notes: string;
    price: number;
    depositPaid: boolean;
  }) => {
    const refCode = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      referenceCode: refCode,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      staffId: data.staffId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'confirmed',
      notes: data.notes,
      price: data.price,
      depositPaid: data.depositPaid,
      paymentMethod: 'Unpaid',
      addonProducts: [],
      createdAt: getTodayStr(),
    };

    setAppointments((prev) => [...prev, newApt]);
    setSelectedDate(data.date);

    // Ensure client exists in directory
    const exists = clients.some((c) => c.id === data.clientId);
    if (!exists) {
      const newClient: ClientProfile = {
        id: data.clientId,
        name: data.clientName,
        phone: data.clientPhone,
        email: '',
        notes: data.notes || 'Created during walk-in appointment booking.',
        totalVisits: 1,
        noShowCount: 0,
        totalSpent: data.price,
        lastVisitDate: data.date,
        preferredStaffId: data.staffId,
      };
      setClients((prev) => [newClient, ...prev]);
    }
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    newStatus: AppointmentStatus,
    paymentMethod?: Appointment['paymentMethod']
  ) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== id) return apt;
        return {
          ...apt,
          status: newStatus,
          paymentMethod: paymentMethod || apt.paymentMethod,
        };
      })
    );
  };

  const handleAddProductToAppointment = (appointmentId: string, product: ProductItem) => {
    if (product.stock <= 0) return;

    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== appointmentId) return apt;
        const existingAddons = apt.addonProducts || [];
        const foundIdx = existingAddons.findIndex((p) => p.productId === product.id);
        let updatedAddons;
        if (foundIdx >= 0) {
          updatedAddons = existingAddons.map((item, idx) =>
            idx === foundIdx ? { ...item, qty: item.qty + 1 } : item
          );
        } else {
          updatedAddons = [
            ...existingAddons,
            { productId: product.id, name: product.name, price: product.price, qty: 1 },
          ];
        }
        return { ...apt, addonProducts: updatedAddons };
      })
    );

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: Math.max(0, p.stock - 1) } : p))
    );
  };

  const handleRemoveProductFromAppointment = (appointmentId: string, productId: string) => {
    const targetApt = appointments.find((a) => a.id === appointmentId);
    const removedItem = targetApt?.addonProducts?.find((p) => p.productId === productId);
    if (!removedItem) return;

    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id !== appointmentId) return apt;
        return {
          ...apt,
          addonProducts: (apt.addonProducts || []).filter((p) => p.productId !== productId),
        };
      })
    );

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + removedItem.qty } : p))
    );
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) return;
    const item: ServiceItem = {
      id: `srv-${Date.now()}`,
      name: newSrvName.trim(),
      category: newSrvCategory,
      durationMinutes: Number(newSrvDuration) || 30,
      price: Number(newSrvPrice) || 50,
      depositRequired: Math.round((Number(newSrvPrice) || 50) * 0.25),
      bufferMinutes: 10,
      description: newSrvDesc.trim() || 'Standard appointment service.',
    };
    setServices((prev) => [item, ...prev]);
    setNewSrvName('');
    setNewSrvDesc('');
    setShowNewServiceForm(false);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCliName.trim() || !newCliPhone.trim()) return;
    const client: ClientProfile = {
      id: `cli-${Date.now()}`,
      name: newCliName.trim(),
      phone: newCliPhone.trim(),
      email: newCliEmail.trim() || 'client@example.com',
      notes: newCliNotes.trim() || 'No special notes.',
      totalVisits: 0,
      noShowCount: 0,
      totalSpent: 0,
      lastVisitDate: 'Never',
      preferredStaffId: staff[0]?.id,
    };
    setClients((prev) => [client, ...prev]);
    setNewCliName('');
    setNewCliPhone('');
    setNewCliEmail('');
    setNewCliNotes('');
    setShowNewClientForm(false);
  };

  const handleResetDemoData = () => {
    setAppointments(buildInitialAppointments());
    setServices(INITIAL_SERVICES);
    setStaff(INITIAL_STAFF);
    setClients(INITIAL_CLIENTS);
    setProducts(INITIAL_PRODUCTS);
    setSelectedDate(getTodayStr());
  };

  const activePassAppointment = useMemo(
    () => appointments.find((a) => a.id === activePassAppointmentId) || null,
    [appointments, activePassAppointmentId]
  );

  const openQuickBooking = (opts?: { startTime?: string; staffId?: string; serviceId?: string }) => {
    setPrefillSlot(opts || {});
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#schedule"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('schedule');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Appointment Booking System
        </a>

        {/* Zone 2: 5 single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'schedule'
                ? 'text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'bookings'
                ? 'text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Waitlist & Queue
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'services'
                ? 'text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Services & Stock
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'clients'
                ? 'text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('android-code')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === 'android-code'
                ? 'text-teal-600 dark:text-teal-400 font-semibold underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Android Kotlin
          </button>
        </nav>

        {/* Zone 3: 1 Primary CTA button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => openQuickBooking()}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </header>

      {/* Sub-Header Workspace Controls & Android Frame Switcher */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {formatReadableDate(selectedDate)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{dailyMetrics.totalBookings} Active Slots</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-teal-600 dark:text-teal-400 font-semibold">
              ${dailyMetrics.realizedRevenue} Collected (${dailyMetrics.projectedRevenue} Est.)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Android Phone Frame Toggle */}
            <button
              type="button"
              onClick={() => setMobileFramePreview((prev) => !prev)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                mobileFramePreview
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{mobileFramePreview ? 'Exit Android Device Frame' : 'Android Phone Preview (412px)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
              title="Toggle Light / Dark Theme"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleResetDemoData}
              className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              title="Reset sample appointments"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport (Adapts to Full 1440px Desktop or 412px Android Device Preview) */}
      <main
        className={`flex-1 w-full mx-auto transition-all pb-24 md:pb-12 ${
          mobileFramePreview
            ? 'max-w-[420px] my-6 border-[6px] border-slate-900 dark:border-slate-700 rounded-[40px] shadow-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden px-4 py-5'
            : 'max-w-7xl px-4 sm:px-6 py-6'
        }`}
      >
        {/* 7-Day Horizontal Date Scroller (Shown on Schedule & Queue tabs) */}
        {(activeTab === 'schedule' || activeTab === 'bookings') && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2">
                {weekDates.map((d) => {
                  const isSelected = d.dateStr === selectedDate;
                  const countForDay = appointments.filter(
                    (a) => a.date === d.dateStr && a.status !== 'cancelled'
                  ).length;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`min-h-[56px] min-w-[68px] px-3 py-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-teal-600 text-white border-slate-900 dark:border-teal-600 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-medium opacity-80">
                        {d.isToday ? 'Today' : d.dayName}
                      </span>
                      <span className="text-base font-bold font-mono tabular-nums mt-0.5">
                        {d.dayNumber}
                      </span>
                      <span className="text-[10px] font-mono opacity-75 mt-0.5">
                        {countForDay} slots
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* KPI Strip */}
            <div
              className={`grid gap-3 ${
                mobileFramePreview ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'
              }`}
            >
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Scheduled Slots</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {dailyMetrics.totalBookings}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {staff.length} specialists active
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Checked-In / In Chair</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 mt-1">
                  {dailyMetrics.checkedInCount}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Active in clinic now
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Completed Today</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  {dailyMetrics.completedCount}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Settled via POS checkout
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Projected Day Revenue</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                  ${dailyMetrics.projectedRevenue}
                </div>
                <div className="text-xs text-teal-600 dark:text-teal-400 font-mono mt-1">
                  ${dailyMetrics.realizedRevenue} settled
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: SCHEDULE & DISPATCH BOARD */}
        {activeTab === 'schedule' && (
          <div className="space-y-5">
            {/* Filter Controls Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              {/* Staff Segmented Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedStaffFilter('all')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    selectedStaffFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-teal-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  All Specialists ({staff.length})
                </button>
                {staff.map((stf) => (
                  <button
                    key={stf.id}
                    type="button"
                    onClick={() => setSelectedStaffFilter(stf.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedStaffFilter === stf.id
                        ? 'bg-slate-900 text-white dark:bg-teal-600'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {stf.name}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search client name, phone, or BK-code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[40px] pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Responsive 2-Column Split on Desktop (Left: Appointment Timeline, Right: Staff Availability Matrix) */}
            <div
              className={`grid gap-6 items-start ${
                mobileFramePreview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
              }`}
            >
              {/* Left 8 Cols: Interactive Appointment Timeline */}
              <div className={mobileFramePreview ? 'col-span-1 space-y-3' : 'lg:col-span-8 space-y-3'}>
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Appointment Timeline ({dayAppointments.length})
                  </h2>
                  <div className="flex items-center gap-2 text-xs">
                    {(['all', 'confirmed', 'checked-in', 'in-progress', 'completed'] as const).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`px-2 py-1 rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                            statusFilter === st
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {dayAppointments.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                    <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      No Appointments Found for This Filter
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Tap the button below to schedule a walk-in or pre-booked client for {selectedDate}.
                    </p>
                    <button
                      type="button"
                      onClick={() => openQuickBooking()}
                      className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Book First Slot</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayAppointments.map((apt) => {
                      const stf = staff.find((s) => s.id === apt.staffId);
                      const srv = services.find((s) => s.id === apt.serviceId);
                      const addonsCount = (apt.addonProducts || []).reduce((s, p) => s + p.qty, 0);
                      const totalAmount =
                        apt.price +
                        (apt.addonProducts || []).reduce((s, p) => s + p.price * p.qty, 0);

                      return (
                        <div
                          key={apt.id}
                          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                        >
                          {/* Top Row: Time, Reference, Price */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                              <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">
                                {apt.startTime} – {apt.endTime}
                              </span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                                ·
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">
                                {apt.referenceCode}
                              </span>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                                ·
                              </span>
                              <span
                                className={`font-semibold capitalize ${
                                  apt.status === 'completed'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : apt.status === 'in-progress' || apt.status === 'checked-in'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : apt.status === 'cancelled'
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {apt.status}
                              </span>
                            </div>

                            <div className="font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                              ${totalAmount.toFixed(2)}
                              {apt.depositPaid && (
                                <span className="text-xs font-normal text-teal-600 dark:text-teal-400 ml-1.5">
                                  (Deposit Paid)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle Row: Client & Service Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="text-base font-bold text-slate-900 dark:text-white">
                                {apt.clientName}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                <span>{srv?.name || 'Appointment Service'}</span>
                                <span aria-hidden="true"> · </span>
                                <span>{stf?.name || 'Specialist'}</span>
                                <span aria-hidden="true"> · </span>
                                <span className="font-mono">{apt.clientPhone}</span>
                              </div>
                            </div>

                            {addonsCount > 0 && (
                              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                +{addonsCount} retail aftercare item(s)
                              </div>
                            )}
                          </div>

                          {apt.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl">
                              Note: {apt.notes}
                            </p>
                          )}

                          {/* Bottom Row: Ergonomic 44px Android Touch Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {apt.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAppointmentStatus(apt.id, 'checked-in')}
                                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Check In Client</span>
                                </button>
                              )}

                              {apt.status === 'checked-in' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAppointmentStatus(apt.id, 'in-progress')}
                                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Start Session</span>
                                </button>
                              )}

                              {(apt.status === 'checked-in' || apt.status === 'in-progress' || apt.status === 'confirmed') && (
                                <button
                                  type="button"
                                  onClick={() => setActivePassAppointmentId(apt.id)}
                                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Checkout & Pass</span>
                                </button>
                              )}

                              {apt.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAppointmentStatus(apt.id, 'cancelled')}
                                  className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors whitespace-nowrap shrink-0"
                                >
                                  Cancel Slot
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setActivePassAppointmentId(apt.id)}
                              className="min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                            >
                              <span>Digital Pass</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right 4 Cols: Staff Quick-Slot Matrix & Express Walk-In */}
              <div className={mobileFramePreview ? 'col-span-1 space-y-4' : 'lg:col-span-4 space-y-4'}>
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Specialist Quick-Slot Dispatcher
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tap any open time slot below to launch a pre-filled Android booking sheet.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {staff.map((stf) => {
                      const stfBookings = appointments.filter(
                        (a) =>
                          a.date === selectedDate &&
                          a.staffId === stf.id &&
                          a.status !== 'cancelled'
                      );
                      const sampleSlots = ['09:30', '11:00', '13:30', '15:00', '16:30'];

                      return (
                        <div
                          key={stf.id}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {stf.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {stf.role} · {stf.workingHours.start}–{stf.workingHours.end}
                              </div>
                            </div>
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                              {stfBookings.length} booked
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {sampleSlots.map((slot) => {
                              const taken = stfBookings.some(
                                (b) => b.startTime <= slot && b.endTime > slot
                              );
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={taken}
                                  onClick={() =>
                                    openQuickBooking({ startTime: slot, staffId: stf.id })
                                  }
                                  className={`min-h-[36px] px-2.5 py-1 rounded-lg font-mono text-xs tabular-nums transition-colors ${
                                    taken
                                      ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed'
                                      : 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-900 font-medium'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: WAITLIST & LIVE CHECK-IN QUEUE */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Live Reception Queue & Check-In Board
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Track arriving clients, active treatment chairs, and completed POS checkouts for {selectedDate}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openQuickBooking()}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5 self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Add Walk-In Client</span>
              </button>
            </div>

            <div className={`grid gap-5 ${mobileFramePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
              {/* Column 1: Confirmed / Arriving */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    1. Upcoming & Confirmed
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {appointments.filter((a) => a.date === selectedDate && a.status === 'confirmed').length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {appointments
                    .filter((a) => a.date === selectedDate && a.status === 'confirmed')
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="font-bold text-teal-600 dark:text-teal-400">
                            {apt.startTime}
                          </span>
                          <span className="text-slate-400">{apt.referenceCode}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {apt.clientName}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateAppointmentStatus(apt.id, 'checked-in')}
                          className="w-full min-h-[40px] rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                        >
                          Mark Arrived / Check In
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 2: Checked-In & In Session */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    2. Checked-In & In Session
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {
                      appointments.filter(
                        (a) =>
                          a.date === selectedDate &&
                          (a.status === 'checked-in' || a.status === 'in-progress')
                      ).length
                    }
                  </span>
                </div>
                <div className="space-y-2.5">
                  {appointments
                    .filter(
                      (a) =>
                        a.date === selectedDate &&
                        (a.status === 'checked-in' || a.status === 'in-progress')
                    )
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {apt.startTime} – {apt.endTime}
                          </span>
                          <span className="capitalize text-slate-500">{apt.status}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {apt.clientName}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActivePassAppointmentId(apt.id)}
                          className="w-full min-h-[40px] rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
                        >
                          Open POS Checkout (${apt.price})
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 3: Completed & Settled */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    3. Completed & Paid
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {appointments.filter((a) => a.date === selectedDate && a.status === 'completed').length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {appointments
                    .filter((a) => a.date === selectedDate && a.status === 'completed')
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Paid ({apt.paymentMethod || 'Card'})
                          </span>
                          <span className="font-bold">${apt.price}</span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {apt.clientName}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActivePassAppointmentId(apt.id)}
                          className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline pt-1"
                        >
                          View Receipt Pass →
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SERVICE CATALOG & RETAIL INVENTORY */}
        {activeTab === 'services' && (
          <div className="space-y-8">
            {/* Services Section */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Bookable Service Menu & Duration Rules
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tap any service to book immediately or add custom service packages.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewServiceForm((v) => !v)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showNewServiceForm ? 'Close Form' : 'Add Service Package'}</span>
                </button>
              </div>

              {showNewServiceForm && (
                <form
                  onSubmit={handleCreateService}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3"
                >
                  <input
                    type="text"
                    placeholder="Service Title"
                    value={newSrvName}
                    onChange={(e) => setNewSrvName(e.target.value)}
                    className="sm:col-span-2 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                    required
                  />
                  <select
                    value={newSrvCategory}
                    onChange={(e) => setNewSrvCategory(e.target.value as ServiceItem['category'])}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Treatment">Treatment</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Diagnostics">Diagnostics</option>
                    <option value="Grooming">Grooming</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Mins"
                      value={newSrvDuration}
                      onChange={(e) => setNewSrvDuration(Number(e.target.value))}
                      className="w-1/2 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Price $"
                      value={newSrvPrice}
                      onChange={(e) => setNewSrvPrice(Number(e.target.value))}
                      className="w-1/2 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Service description & preparation notes..."
                    value={newSrvDesc}
                    onChange={(e) => setNewSrvDesc(e.target.value)}
                    className="sm:col-span-3 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                  >
                    Save Service
                  </button>
                </form>
              )}

              <div
                className={`grid gap-4 ${
                  mobileFramePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{srv.category}</span>
                        <span className="font-mono tabular-nums">
                          {srv.durationMinutes} min · +{srv.bufferMinutes}m buffer
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {srv.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {srv.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="font-mono">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          ${srv.price}
                        </span>
                        <span className="text-xs text-slate-500 ml-1.5">
                          (${srv.depositRequired} deposit)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openQuickBooking({ serviceId: srv.id })}
                        className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retail Aftercare Inventory Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Retail Aftercare & Consumables Inventory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Products that can be attached to any appointment checkout pass.
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-3.5 px-4 font-semibold">SKU</th>
                      <th className="py-3.5 px-4 font-semibold">Product Name</th>
                      <th className="py-3.5 px-4 font-semibold">Category</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Unit Price</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Stock Level</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                    {products.map((prd) => {
                      const isLow = prd.stock <= prd.reorderLevel;
                      return (
                        <tr key={prd.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-slate-500">{prd.sku}</td>
                          <td className="py-3 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                            {prd.name}
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-500">{prd.category}</td>
                          <td className="py-3 px-4 text-right font-semibold">${prd.price.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={
                                isLow
                                  ? 'text-amber-600 dark:text-amber-400 font-bold'
                                  : 'text-slate-700 dark:text-slate-300'
                              }
                            >
                              {prd.stock} units {isLow ? '(Low Stock)' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              type="button"
                              onClick={() =>
                                setProducts((prev) =>
                                  prev.map((item) =>
                                    item.id === prd.id ? { ...item, stock: item.stock + 10 } : item
                                  )
                                )
                              }
                              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              +10 Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CLIENT CRM DIRECTORY */}
        {activeTab === 'clients' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Client CRM Directory & Booking History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View client preferences, lifetime spend, no-show records, and schedule repeat visits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewClientForm((v) => !v)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{showNewClientForm ? 'Close Form' : 'Add New Client'}</span>
              </button>
            </div>

            {showNewClientForm && (
              <form
                onSubmit={handleCreateClient}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3"
              >
                <input
                  type="text"
                  placeholder="Client Full Name"
                  value={newCliName}
                  onChange={(e) => setNewCliName(e.target.value)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newCliPhone}
                  onChange={(e) => setNewCliPhone(e.target.value)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newCliEmail}
                  onChange={(e) => setNewCliEmail(e.target.value)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold"
                >
                  Save Client Profile
                </button>
                <input
                  type="text"
                  placeholder="Clinical / service notes & preferences..."
                  value={newCliNotes}
                  onChange={(e) => setNewCliNotes(e.target.value)}
                  className="sm:col-span-4 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </form>
            )}

            <div
              className={`grid gap-4 ${
                mobileFramePreview ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              {clients.map((cli) => {
                const prefStaff = staff.find((s) => s.id === cli.preferredStaffId);
                return (
                  <div
                    key={cli.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {cli.name}
                          </h3>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {cli.phone} · {cli.email}
                          </div>
                        </div>
                        <div className="text-right font-mono text-xs tabular-nums">
                          <div className="font-bold text-slate-900 dark:text-white">
                            ${cli.totalSpent} Spent
                          </div>
                          <div className="text-slate-500">{cli.totalVisits} Visits</div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        {cli.notes}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Preferred: {prefStaff?.name || 'Any Specialist'}
                      </span>
                      <button
                        type="button"
                        onClick={() => openQuickBooking({ staffId: cli.preferredStaffId })}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors"
                      >
                        Book Appointment
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: NATIVE ANDROID KOTLIN & JETPACK COMPOSE SOURCE */}
        {activeTab === 'android-code' && <AndroidCodeDrawer />}
      </main>

      {/* ANDROID FIXED BOTTOM TAB NAVIGATION BAR (Mobile Ergonomic Thumb Zone) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-16 px-2">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeTab === 'schedule'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1">Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeTab === 'bookings'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-1">Queue</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('services')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeTab === 'services'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] mt-1">Services</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeTab === 'clients'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">Clients</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('android-code')}
          className={`flex flex-col items-center justify-center min-h-[48px] ${
            activeTab === 'android-code'
              ? 'text-teal-600 dark:text-teal-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Code2 className="w-5 h-5" />
          <span className="text-[10px] mt-1">Kotlin</span>
        </button>
      </nav>

      {/* Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedDate={selectedDate}
        initialStartTime={prefillSlot.startTime}
        initialStaffId={prefillSlot.staffId}
        initialServiceId={prefillSlot.serviceId}
        staff={staff}
        services={services}
        clients={clients}
        appointments={appointments}
        onSaveBooking={handleSaveBooking}
      />

      <AppointmentPassModal
        appointment={activePassAppointment}
        onClose={() => setActivePassAppointmentId(null)}
        staff={staff}
        services={services}
        products={products}
        onUpdateStatus={handleUpdateAppointmentStatus}
        onAddProductToAppointment={handleAddProductToAppointment}
        onRemoveProductFromAppointment={handleRemoveProductFromAppointment}
      />
    </div>
  );
}
