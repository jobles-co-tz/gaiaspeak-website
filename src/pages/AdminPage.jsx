import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getAllReservations,
  getCompletedPhysicalBatches,
  getCurrentPhysicalBatch,
  getQueueRequests,
  PHYSICAL_BATCH_TARGET_GRAMS,
  supabase,
} from '../config/supabase';

const ADMIN_USERNAME = 'g';
const ADMIN_PASSWORD = 'g';

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'queue', label: 'Current Queue' },
  { key: 'batches', label: 'Completed Batches' },
  { key: 'reservations', label: 'Wristband Orders' },
];

export function AdminPage() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('gaiaspeak_admin_auth') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const [currentBatch, setCurrentBatch] = useState(null);
  const [queueRequests, setQueueRequests] = useState([]);
  const [completedBatches, setCompletedBatches] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    if (isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      const username = window.prompt('Admin Login\n\nUsername:');
      if (!username) {
        navigate('/');
        return;
      }

      const password = window.prompt('Password:');
      if (!password) {
        navigate('/');
        return;
      }

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        sessionStorage.setItem('gaiaspeak_admin_auth', 'true');
      } else {
        window.alert('Invalid credentials');
        navigate('/');
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, navigate]);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    const [batchResult, queueResult, completedResult, reservationResult] = await Promise.all([
      getCurrentPhysicalBatch(),
      getQueueRequests(),
      getCompletedPhysicalBatches(),
      getAllReservations(),
    ]);

    if (batchResult.success) setCurrentBatch(batchResult.batch);
    if (queueResult.success) setQueueRequests(queueResult.requests || []);
    if (completedResult.success) setCompletedBatches(completedResult.batches || []);
    if (reservationResult.success) setReservations(reservationResult.reservations || []);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      refresh();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, refresh]);

  useEffect(() => {
    if (!isAuthenticated || !supabase) return undefined;

    const channel = supabase
      .channel('admin-live-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_delivery_requests' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_delivery_batches' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bracelet_reservations' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, refresh]);

  const handleLogout = () => {
    sessionStorage.removeItem('gaiaspeak_admin_auth');
    navigate('/');
  };

  const collectedGrams = useMemo(() => Number(currentBatch?.collected_grams || 0), [currentBatch]);
  const targetGrams = useMemo(() => Number(currentBatch?.target_grams || PHYSICAL_BATCH_TARGET_GRAMS), [currentBatch]);
  const progress = Math.min(100, (collectedGrams / targetGrams) * 100);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-semibold">
              <span className="text-amber-400">Gaia</span>
              <span className="text-slate-400">Speak</span>
            </Link>
            <span className="text-[10px] uppercase tracking-wider bg-red-500/20 text-red-300 px-2 py-1 rounded">Admin Control</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refresh}
              className="text-xs px-3 py-1.5 rounded border border-slate-700 hover:border-amber-500 text-slate-300"
            >
              Refresh
            </button>
            <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-red-400 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="w-64 border-r border-slate-800 p-4 hidden md:block">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Control Panels</div>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeTab === item.key
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6">
          <div className="md:hidden mb-4 flex gap-2 overflow-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-3 py-1.5 rounded text-xs whitespace-nowrap border ${
                  activeTab === item.key ? 'border-amber-500 text-amber-300 bg-amber-500/10' : 'border-slate-700 text-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-slate-400 py-12 text-center">Loading dashboard...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-light">1kg Pooling Overview</h1>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <MetricCard label="Current Batch" value={`#${currentBatch?.batch_number || 1}`} />
                    <MetricCard label="Collected" value={`${collectedGrams.toFixed(2)}g`} />
                    <MetricCard label="Queue Users" value={String(queueRequests.length)} />
                  </div>

                  <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2 text-sm text-slate-300">
                      <span>Progress toward next bulk supplier order</span>
                      <span>{collectedGrams.toFixed(2)}g / {targetGrams}g</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-2">
                      <div className="h-full bg-linear-to-r from-amber-500 to-emerald-400" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Oracle trigger activates automatically at 1,000g and assigns the cheapest verified supplier.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'queue' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-light">Users in Current Queue</h2>
                  {queueRequests.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-center">
                      Queue is empty.
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">#</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Wallet</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Token</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Grams</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Location</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {queueRequests.map((request, index) => (
                            <tr key={request.id} className="border-t border-slate-800/80">
                              <td className="px-3 py-2 text-slate-300">{index + 1}</td>
                              <td className="px-3 py-2 font-mono text-amber-300">{request.wallet_address?.slice(0, 8)}...{request.wallet_address?.slice(-4)}</td>
                              <td className="px-3 py-2 text-slate-300">{request.token_type}</td>
                              <td className="px-3 py-2 text-slate-100">{Number(request.grams).toFixed(2)}g</td>
                              <td className="px-3 py-2 text-slate-400">{request.city}, {request.country}</td>
                              <td className="px-3 py-2 text-slate-500">{new Date(request.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'batches' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-light">Completed Oracle Batches</h2>
                  {completedBatches.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-center">
                      No completed batches yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completedBatches.map((batch) => (
                        <div key={batch.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-slate-100 font-medium">Batch #{batch.batch_number}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">completed</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-400">Total grams: <span className="text-slate-200">{Number(batch.collected_grams).toFixed(2)}g</span></p>
                            <p className="text-slate-400">Supplier chosen: <span className="text-amber-300">{batch.supplier_name || 'N/A'}</span></p>
                            <p className="text-slate-400">Price/gram: <span className="text-slate-200">${Number(batch.supplier_price_per_gram || 0).toFixed(2)}</span></p>
                            <p className="text-slate-500 text-xs">Closed: {batch.closed_at ? new Date(batch.closed_at).toLocaleString() : '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reservations' && (
                <div className="space-y-4">
                  <h2 className="text-xl font-light">Wristband Reservation Orders</h2>
                  {reservations.length === 0 ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-400 text-center">
                      No pre-orders yet.
                    </div>
                  ) : (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-800/50">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Date</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Name</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Email</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Country</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Qty</th>
                            <th className="text-left px-3 py-2 text-xs text-slate-400 uppercase">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reservations.map((order) => (
                            <tr key={order.id} className="border-t border-slate-800/80">
                              <td className="px-3 py-2 text-slate-400">{new Date(order.created_at).toLocaleDateString()}</td>
                              <td className="px-3 py-2 text-slate-100">{order.full_name}</td>
                              <td className="px-3 py-2 text-slate-400">{order.email}</td>
                              <td className="px-3 py-2 text-slate-400">{order.country}</td>
                              <td className="px-3 py-2 text-amber-300">{order.quantity}</td>
                              <td className="px-3 py-2">
                                <button onClick={() => setSelectedReservation(order)} className="text-xs text-amber-300 hover:text-amber-200">
                                  View details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-100">Order Details</h2>
                <button onClick={() => setSelectedReservation(null)} className="text-slate-400 hover:text-slate-200">✕</button>
              </div>
              <div className="space-y-3 text-sm">
                <InfoRow label="Name" value={selectedReservation.full_name} />
                <InfoRow label="Email" value={selectedReservation.email} />
                <InfoRow label="Phone" value={selectedReservation.phone} />
                <InfoRow label="Wallet" value={selectedReservation.wallet_address} mono />
                <InfoRow label="Quantity" value={String(selectedReservation.quantity)} />
                <InfoRow
                  label="Address"
                  value={`${selectedReservation.street_address}, ${selectedReservation.city}, ${selectedReservation.postal_code}, ${selectedReservation.country}`}
                />
                {selectedReservation.tx_hash && <InfoRow label="TX" value={selectedReservation.tx_hash} mono />}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className="text-2xl font-light text-slate-100">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div>
      <div className="text-xs text-slate-500 uppercase mb-1">{label}</div>
      <div className={`${mono ? 'font-mono text-xs break-all' : ''} text-slate-200`}>{value}</div>
    </div>
  );
}

