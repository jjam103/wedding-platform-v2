import React from 'react';

export type StatusType = 
  | 'event-active'
  | 'event-inactive'
  | 'page-published'
  | 'page-draft'
  | 'payment-unpaid'
  | 'payment-partial'
  | 'payment-paid'
  | 'capacity-normal'
  | 'capacity-warning'
  | 'capacity-alert';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; colorClass: string }> = {
  'event-active': {
    label: 'Active',
    colorClass: 'bg-green-100 text-green-800 border-green-200',
  },
  'event-inactive': {
    label: 'Inactive',
    colorClass: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  'page-published': {
    label: 'Published',
    colorClass: 'bg-green-100 text-green-800 border-green-200',
  },
  'page-draft': {
    label: 'Draft',
    colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  'payment-unpaid': {
    label: 'UNPAID',
    colorClass: 'bg-red-100 text-red-800 border-red-200',
  },
  'payment-partial': {
    label: 'PARTIAL',
    colorClass: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  'payment-paid': {
    label: 'PAID',
    colorClass: 'bg-green-100 text-green-800 border-green-200',
  },
  'capacity-normal': {
    label: 'Available',
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  'capacity-warning': {
    label: 'Near Capacity',
    colorClass: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  'capacity-alert': {
    label: 'At Capacity',
    colorClass: 'bg-red-100 text-red-800 border-red-200',
  },
};

/**
 * StatusBadge component displays colored status indicators for various entity states.
 * 
 * @param status - The status type to display
 * @param className - Optional additional CSS classes
 * 
 * @example
 * <StatusBadge status="event-active" />
 * <StatusBadge status="payment-unpaid" />
 * <StatusBadge status="capacity-warning" />
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps): React.ReactElement {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.colorClass} ${className}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
