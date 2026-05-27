export function InventoryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'actual' | 'locked' | 'available';
}) {
  return (
    <div className={`inventory-metric inventory-metric-${tone}`}>
      <div className="inventory-metric-label">{label}</div>
      <div className="inventory-metric-value">{value}</div>
    </div>
  );
}
