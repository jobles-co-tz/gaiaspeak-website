import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase,submitSupplierPrices } from "../config/supabase";

export function SupplierSubmitPage() {
  const { supplierId } = useParams();  
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goldPrice, setGoldPrice] = useState("");
  const [silverPrice, setSilverPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastSubmitted, setLastSubmitted] = useState(null);
  const [utcTime, setUtcTime] = useState("");

 // Live EAT clock (UTC+3)
useEffect(() => {
  const tick = () =>
    setUtcTime(
      new Date().toLocaleString("en-GB", {
        timeZone: "Africa/Dar_es_Salaam",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).replace(",", "") + " EAT"
    );
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

  // Fetch supplier details from gold_suppliers table
  useEffect(() => {
    if (!supabase || !supplierId) {
      setLoading(false);
      return;
    }
    supabase
      .from("suppliers")
      .select("id, name, country, contact_email")
      .eq("id", supplierId)
      .eq("active", true)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setMessage({ type: "error", text: "Supplier not found or inactive" });
        } else {
          setSupplier(data);
        }
        setLoading(false);
      });
  }, [supplierId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    console.log("Submitted data;",{
      supplierId: supplier.id,
      goldPrice,
      silverPrice,
    })

    const result = await submitSupplierPrices({
      supplierId: supplier.id,
      goldPrice,
      silverPrice,
    });

    if (result.success) {
      setMessage({ type: "success", text: "Prices submitted successfully" });
      setLastSubmitted(new Date().toISOString());
      setGoldPrice("");
      setSilverPrice("");
    } else {
      setMessage({ type: "error", text: result.error || "Something went wrong" });
    }

    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading supplier…
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="rounded-2xl border border-red-700 bg-red-900/30 p-8 text-center text-red-300">
          <h1 className="text-lg font-semibold">Invalid supplier link</h1>
          <p className="mt-2 text-sm text-red-400">
            This link is not associated with an active supplier.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="flex min-h-screen items-start justify-center px-4 pt-12 pb-24 sm:pt-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              GaiaSpeak Supplier Portal
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Submit current precious-metal prices
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500">{utcTime}</p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-lg"
          >
            {/* Supplier badge */}
            <div className="mb-6 rounded-lg bg-slate-800 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Supplier</span>
                <span className="font-medium text-amber-400">{supplier.name}</span>
              </div>
              {supplier.country && (
                <p className="mt-0.5 text-xs text-slate-500">{supplier.country}</p>
              )}
            </div>

            {/* Gold price */}
            <label className="mb-4 block">
              <span className="mb-1 block text-sm font-medium text-slate-200">
                Gold price per kg{" "}
                <span className="text-slate-500">(USD)</span>
              </span>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="e.g. 85000"
                value={goldPrice}
                onChange={(e) => setGoldPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-lg tabular-nums text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </label>

            {/* Silver price */}
            <label className="mb-6 block">
              <span className="mb-1 block text-sm font-medium text-slate-200">
                Silver price per kg{" "}
                <span className="text-slate-500">(USD)</span>
              </span>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder="e.g. 1050"
                value={silverPrice}
                onChange={(e) => setSilverPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-lg tabular-nums text-white placeholder:text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
              />
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Prices"}
            </button>

            {/* Feedback */}
            {message && (
              <div
                className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-900/40 text-green-300 border border-green-700"
                    : "bg-red-900/40 text-red-300 border border-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Last submitted */}
            {lastSubmitted && (
              <p className="mt-3 text-center text-xs text-slate-500">
                Last submitted:{" "}
                {new Date(lastSubmitted)
                  .toISOString()
                  .replace("T", " ")
                  .slice(0, 19)}{" "}
                UTC
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}