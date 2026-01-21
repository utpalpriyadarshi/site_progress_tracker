/**
 * Commercial Dashboard Widgets
 *
 * Interactive KPI widgets for the commercial dashboard.
 */

// Base widget component
export { BaseWidget } from './BaseWidget';
export type { BaseWidgetProps } from './BaseWidget';

// Trend indicator
export { TrendIndicator } from './TrendIndicator';
export type { TrendIndicatorProps, TrendFormat } from './TrendIndicator';

// Period selector
export { PeriodSelector, getPeriodDateRange, formatPeriodLabel } from './PeriodSelector';
export type { PeriodSelectorProps, Period, PeriodOption } from './PeriodSelector';

// Financial KPI Widgets
export { BudgetHealthWidget } from './BudgetHealthWidget';
export type { BudgetHealthWidgetProps } from './BudgetHealthWidget';

export { CashFlowWidget } from './CashFlowWidget';
export type { CashFlowWidgetProps } from './CashFlowWidget';

export { InvoiceStatusWidget } from './InvoiceStatusWidget';
export type { InvoiceStatusWidgetProps, InvoiceStatus } from './InvoiceStatusWidget';

export { CategorySpendingWidget } from './CategorySpendingWidget';
export type { CategorySpendingWidgetProps, CategorySpendingData } from './CategorySpendingWidget';

export { RecentTransactionsWidget } from './RecentTransactionsWidget';
export type {
  RecentTransactionsWidgetProps,
  Transaction,
  TransactionType,
} from './RecentTransactionsWidget';
