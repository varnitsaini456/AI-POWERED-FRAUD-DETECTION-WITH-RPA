import { useState } from "react";
import { Search } from "lucide-react";
import { mockTransactions } from "../data/mockData";

const RISK_BADGE = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("ALL");

  const filtered = mockTransactions.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.customer.toLowerCase().includes(search.toLowerCase()) ||
      t.merchant.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = filterRisk === "ALL" || t.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Transactions</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID, customer, or merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="ALL">All Risk Levels</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Transaction ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Merchant</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Card</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Fraud Score</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Risk</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.slice(0, 50).map((t) => (
                <tr key={t.id} className={`hover:bg-gray-50 ${t.isFraud ? "bg-red-50/50" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                  <td className="px-4 py-3">{t.customer}</td>
                  <td className="px-4 py-3 text-gray-600">{t.merchant}</td>
                  <td className="px-4 py-3 text-right font-medium">Rs {t.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{t.card}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono font-bold ${t.fraudProbability > 0.5 ? "text-red-600" : "text-green-600"}`}>
                      {(t.fraudProbability * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${RISK_BADGE[t.riskLevel]}`}>
                      {t.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(t.timestamp).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500 border-t">
          Showing {Math.min(50, filtered.length)} of {filtered.length} transactions
        </div>
      </div>
    </div>
  );
}
