'use client';

export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E8E2DB]">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-[#FAF8F5] border-b border-[#E8E2DB]">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1 h-4 rounded bg-[#E8E2DB] animate-pulse" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div
          key={row}
          className="flex gap-4 px-4 py-3 border-b border-[#F0EBE5] last:border-0"
        >
          {Array.from({ length: columns }).map((_, col) => (
            <div
              key={col}
              className="flex-1 h-4 rounded animate-pulse"
              style={{
                backgroundColor: '#E8E2DB',
                opacity: 0.6 + Math.random() * 0.4,
                width: `${60 + Math.random() * 40}%`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
