import { useMemo, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { COUNTRIES } from '../config/contracts';
import { usePhysicalDeliveryQueue } from '../hooks/usePhysicalDeliveryQueue';

const INITIAL_FORM = {
  tokenType: 'GSG',
  grams: 1,
  country: '',
  city: '',
  street: '',
  postalCode: '',
};

export function PhysicalDeliveryPool() {
  const { isConnected } = useAccount();
  const {
    isLoading,
    isSubmitting,
    error,
    lastMessage,
    userQueue,
    collectedGrams,
    targetGrams,
    remainingGrams,
    progressPercent,
    estimatedTimeLabel,
    submitRequest,
  } = usePhysicalDeliveryQueue();

  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const queueSize = useMemo(() => Math.max(0, Math.round(collectedGrams)), [collectedGrams]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'grams' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (Number(form.grams) < 1) {
      setFormError('Minimum withdrawal is 1g.');
      return;
    }

    if (!form.country || !form.city || !form.street || !form.postalCode) {
      setFormError('Please complete Country, City, Street, and Postal Code.');
      return;
    }

    const result = await submitRequest(form);
    if (result.success) {
      setShowConfirmation(true);
      setForm(INITIAL_FORM);
    }
  };

  return (
    <section className="py-14 sm:py-20 px-4 bg-slate-900/40 border-y border-slate-800/60">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 sm:mb-10">
          <div className="text-[10px] sm:text-xs font-semibold tracking-widest text-amber-400 uppercase mb-2">
            Physical Delivery Pool · 1kg Oracle Batch
          </div>
          <h2 className="text-2xl sm:text-4xl font-light text-slate-100 mb-3">
            Collective withdrawals for <span className="text-amber-400 italic">better supplier pricing</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl">
            No supplier selection is needed. You request physical withdrawal in grams, join the community queue,
            and when the pool reaches 1kg, our simulated oracle automatically routes the batch to the cheapest verified supplier.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-400">Batch Progress</span>
              <span className="text-xs text-amber-400">{collectedGrams.toFixed(2)}g / {targetGrams}g</span>
            </div>

            <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-3">
              <div
                className="h-full bg-linear-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm mb-5">
              <div className="bg-slate-800/50 rounded p-3 border border-slate-700/40">
                <div className="text-slate-500 mb-1">Remaining to next 1kg order</div>
                <div className="text-slate-100 font-medium">{remainingGrams.toFixed(2)}g</div>
              </div>
              <div className="bg-slate-800/50 rounded p-3 border border-slate-700/40">
                <div className="text-slate-500 mb-1">Estimated time to trigger</div>
                <div className="text-slate-100 font-medium">{estimatedTimeLabel}</div>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="text-slate-400">
                Queue currently represents roughly <span className="text-amber-400">{queueSize}g</span> pending withdrawal requests.
              </div>
              {userQueue.inQueue ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-emerald-300">
                  You are in the queue at position <span className="font-semibold">#{userQueue.queuePosition}</span>.
                </div>
              ) : (
                <div className="bg-slate-800/60 border border-slate-700/40 rounded p-3 text-slate-400">
                  {isLoading ? 'Loading your queue status...' : 'No active queue entry for your wallet yet.'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 sm:p-6">
            <h3 className="text-lg font-medium text-slate-100 mb-1">Request Physical Delivery</h3>
            <p className="text-xs text-slate-500 mb-4">Step 1: Amount · Step 2: Shipping · Step 3: Queue confirmation</p>

            {!isConnected ? (
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-5 text-center">
                <p className="text-sm text-slate-400 mb-4">Connect wallet to submit your GSG/GSS withdrawal request.</p>
                <ConnectButton />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Token</label>
                    <select
                      name="tokenType"
                      value={form.tokenType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="GSG">GSG (Gold)</option>
                      <option value="GSS">GSS (Silver)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Withdraw amount (grams)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      name="grams"
                      value={form.grams}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Country</label>
                    <select
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Street</label>
                    <input
                      name="street"
                      value={form.street}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Postal code</label>
                    <input
                      name="postalCode"
                      value={form.postalCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {(formError || error) && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded p-2">
                    {formError || error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-slate-900 font-semibold rounded transition-colors"
                >
                  {isSubmitting ? 'Submitting request...' : 'Add to 1kg Queue'}
                </button>
              </form>
            )}

            {(showConfirmation || lastMessage) && (
              <div className="mt-4 text-xs sm:text-sm bg-emerald-500/10 border border-emerald-500/30 rounded p-3 text-emerald-300">
                <p>
                  "Your 1g order is added to the queue. When we reach 1kg, the oracles will automatically choose the cheapest verified supplier and ship your gold."
                </p>
                <p className="mt-2 text-emerald-200/80">{lastMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
