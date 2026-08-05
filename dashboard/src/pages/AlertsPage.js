import { useState } from "react";
import { ShieldAlert, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { fraudAlerts } from "../data/mockData";

function ShapExplanation({ explanation }) {
  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">SHAP Explanation - Why was this flagged?</h4>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={explanation} layout="vertical" margin={{ left: 100 }}>
          <XAxis type="number" fontSize={11} />
          <YAxis type="category" dataKey="feature" fontSize={11} width={90} />
          <Tooltip
            formatter={(val) => val.toFixed(4)}
            labelFormatter={(label) => `Feature: ${label}`}
          />
          <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
            {explanation.map((entry, i) => (
              <Cell key={i} fill={entry.shap_value > 0 ? "#ef4444" : "#22c55e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Increases fraud risk
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Decreases fraud risk
        </span>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="text-red-500" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fraud Alerts</h2>
          <p className="text-sm text-gray-500">{fraudAlerts.length} transactions flagged by AI</p>
        </div>
      </div>

      <div className="space-y-3">
        {fraudAlerts.map((alert) => (
          <div key={alert.id} className="bg-white rounded-xl border border-red-200 overflow-hidden">
            {/* Alert Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-red-50/50 transition-colors"
              onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="text-red-500" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{alert.customer}</p>
                  <p className="text-sm text-gray-500">
                    {alert.merchant} | {alert.card} | {alert.city}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-800">Rs {alert.amount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{(alert.fraudProbability * 100).toFixed(0)}%</p>
                  <p className="text-xs text-red-500 font-medium">FRAUD RISK</p>
                </div>
                {expandedId === alert.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
            </div>

            {/* Expanded SHAP Explanation */}
            {expandedId === alert.id && (
              <div className="px-4 pb-4 border-t border-red-100">
                <ShapExplanation explanation={alert.shapExplanation} />
                <div className="mt-3 flex gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    {alert.id}
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    RPA Bot 1: Alert Sent
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    RPA Bot 2: Case Created
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
