'use client';

export default function MobileDataCard({
  title,
  subtitle,
  status,
  statusColor,
  metrics = [],
  actions = [],
  onClick,
  children,
}) {
  const statusColors = {
    success: 'bg-[rgba(27,107,69,0.1)] text-[#1B6B45]',
    warning: 'bg-[rgba(217,119,6,0.1)] text-[#D97706]',
    critical: 'bg-[rgba(220,53,69,0.1)] text-[#DC3545]',
    info: 'bg-[rgba(37,99,235,0.1)] text-[#2563EB]',
    neutral: 'bg-[rgba(140,129,120,0.1)] text-[#6B5D4F]',
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition-all duration-200 bg-white border-[#E8E2DB] hover:border-[#D4CBBC] shadow-sm ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold font-['Montserrat'] truncate text-[#2C2417]">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs mt-0.5 truncate text-[#6B5D4F]">
              {subtitle}
            </p>
          )}
        </div>
        {status && (
          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            statusColors[statusColor] || statusColors.neutral
          }`}>
            {status}
          </span>
        )}
      </div>

      {/* Metrics Row */}
      {metrics.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {metrics.map((metric, i) => (
            <div key={i}>
              <div className="text-[11px] text-[#8C8178]">
                {metric.label}
              </div>
              <div className={`text-sm font-semibold font-['JetBrains_Mono'] ${
                metric.color || 'text-[#2C2417]'
              }`}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom children */}
      {children}

      {/* Actions Row */}
      {actions.length > 0 && (
        <div className="mt-3 pt-3 flex gap-2 border-t border-[#F0EBE5]">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); action.onClick?.(); }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold font-['Montserrat'] transition-colors ${
                action.primary
                  ? 'bg-[#C4975A] text-white active:bg-[#A67B3D]'
                  : 'bg-[#FBF9F7] text-[#6B5D4F] active:bg-[#E8E2DB]'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
