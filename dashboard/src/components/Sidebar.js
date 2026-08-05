import { NavLink } from "react-router-dom";
import { LayoutDashboard, List, ShieldAlert, FolderOpen, Zap } from "lucide-react";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/predict", icon: Zap, label: "Check Transaction" },
  { to: "/transactions", icon: List, label: "Transactions" },
  { to: "/alerts", icon: ShieldAlert, label: "Fraud Alerts" },
  { to: "/cases", icon: FolderOpen, label: "Cases" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="text-red-400" size={24} />
          FraudGuard AI
        </h1>
        <p className="text-gray-400 text-xs mt-1">Fraud Detection & Prevention</p>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-700 text-xs text-gray-500">
        <p>XGBoost + SHAP</p>
        <p>Model Accuracy: 97.8%</p>
      </div>
    </aside>
  );
}
