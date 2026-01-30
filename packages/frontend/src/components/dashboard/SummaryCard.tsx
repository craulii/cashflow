import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatCurrency } from '../../utils/format';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
  variant?: 'default' | 'success' | 'danger' | 'warning';
}

export function SummaryCard({ title, value, icon, trend, variant = 'default' }: SummaryCardProps) {
  const variants = {
    default: 'bg-white',
    success: 'bg-green-50',
    danger: 'bg-red-50',
    warning: 'bg-yellow-50',
  };

  const textColors = {
    default: 'text-gray-900',
    success: 'text-green-700',
    danger: 'text-red-700',
    warning: 'text-yellow-700',
  };

  return (
    <div className={cn('rounded-lg shadow-md p-6', variants[variant])}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="p-2 rounded-lg bg-gray-100">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={cn('text-2xl font-bold', textColors[variant])}>
            {formatCurrency(value)}
          </p>
          {trend && (
            <div className="flex items-center mt-1">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {Math.abs(trend.percentage).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
