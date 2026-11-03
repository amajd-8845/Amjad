import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, User, Scissors, AlertCircle, Check } from 'lucide-react';
import { Appointment, ClientProfile, ServiceItem, StaffMember } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  initialStartTime?: string;
  initialStaffId?: string;
  initialServiceId?: string;
  staff: StaffMember[];
  services: ServiceItem[];
  clients: ClientProfile[];
  appointments: Appointment[];
  onSaveBooking: (bookingData: {
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
  }) => void;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + minutesToAdd;
  const endH = Math.floor(totalMins / 60);
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  initialStartTime,
  initialStaffId,
  initialServiceId,
  staff,
  services,
  clients,
  appointments,
  onSaveBooking,
}) => {
  const [date, setDate] = useState(selectedDate);
  const [serviceId, setServiceId] = useState(initialServiceId || services[0]?.id || '');
  const [staffId, setStaffId] = useState(initialStaffId || staff[0]?.id || '');
  const [startTime, setStartTime] = useState(initialStartTime || '10:00');
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [depositPaid, setDepositPaid] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setDate(selectedDate);
      if (initialStartTime) setStartTime(initialStartTime);
      if (initialStaffId) setStaffId(initialStaffId);
      if (initialServiceId) setServiceId(initialServiceId);
      setErrorMsg(null);
    }
  }, [isOpen, selectedDate, initialStartTime, initialStaffId, initialServiceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) || services[0],
    [services, serviceId]
  );

  const endTime = useMemo(() => {
    if (!selectedService) return addMinutesToTime(startTime, 45);
    return addMinutesToTime(startTime, selectedService.durationMinutes);
  }, [startTime, selectedService]);

  const isSlotTaken = (slotStart: string): boolean => {
    const slotEnd = addMinutesToTime(slotStart, selectedService?.durationMinutes || 45);
    return appointments.some(
      (apt) =>
        apt.date === date &&
        apt.staffId === staffId &&
        apt.status !== 'cancelled' &&
        apt.startTime < slotEnd &&
        apt.endTime > slotStart
    );
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSlotTaken(startTime)) {
      const stf = staff.find((s) => s.id === staffId);
      setErrorMsg(
        `Conflict detected: ${stf?.name || 'Staff'} already has an overlapping booking between ${startTime} and ${endTime}.`
      );
      return;
    }

    let finalClientId = selectedClientId;
    let finalClientName = '';
    let finalClientPhone = '';

    if (clientMode === 'existing') {
      const found = clients.find((c) => c.id === selectedClientId);
      if (!found) {
        setErrorMsg('Please select a valid client.');
        return;
      }
      finalClientName = found.name;
      finalClientPhone = found.phone;
    } else {
      if (!newClientName.trim() || !newClientPhone.trim()) {
        setErrorMsg('Please enter both the new client name and phone number.');
        return;
      }
      finalClientId = `cli-${Date.now()}`;
      finalClientName = newClientName.trim();
      finalClientPhone = newClientPhone.trim();
    }

    onSaveBooking({
      clientId: finalClientId,
      clientName: finalClientName,
      clientPhone: finalClientPhone,
      staffId,
      serviceId,
      date,
      startTime,
      endTime,
      notes: notes.trim(),
      price: selectedService?.price || 0,
      depositPaid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Android Bottom Sheet Drag Handle */}
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Schedule New Appointment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time conflict checking & instant SMS pass generation
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Service Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              1. Select Service
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {services.map((srv) => {
                const isSelected = srv.id === serviceId;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setServiceId(srv.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[72px] ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 dark:bg-teal-950/40 dark:border-teal-500 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold line-clamp-1">{srv.name}</div>
                    <div className="flex items-center justify-between w-full mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      <span>{srv.durationMinutes} min</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">${srv.price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Specialist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                2. Appointment Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                3. Assigned Specialist
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {staff.map((stf) => (
                  <option key={stf.id} value={stf.id}>
                    {stf.name} ({stf.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Time Slots */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                4. Select Start Time (Calculates {selectedService?.durationMinutes || 45}m slot: {startTime} – {endTime})
              </label>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {TIME_SLOTS.map((slot) => {
                const busy = isSlotTaken(slot);
                const active = startTime === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={busy}
                    onClick={() => setStartTime(slot)}
                    className={`min-h-[40px] py-1.5 px-2 rounded-lg font-mono text-xs font-medium transition-all tabular-nums ${
                      busy
                        ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed'
                        : active
                        ? 'bg-teal-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Client Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                5. Client Information
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setClientMode('existing')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    clientMode === 'existing'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Existing Client
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('new')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    clientMode === 'new'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  + Walk-In / New
                </button>
              </div>
            </div>

            {clientMode === 'existing' ? (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.phone} ({c.totalVisits} visits)
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Client Full Name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (for SMS Pass)"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            )}
          </div>

          {/* Notes & Deposit Toggle */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Appointment notes, preferences, or intake instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600"
            />

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 cursor-pointer">
              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Mark Booking Deposit Collected (${selectedService?.depositRequired || 0})
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Protects against no-shows and locks time slot on Android kiosk
                </div>
              </div>
              <input
                type="checkbox"
                checked={depositPaid}
                onChange={(e) => setDepositPaid(e.target.checked)}
                className="w-5 h-5 accent-teal-600 rounded"
              />
            </label>
          </div>

          {/* Footer CTA */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Appointment (${selectedService?.price || 0})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
