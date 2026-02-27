interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  accentColor?: "blue" | "green" | "amber" | "red";
}

const accentMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-600 text-white",
    border: "border-blue-100",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    border: "border-emerald-100",
    text: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-500 text-white",
    border: "border-amber-100",
    text: "text-amber-600",
  },
  red: {
    bg: "bg-red-50",
    icon: "bg-red-600 text-white",
    border: "border-red-100",
    text: "text-red-600",
  },
};

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  accentColor = "blue",
}: StatCardProps) {
  const colors = accentMap[accentColor];

  return (
    <div className={`bg-white rounded-xl border ${colors.border} shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon} shadow-sm`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1">
          <span
            className={`text-xs font-semibold ${
              trend.positive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-xs text-slate-400">vs. mes anterior</span>
        </div>
      )}
    </div>
  );
}
