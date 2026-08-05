import { Activity, ShieldAlert, IndianRupee, ShieldCheck, Clock, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import StatCard from "../components/StatCard";
import { dashboardStats, mockTransactions, fraudAlerts } from "../data/mockData";

const RISK_COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };

export default function DashboardPage() {
  // Risk distribution for pie chart
  const riskData = [
    { name: "HIGH", value: mockTransactions.filter((t) => t.riskLevel === "HIGH").length },
    { name: "MEDIUM", value: mockTransactions.filter((t) => t.riskLevel === "MEDIUM").length },
    { name: "LOW", value: mockTransactions.filter((t) => t.riskLevel === "LOW").length },
  ];

  // Daily fraud trend (last 7 days)
  const dailyTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const dayTxns = mockTransactions.filter((t) => {
      const txnDate = new Date(t.timestamp);
      return txnDate.toDateString() === date.toDateString();
    });
    dailyTrend.push({
      date: dateStr,
      total: dayTxns.length,
      fraud: dayTxns.filter((t) => t.isFraud).length,
    });
  }

  // Case status for bar chart
  const caseData = [
    { name: "Open", count: dashboardStats.casesOpen, fill: "#ef4444" },
    { name: "Investigating", count: dashboardStats.casesInvestigating, fill: "#f59e0b" },
    { name: "Resolved", count: dashboardStats.casesResolved, fill: "#22c55e" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Transactions" value={dashboardStats.totalTransactions} subtitle="Last 7 days" icon={Activity} color="blue" />
        <StatCard title="Fraud Detected" value={dashboardStats.totalFraud} subtitle={`${dashboardStats.fraudRate}% fraud rate`} icon={ShieldAlert} color="red" />
        <StatCard title="Amount Blocked" value={`Rs ${Number(dashboardStats.blockedAmount).toLocaleString("en-IN")}`} subtitle="Prevented losses" icon={IndianRupee} color="green" />
        <StatCard title="Cases Open" value={dashboardStats.casesOpen} subtitle={`${dashboardStats.casesInvestigating} investigating`} icon={Clock} color="yellow" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Transaction Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Transaction Trend (7 days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} name="Fraud" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={RISK_COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Case Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={caseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {caseData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={18} />
            Recent Fraud Alerts
          </h3>
          <div className="space-y-3">
            {fraudAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="font-medium text-gray-800">{alert.customer}</p>
                  <p className="text-xs text-gray-500">{alert.merchant} - {alert.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">Rs {alert.amount.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-red-500">{(alert.fraudProbability * 100).toFixed(1)}% fraud</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
