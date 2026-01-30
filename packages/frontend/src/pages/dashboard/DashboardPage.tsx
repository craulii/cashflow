import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardBody, PageLoader } from '../../components/ui';
import { SummaryCard, RecentTransactions } from '../../components/dashboard';
import { ExpensesPieChart, IncomeExpenseBarChart } from '../../components/charts';
import { useDashboard, useComparison, useTrends } from '../../hooks';

export function DashboardPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const { data: comparison, isLoading: comparisonLoading } = useComparison(6);
  const { data: trends } = useTrends(6);

  if (dashboardLoading || comparisonLoading) {
    return <PageLoader />;
  }

  const expensesChartData = dashboard?.expensesByCategory.map((item) => ({
    name: item.category?.name || 'Sin categoria',
    value: item.total,
    color: item.category?.color || '#9ca3af',
  })) || [];

  const barChartData = comparison?.map((item) => ({
    name: item.monthName,
    income: item.income,
    expenses: item.expenses,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen de tu economia</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Ingresos del mes"
          value={dashboard?.summary.income || 0}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          variant="success"
          trend={trends?.trends.income}
        />
        <SummaryCard
          title="Gastos del mes"
          value={dashboard?.summary.expenses || 0}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          variant="danger"
          trend={trends?.trends.expenses}
        />
        <SummaryCard
          title="Balance"
          value={dashboard?.summary.balance || 0}
          icon={<Wallet className="h-5 w-5 text-blue-600" />}
          variant={dashboard?.summary.balance && dashboard.summary.balance >= 0 ? 'success' : 'danger'}
        />
        <SummaryCard
          title="Deuda total"
          value={dashboard?.summary.totalDebt || 0}
          icon={<CreditCard className="h-5 w-5 text-orange-600" />}
          variant="warning"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Gastos por categoria
            </h2>
          </CardHeader>
          <CardBody>
            <ExpensesPieChart data={expensesChartData} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Ingresos vs Gastos
            </h2>
          </CardHeader>
          <CardBody>
            <IncomeExpenseBarChart data={barChartData} />
          </CardBody>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Transacciones recientes
          </h2>
        </CardHeader>
        <CardBody>
          <RecentTransactions transactions={dashboard?.recentTransactions || []} />
        </CardBody>
      </Card>
    </div>
  );
}
