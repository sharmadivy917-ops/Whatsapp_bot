export default function StatsCard({ title, value, icon: Icon, color, subtext }) {
  const colorClasses = {
    green: {
      bg: 'bg-primary-50',
      iconBg: 'bg-gradient-to-br from-primary-500 to-primary-700',
      text: 'text-primary-700',
    },
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-700',
      text: 'text-blue-700',
    },
    amber: {
      bg: 'bg-amber-50',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-700',
      text: 'text-amber-700',
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-700',
      text: 'text-purple-700',
    },
  };

  const scheme = colorClasses[color] || colorClasses.green;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold ${scheme.text}`}>{value}</p>
          {subtext && (
            <p className="text-xs text-gray-400 mt-1">{subtext}</p>
          )}
        </div>
        <div className={`${scheme.iconBg} p-3 rounded-xl shadow-md`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}
