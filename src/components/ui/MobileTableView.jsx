'use client';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileDataCard from './MobileDataCard';

export default function MobileTableView({
  data = [],
  columns = [],
  renderDesktopTable,
  mapRowToCard,
  emptyMessage = 'No data available',
  onRowClick,
}) {
  const { isMobile } = useIsMobile();

  if (!isMobile) {
    return renderDesktopTable ? renderDesktopTable() : null;
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[#8C8178]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((row, index) => {
        const cardProps = mapRowToCard(row, index);
        return (
          <MobileDataCard
            key={cardProps.key || index}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            {...cardProps}
          />
        );
      })}
    </div>
  );
}
