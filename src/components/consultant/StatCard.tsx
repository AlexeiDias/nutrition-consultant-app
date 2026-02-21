//src/app/consultant/StatCard.tsx
interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: 'green' | 'blue' | 'purple' | 'orange';
}

const colorMap = {
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
};

export default function StatCard({ label, value, icon, color = 'green' }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${colorMap[color]}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-75">{label}</p>
      </div>
    </div>
  );
}