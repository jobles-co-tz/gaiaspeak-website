import { useState, useEffect } from 'react';
import { usePreOrder } from '../hooks/usePreOrder';
import { COUNTRIES, BRACELET_OPTIONS } from '../config/contracts';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function PreOrderModal({ isOpen, onClose }) {
  const {
    isConnected,
    address,
    gsgBalance,
    gssBalance,
    isEligible,
    maxBracelets,
    reserveWristband,
    reservationStatus,
    error,
    reservationId,
    resetStatus,
  } = usePreOrder();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    streetAddress: '',
    postalCode: '',
    quantity: 1,
    size: '',
    color: '',
    notes: '',
    termsAccepted: false,
  });

  const [formErrors, setFormErrors] = useState({});

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timeoutId = window.setTimeout(() => {
        resetStatus();
        setFormErrors({});
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [isOpen, resetStatus]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.country) errors.country = 'Country is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.streetAddress.trim()) errors.streetAddress = 'Street address is required';
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (formData.quantity < 1) errors.quantity = 'Minimum quantity is 1';
    if (formData.quantity > maxBracelets) errors.quantity = `Maximum ${maxBracelets} based on your balance`;
    if (!formData.termsAccepted) errors.termsAccepted = 'You must accept the terms';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    await reserveWristband(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/50 rounded-lg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Reserve Your Bracelet</h2>
            <p className="text-xs text-slate-500">WHITE Collection Pre-Order</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Step 1: Connect Wallet */}
          {!isConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-slate-400 mb-6">Connect your wallet to check eligibility and reserve</p>
              <ConnectButton />
            </div>
          ) : !isEligible ? (
            /* Step 2: Not Eligible */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">Insufficient Balance</h3>
              <p className="text-sm text-slate-400 mb-4">
                You need at least 0.1 GSG or 1 GSS to pre-order.
              </p>
              <div className="text-xs text-slate-500">
                Your balance: {gsgBalance.toFixed(4)} GSG · {gssBalance.toFixed(4)} GSS
              </div>
              <a href="#trade" onClick={onClose} className="inline-block mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-medium rounded">
                Buy Tokens
              </a>
            </div>
          ) : reservationStatus === 'success' ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-2">Reservation Confirmed!</h3>
              <p className="text-sm text-slate-400 mb-4">Your bracelet reservation has been recorded.</p>
              <div className="bg-slate-800/50 rounded p-3 text-xs text-slate-500 mb-4">
                Reservation ID: <span className="text-amber-400 font-mono">{reservationId}</span>
              </div>
              <button onClick={onClose} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded">
                Close
              </button>
            </div>
          ) : (
            /* Step 3: Form */
            <PreOrderForm
              formData={formData}
              formErrors={formErrors}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              reservationStatus={reservationStatus}
              error={error}
              address={address}
              maxBracelets={maxBracelets}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PreOrderForm({ formData, formErrors, handleChange, handleSubmit, reservationStatus, error, address, maxBracelets }) {
  const isSubmitting = reservationStatus === 'reserving' || reservationStatus === 'saving';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Wallet Info */}
      <div className="bg-slate-800/30 rounded p-3 flex items-center justify-between">
        <span className="text-xs text-slate-500">Connected Wallet</span>
        <span className="text-xs text-slate-300 font-mono">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Required Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Full Name *" name="fullName" value={formData.fullName} onChange={handleChange} error={formErrors.fullName} placeholder="John Doe" />
        <FormField label="Email *" name="email" type="email" value={formData.email} onChange={handleChange} error={formErrors.email} placeholder="john@example.com" />
        <FormField label="WhatsApp / Phone *" name="phone" value={formData.phone} onChange={handleChange} error={formErrors.phone} placeholder="+1 234 567 8900" />
        <div>
          <label className="block text-xs text-slate-400 mb-1">Country *</label>
          <select name="country" value={formData.country} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-amber-500 focus:outline-none">
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {formErrors.country && <span className="text-xs text-red-400">{formErrors.country}</span>}
        </div>
        <FormField label="City *" name="city" value={formData.city} onChange={handleChange} error={formErrors.city} placeholder="New York" />
        <FormField label="Postal / ZIP Code *" name="postalCode" value={formData.postalCode} onChange={handleChange} error={formErrors.postalCode} placeholder="10001" />
      </div>

      <FormField label="Street Address + Apartment *" name="streetAddress" value={formData.streetAddress} onChange={handleChange} error={formErrors.streetAddress} placeholder="123 Main St, Apt 4B" />

      {/* Quantity */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Quantity * (max {maxBracelets})</label>
        <input type="number" name="quantity" min="1" max={maxBracelets} value={formData.quantity} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-amber-500 focus:outline-none" />
        {formErrors.quantity && <span className="text-xs text-red-400">{formErrors.quantity}</span>}
      </div>

      {/* Optional Fields */}
      <div className="pt-2 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 mb-3">Optional preferences</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Wristband Size</label>
            <select name="size" value={formData.size} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-amber-500 focus:outline-none">
              <option value="">Select size</option>
              {BRACELET_OPTIONS.sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Color</label>
            <select name="color" value={formData.color} onChange={handleChange} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-amber-500 focus:outline-none">
              <option value="">Select color</option>
              {BRACELET_OPTIONS.colors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-slate-400 mb-1">Notes</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Any special requests..." className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:border-amber-500 focus:outline-none resize-none" />
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2 pt-2">
        <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500" />
        <label className="text-xs text-slate-400">
          I agree to the <a href="#" className="text-amber-400 underline">Terms & Conditions</a> and understand that my tokens will be transferred to complete this reservation.
        </label>
      </div>
      {formErrors.termsAccepted && <span className="text-xs text-red-400">{formErrors.termsAccepted}</span>}

      {/* Submit */}
      <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded transition-colors flex items-center justify-center gap-2">
        {isSubmitting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {reservationStatus === 'reserving' ? 'Processing...' : 'Saving...'}
          </>
        ) : 'Reserve Now'}
      </button>
    </form>
  );
}

function FormField({ label, name, type = 'text', value, onChange, error, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none" />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

