import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDateShort } from '../../utils/format';
import { cn } from '../../utils/cn';
import type { RecentTransaction } from '../../api/analytics';

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay transacciones recientes
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={cn(
                'p-2 rounded-lg mr-3',
                transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
              )}
            >
              {transaction.type === 'income' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {transaction.description}
              </p>
              <p className="text-xs text-gray-500">
                {transaction.category?.name || 'Sin categoria'} - {formatDateShort(transaction.date)}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'text-sm font-semibold',
              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
            )}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
