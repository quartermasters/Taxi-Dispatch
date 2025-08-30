// © 2025 Quartermasters FZC. All rights reserved.

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type?: 'trip' | 'driver';
  className?: string;
}

export function StatusBadge({ status, type = 'trip', className }: StatusBadgeProps) {
  const getStatusClass = () => {
    if (type === 'driver') {
      switch (status) {
        case 'idle':
        case 'online':
          return 'driver-online';
        case 'offline':
          return 'driver-offline';
        case 'busy':
          return 'driver-busy';
        default:
          return 'status-requested';
      }
    } else {
      switch (status) {
        case 'requested':
          return 'status-requested';
        case 'assigned':
          return 'status-assigned';
        case 'enroute':
          return 'status-enroute';
        case 'arrived':
          return 'status-arrived';
        case 'ongoing':
          return 'status-ongoing';
        case 'completed':
          return 'status-completed';
        case 'cancelled':
          return 'status-cancelled';
        default:
          return 'status-requested';
      }
    }
  };

  const getStatusIcon = () => {
    if (type === 'driver') {
      switch (status) {
        case 'idle':
        case 'online':
          return 'fas fa-circle text-green-500';
        case 'offline':
          return 'fas fa-circle text-gray-400';
        case 'busy':
          return 'fas fa-car text-blue-500';
        default:
          return 'fas fa-question-circle';
      }
    } else {
      switch (status) {
        case 'requested':
          return 'fas fa-clock';
        case 'assigned':
          return 'fas fa-user-check';
        case 'enroute':
          return 'fas fa-route';
        case 'arrived':
          return 'fas fa-map-marker-alt';
        case 'ongoing':
          return 'fas fa-car-side';
        case 'completed':
          return 'fas fa-check-circle';
        case 'cancelled':
          return 'fas fa-times-circle';
        default:
          return 'fas fa-circle';
      }
    }
  };

  const getDisplayText = () => {
    if (type === 'driver') {
      switch (status) {
        case 'idle':
          return 'Available';
        case 'online':
          return 'Online';
        case 'offline':
          return 'Offline';
        case 'busy':
          return 'On Trip';
        default:
          return status;
      }
    } else {
      switch (status) {
        case 'enroute':
          return 'En Route';
        case 'ongoing':
          return 'In Progress';
        default:
          return status.charAt(0).toUpperCase() + status.slice(1);
      }
    }
  };

  return (
    <span className={cn("status-badge", getStatusClass(), className)}>
      <i className={`${getStatusIcon()} text-xs`}></i>
      {getDisplayText()}
    </span>
  );
}
