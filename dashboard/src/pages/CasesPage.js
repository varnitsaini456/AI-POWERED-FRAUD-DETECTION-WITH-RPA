import { useState } from "react";
import { FolderOpen, AlertCircle, Search as SearchIcon, Clock } from "lucide-react";
import { mockCases } from "../data/mockData";

const STATUS_STYLE = {
  open: { bg: "bg-red-100 text-red-700", label: "Open" },
  investigating: { bg: "bg-yellow-100 text-yellow-700", label: "Investigating" },
  resolved: { bg: "bg-green-100 text-green-700", label: "Resolved" },
};

export default function CasesPage() {
  const [cases, setCases] = useState(mockCases);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filtered = cases.filter((c) => filterStatus === "ALL" || c.status === filterStatus);

  const updateStatus = (caseId, newStatus) => {
    setCases((prev) =>
      prev.map((c) => (c.id === caseId ? { ...c, status: newStatus } : c))
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="text-blue-600" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Case Management</h2>
            <p className="text-sm text-gray-500">{cases.length} cases from RPA Bot 2</p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2">
          {["ALL", "open", "investigating", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "ALL" ? "All" : STATUS_STYLE[status].label}
              <span className="ml-1.5 opacity-70">
                ({status === "ALL" ? cases.length : cases.filter((c) => c.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-sm font-bold text-gray-700">{c.id}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[c.status].bg}`}>
                {STATUS_STYLE[c.status].label}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Customer</span>
                <span className="text-sm font-medium">{c.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount</span>
                <span className="text-sm font-bold text-red-600">Rs {c.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Fraud Score</span>
                <span className="text-sm font-bold text-red-600">{(c.fraudProbability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Assigned</span>
                <span className="text-sm text-blue-600">{c.assignedTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Transaction</span>
                <span className="text-sm font-mono">{c.transactionId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Created</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(c.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {c.status === "open" && (
                <button
                  onClick={() => updateStatus(c.id, "investigating")}
                  className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg text-xs font-medium hover:bg-yellow-600 transition-colors"
                >
                  Start Investigation
                </button>
              )}
              {c.status === "investigating" && (
                <button
                  onClick={() => updateStatus(c.id, "resolved")}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                >
                  Mark Resolved
                </button>
              )}
              {c.status === "resolved" && (
                <span className="flex-1 text-center py-2 text-green-600 text-xs font-medium">
                  Case Closed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
