const VARIANTS: Record<string, string> = {
  approved:   'bg-green-100 text-green-700',
  active:     'bg-green-100 text-green-700',
  success:    'bg-green-100 text-green-700',
  verified:   'bg-green-100 text-green-700',
  pending:    'bg-yellow-100 text-yellow-700',
  submitted:  'bg-yellow-100 text-yellow-700',
  in_review:  'bg-yellow-100 text-yellow-700',
  escalated:  'bg-orange-100 text-orange-700',
  rejected:   'bg-red-100 text-red-700',
  suspended:  'bg-red-100 text-red-700',
  failed:     'bg-red-100 text-red-700',
  landlord:   'bg-blue-100 text-blue-700',
  tenant:     'bg-purple-100 text-purple-700',
  admin:      'bg-gray-100 text-gray-700',
};

export default function Badge({ label }: { label: string }) {
  const cls = VARIANTS[label?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  );
}
