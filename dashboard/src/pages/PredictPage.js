import { useState } from "react";
import axios from "axios";
import { Zap, AlertTriangle, CheckCircle, Loader2, Bot } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// API endpoint - change if your API runs on different host/port
const API_URL = "http://127.0.0.1:8000/predict";

// Preset transactions for quick demo
const PRESETS = {
  normal: {
    label: "Normal Transaction",
    data: {
      TransactionAmt: 250,
      card1: 9500,
      card2: 321,
      card3: 150,
      card5: 226,
      ProductCD: 1,
      addr1: 299,
      dist1: 19,
      C1: 1,
      C14: 1,
    },
  },
  suspicious: {
    label: "Suspicious Transaction",
    data: {
      TransactionAmt: 45000,
      card1: 2345,
      card2: 111,
      card3: 185,
      card5: 102,
      ProductCD: 4,
      addr1: 102,
      dist1: 850,
      C1: 12,
      C14: 28,
    },
  },
  fraud: {
    label: "High-Risk Transaction",
    data: {
      TransactionAmt: 4500,
      card1: 23457,
      card2: 111,
      card3: 1850,
      card5: 102,
      ProductCD: 40,
      addr1: 102,
      dist1: 850000000,
      C1: 12,
      C14: 280,
    },
  },
};

export default function PredictPage() {
  const [formData, setFormData] = useState(PRESETS.normal.data);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: Number(value) || 0 });
  };

  const loadPreset = (presetKey) => {
    setFormData(PRESETS[presetKey].data);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(API_URL, formData);
      setResult(response.data);
    } catch (err) {
      setError(
        err.response
          ? `API Error: ${err.response.status} - ${err.response.data?.detail || "Unknown"}`
          : "Cannot connect to API. Make sure the server is running on http://127.0.0.1:8000"
      );
    } finally {
      setLoading(false);
    }
  };

  const RISK_COLORS = { HIGH: "bg-red-500", MEDIUM: "bg-yellow-500", LOW: "bg-green-500" };
  const RISK_TEXT = { HIGH: "text-red-600", MEDIUM: "text-yellow-600", LOW: "text-green-600" };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Zap className="text-blue-600" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Check Transaction</h2>
          <p className="text-sm text-gray-500">Live fraud prediction using XGBoost + SHAP</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Transaction Details</h3>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="text-sm text-gray-500 self-center mr-2">Quick load:</span>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => loadPreset(key)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount - big and prominent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Amount (Rs)
              </label>
              <input
                type="number"
                value={formData.TransactionAmt}
                onChange={(e) => handleChange("TransactionAmt", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-semibold"
              />
            </div>

            {/* Card details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card1</label>
                <input
                  type="number"
                  value={formData.card1}
                  onChange={(e) => handleChange("card1", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card2</label>
                <input
                  type="number"
                  value={formData.card2}
                  onChange={(e) => handleChange("card2", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card3</label>
                <input
                  type="number"
                  value={formData.card3}
                  onChange={(e) => handleChange("card3", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card5</label>
                <input
                  type="number"
                  value={formData.card5}
                  onChange={(e) => handleChange("card5", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Other features */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                <input
                  type="number"
                  value={formData.ProductCD}
                  onChange={(e) => handleChange("ProductCD", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Code</label>
                <input
                  type="number"
                  value={formData.addr1}
                  onChange={(e) => handleChange("addr1", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                <input
                  type="number"
                  value={formData.dist1}
                  onChange={(e) => handleChange("dist1", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">C1 Counter</label>
                <input
                  type="number"
                  value={formData.C1}
                  onChange={(e) => handleChange("C1", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">C14 Counter</label>
                <input
                  type="number"
                  value={formData.C14}
                  onChange={(e) => handleChange("C14", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 italic">
              Note: 461 other features auto-filled with 0 (out of 471 total)
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Check for Fraud
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT: Result */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">AI Prediction Result</h3>

          {!result && !error && !loading && (
            <div className="flex flex-col items-center justify-center h-80 text-gray-400">
              <Zap size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Submit a transaction to see results</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-80 text-blue-500">
              <Loader2 size={48} className="animate-spin mb-3" />
              <p className="text-sm">Running XGBoost model...</p>
              <p className="text-xs text-gray-400 mt-1">Computing SHAP explanations...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                  <p className="text-xs mt-2 text-red-500">
                    Start the API: cd api &amp;&amp; python app.py
                  </p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div>
              {/* Fraud probability - big visual */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${RISK_COLORS[result.risk_level]} mb-3`}>
                  <span className="text-4xl font-bold text-white">
                    {(result.fraud_probability * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-gray-500">Fraud Probability</p>
                <p className={`text-2xl font-bold mt-2 ${RISK_TEXT[result.risk_level]}`}>
                  {result.risk_level} RISK
                </p>
              </div>

              {/* Fraud/Not Fraud verdict */}
              <div className={`flex items-center gap-3 p-3 rounded-lg mb-5 ${result.is_fraud ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                {result.is_fraud ? (
                  <>
                    <AlertTriangle className="text-red-600" size={24} />
                    <div>
                      <p className="font-semibold text-red-700">Flagged as Fraud</p>
                      <p className="text-xs text-red-600">RPA bots would trigger alert, case, report</p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="text-green-600" size={24} />
                    <div>
                      <p className="font-semibold text-green-700">Transaction Approved</p>
                      <p className="text-xs text-green-600">No suspicious activity detected</p>
                    </div>
                  </>
                )}
              </div>

              {/* RPA Actions - only shown if fraud triggered bots */}
              {result.rpa_triggered && result.rpa_actions && result.rpa_actions.length > 0 && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                    <Bot size={18} />
                    RPA Pipeline Triggered Automatically
                  </h4>
                  <div className="space-y-2">
                    {result.rpa_actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-gray-800">{action.bot}:</span>{" "}
                          <span className="text-gray-600">{action.detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHAP Explanation */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Why? (SHAP Explanation)
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={result.shap_explanation} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" fontSize={11} />
                    <YAxis type="category" dataKey="feature" fontSize={11} width={75} />
                    <Tooltip formatter={(val) => val.toFixed(4)} />
                    <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
                      {result.shap_explanation.map((entry, i) => (
                        <Cell key={i} fill={entry.shap_value > 0 ? "#ef4444" : "#22c55e"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-500 inline-block"></span>
                    Increases fraud risk
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-green-500 inline-block"></span>
                    Decreases fraud risk
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
