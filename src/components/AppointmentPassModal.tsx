import React, { useState } from 'react';
import { X, Printer, CheckCircle2, Plus, Trash2, QrCode, Share2, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Appointment, ProductItem, ServiceItem, StaffMember } from '../types';

interface AppointmentPassModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  staff: StaffMember[];
  services: ServiceItem[];
  products: ProductItem[];
  onUpdateStatus: (id: string, status: Appointment['status'], paymentMethod?: Appointment['paymentMethod']) => void;
  onAddProductToAppointment: (appointmentId: string, product: ProductItem) => void;
  onRemoveProductFromAppointment: (appointmentId: string, productId: string) => void;
}

export const AppointmentPassModal: React.FC<AppointmentPassModalProps> = ({
  appointment,
  onClose,
  staff,
  services,
  products,
  onUpdateStatus,
  onAddProductToAppointment,
  onRemoveProductFromAppointment,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<'Card' | 'Cash' | 'UPI / QR'>('Card');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [shareCopied, setShareCopied] = useState(false);

  if (!appointment) return null;

  const assignedStaff = staff.find((s) => s.id === appointment.staffId);
  const service = services.find((s) => s.id === appointment.serviceId);

  const addonsTotal = (appointment.addonProducts || []).reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const grandTotal = appointment.price + addonsTotal;
  const remainingDue = appointment.depositPaid && service
    ? Math.max(0, grandTotal - service.depositRequired)
    : grandTotal;

  const handleSharePass = () => {
    const summaryText = `Appointment Booking System Pass [${appointment.referenceCode}]\nClient: ${appointment.clientName}\nService: ${service?.name || 'Appointment'}\nDate: ${appointment.date} at ${appointment.startTime}\nSpecialist: ${assignedStaff?.name || 'Staff'}\nTotal: $${grandTotal.toFixed(2)}`;
    navigator.clipboard.writeText(summaryText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Android Digital Booking Pass & POS Checkout
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Ref: {appointment.referenceCode} · {appointment.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close pass"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1" id="printable-receipt">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Client Name</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {appointment.clientName}
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                  {appointment.clientPhone}
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-500 dark:text-slate-400">Slot Time</div>
                <div className="text-base font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                  {appointment.startTime} – {appointment.endTime}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                  Status: {appointment.status}
                </div>
              </div>
            </div>

            {/* Service & Staff Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Booked Service</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {service?.name || 'Standard Service'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Specialist</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {assignedStaff?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between font-mono tabular-nums">
                <span className="text-slate-500 dark:text-slate-400">Service Fee</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${appointment.price.toFixed(2)}
                </span>
              </div>

              {/* Retail Add-on Products */}
              {(appointment.addonProducts || []).map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between font-mono tabular-nums text-slate-700 dark:text-slate-300 pt-1"
                >
                  <div className="flex items-center gap-2">
                    <span>
                      + {item.name} (x{item.qty})
                    </span>
                    {appointment.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => onRemoveProductFromAppointment(appointment.id, item.productId)}
                        className="text-red-500 hover:text-red-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-1.5 font-mono text-xs tabular-nums">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
              {appointment.depositPaid && service && service.depositRequired > 0 && (
                <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
                  <span>Prepaid Booking Deposit</span>
                  <span>-${service.depositRequired.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white pt-1">
                <span>Balance Due at Checkout</span>
                <span>${remainingDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Add Retail Aftercare Item */}
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Add Retail Aftercare Product to Appointment Bill
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                >
                  {products.map((prd) => (
                    <option key={prd.id} value={prd.id} disabled={prd.stock <= 0}>
                      {prd.name} — ${prd.price} ({prd.stock} in stock)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const prd = products.find((p) => p.id === selectedProductId);
                    if (prd) onAddProductToAppointment(appointment.id, prd);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>
          )}

          {/* Payment Method Selection for Checkout */}
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Payment Tender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Card', 'UPI / QR', 'Cash'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedPayment(method)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      selectedPayment === method
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {method === 'Card' && <CreditCard className="w-3.5 h-3.5" />}
                    {method === 'UPI / QR' && <Smartphone className="w-3.5 h-3.5" />}
                    {method === 'Cash' && <Banknote className="w-3.5 h-3.5" />}
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Pass</span>
            </button>
            <button
              type="button"
              onClick={handleSharePass}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{shareCopied ? 'Pass Copied!' : 'Copy SMS Text'}</span>
            </button>
          </div>

          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(appointment.id, 'completed', selectedPayment);
                onClose();
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete & Collect ${remainingDue.toFixed(2)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
