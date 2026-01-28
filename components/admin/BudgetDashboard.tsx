'use client';

import { useMemo } from 'react';
import type { Vendor } from '@/schemas/vendorSchemas';
import type { Activity } from '@/schemas/activitySchemas';
import type { Accommodation } from '@/schemas/accommodationSchemas';
import type { BudgetBreakdown, PaymentStatusReport, SubsidyTracking } from '@/schemas/budgetSchemas';
import { Card } from '@/components/ui/Card';

interface BudgetDashboardProps {
  vendors: Vendor[];
  activities: Activity[];
  accommodations: Accommodation[];
  budgetBreakdown: BudgetBreakdown | null;
  paymentStatusReport?: PaymentStatusReport | null;
  subsidyTracking?: SubsidyTracking | null;
  onRefresh?: () => void;
}

/**
 * Budget Dashboard Component
 * 
 * Displays comprehensive budget information including:
 * - Summary cards with key metrics
 * - Vendor costs by category
 * - Activity costs with subsidies
 * - Accommodation costs
 * - Visual charts and breakdowns
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export default function BudgetDashboard({
  vendors,
  activities,
  accommodations,
  budgetBreakdown,
  paymentStatusReport,
  subsidyTracking,
  onRefresh,
}: BudgetDashboardProps) {
  // Calculate vendor totals
  const vendorTotals = useMemo(() => {
    if (!vendors || !Array.isArray(vendors)) {
      return { total: 0, paid: 0, balance: 0 };
    }
    const total = vendors.reduce((sum, v) => sum + v.baseCost, 0);
    const paid = vendors.reduce((sum, v) => sum + v.amountPaid, 0);
    const balance = total - paid;
    return { total, paid, balance };
  }, [vendors]);

  // Calculate activity totals (with subsidies)
  const activityTotals = useMemo(() => {
    if (!activities || !Array.isArray(activities)) {
      return { totalCost: 0, totalSubsidy: 0, netCost: 0 };
    }
    
    let totalCost = 0;
    let totalSubsidy = 0;

    activities.forEach((activity) => {
      if (activity.costPerPerson) {
        // For now, estimate with capacity or use a default
        const estimatedAttendees = activity.capacity || 0;
        const cost = activity.costPerPerson * estimatedAttendees;
        const subsidy = (activity.hostSubsidy || 0) * estimatedAttendees;
        totalCost += cost;
        totalSubsidy += subsidy;
      }
    });

    return {
      totalCost,
      totalSubsidy,
      netCost: totalCost - totalSubsidy,
    };
  }, [activities]);

  // Calculate accommodation totals (placeholder for now)
  const accommodationTotals = useMemo(() => {
    return {
      totalCost: 0,
      totalSubsidy: 0,
      netCost: 0,
    };
  }, [accommodations]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const grossTotal = vendorTotals.total + activityTotals.totalCost + accommodationTotals.totalCost;
    const totalSubsidies = activityTotals.totalSubsidy + accommodationTotals.totalSubsidy;
    const netTotal = grossTotal - totalSubsidies;
    const totalPaid = vendorTotals.paid;
    const balanceDue = netTotal - totalPaid;

    return {
      grossTotal,
      totalSubsidies,
      netTotal,
      totalPaid,
      balanceDue,
    };
  }, [vendorTotals, activityTotals, accommodationTotals]);

  // Group vendors by category
  const vendorsByCategory = useMemo(() => {
    if (!vendors || !Array.isArray(vendors)) {
      return {};
    }
    const grouped: Record<string, Vendor[]> = {};
    vendors.forEach((vendor) => {
      if (!grouped[vendor.category]) {
        grouped[vendor.category] = [];
      }
      grouped[vendor.category].push(vendor);
    });
    return grouped;
  }, [vendors]);

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    return Object.entries(vendorsByCategory).map(([category, categoryVendors]) => {
      const total = categoryVendors.reduce((sum, v) => sum + v.baseCost, 0);
      const paid = categoryVendors.reduce((sum, v) => sum + v.amountPaid, 0);
      const balance = total - paid;
      return { category, total, paid, balance, count: categoryVendors.length };
    });
  }, [vendorsByCategory]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate percentage for progress bars
  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.min(100, Math.round((value / total) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm font-medium text-sage-600 mb-1">Total Budget</div>
          <div className="text-3xl font-bold text-sage-900">{formatCurrency(grandTotals.netTotal)}</div>
          <div className="text-xs text-sage-500 mt-1">
            Gross: {formatCurrency(grandTotals.grossTotal)}
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-sage-600 mb-1">Total Paid</div>
          <div className="text-3xl font-bold text-jungle-600">{formatCurrency(grandTotals.totalPaid)}</div>
          <div className="text-xs text-sage-500 mt-1">
            {calculatePercentage(grandTotals.totalPaid, grandTotals.netTotal)}% of budget
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-sage-600 mb-1">Balance Due</div>
          <div className="text-3xl font-bold text-volcano-600">{formatCurrency(grandTotals.balanceDue)}</div>
          <div className="text-xs text-sage-500 mt-1">
            {calculatePercentage(grandTotals.balanceDue, grandTotals.netTotal)}% remaining
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-medium text-sage-600 mb-1">Host Subsidies</div>
          <div className="text-3xl font-bold text-ocean-600">{formatCurrency(grandTotals.totalSubsidies)}</div>
          <div className="text-xs text-sage-500 mt-1">
            {calculatePercentage(grandTotals.totalSubsidies, grandTotals.grossTotal)}% of gross
          </div>
        </Card>
      </div>

      {/* Payment Progress Bar */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-sage-900 mb-4">Payment Progress</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-sage-600">
            <span>Paid: {formatCurrency(grandTotals.totalPaid)}</span>
            <span>Remaining: {formatCurrency(grandTotals.balanceDue)}</span>
          </div>
          <div className="w-full bg-sage-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-jungle-500 h-full transition-all duration-300"
              style={{ width: `${calculatePercentage(grandTotals.totalPaid, grandTotals.netTotal)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Vendor Costs by Category */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-sage-900 mb-4">Vendor Costs by Category</h2>
        <div className="space-y-4">
          {categoryTotals.length === 0 ? (
            <p className="text-sage-500 text-center py-8">No vendors added yet</p>
          ) : (
            categoryTotals.map(({ category, total, paid, balance, count }) => (
              <div key={category} className="border-b border-sage-200 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-sage-900 capitalize">
                      {category.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-sage-500">{count} vendor{count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sage-900">{formatCurrency(total)}</div>
                    <div className="text-sm text-sage-500">
                      Paid: {formatCurrency(paid)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-sage-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      balance > 0 ? 'bg-sunset-500' : 'bg-jungle-500'
                    }`}
                    style={{ width: `${calculatePercentage(paid, total)}%` }}
                  />
                </div>
                {balance > 0 && (
                  <div className="text-xs text-volcano-600 mt-1">
                    Balance: {formatCurrency(balance)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Activity Costs */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-sage-900 mb-4">Activity Costs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-sage-50 p-4 rounded-lg">
            <div className="text-sm text-sage-600 mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-sage-900">
              {formatCurrency(activityTotals.totalCost)}
            </div>
          </div>
          <div className="bg-ocean-50 p-4 rounded-lg">
            <div className="text-sm text-sage-600 mb-1">Host Subsidy</div>
            <div className="text-2xl font-bold text-ocean-600">
              {formatCurrency(activityTotals.totalSubsidy)}
            </div>
          </div>
          <div className="bg-jungle-50 p-4 rounded-lg">
            <div className="text-sm text-sage-600 mb-1">Guest Cost</div>
            <div className="text-2xl font-bold text-jungle-600">
              {formatCurrency(activityTotals.netCost)}
            </div>
          </div>
        </div>
        {!activities || activities.filter((a) => a.costPerPerson).length === 0 ? (
          <p className="text-sage-500 text-center py-4">No paid activities yet</p>
        ) : (
          <div className="space-y-2">
            {activities
              .filter((a) => a.costPerPerson)
              .map((activity) => {
                const estimatedAttendees = activity.capacity || 0;
                const totalCost = (activity.costPerPerson || 0) * estimatedAttendees;
                const totalSubsidy = (activity.hostSubsidy || 0) * estimatedAttendees;
                const guestCost = totalCost - totalSubsidy;

                return (
                  <div
                    key={activity.id}
                    className="flex justify-between items-center py-2 border-b border-sage-100 last:border-0"
                  >
                    <div>
                      <div className="font-medium text-sage-900">{activity.name}</div>
                      <div className="text-sm text-sage-500">
                        ${activity.costPerPerson}/person × {estimatedAttendees} guests
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sage-900">{formatCurrency(guestCost)}</div>
                      {totalSubsidy > 0 && (
                        <div className="text-xs text-ocean-600">
                          Subsidy: {formatCurrency(totalSubsidy)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Guest Contributions vs Host Subsidies */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-sage-900 mb-4">
          Guest Contributions vs Host Subsidies
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-sage-600 mb-2">Guest Contributions</div>
            <div className="text-3xl font-bold text-jungle-600 mb-2">
              {formatCurrency(activityTotals.netCost)}
            </div>
            <div className="text-sm text-sage-500">
              {calculatePercentage(activityTotals.netCost, activityTotals.totalCost)}% of activity costs
            </div>
          </div>
          <div>
            <div className="text-sm text-sage-600 mb-2">Host Subsidies</div>
            <div className="text-3xl font-bold text-ocean-600 mb-2">
              {formatCurrency(grandTotals.totalSubsidies)}
            </div>
            <div className="text-sm text-sage-500">
              {calculatePercentage(grandTotals.totalSubsidies, grandTotals.grossTotal)}% of total costs
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-sage-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-sage-600">Total Activity Budget</span>
            <span className="font-semibold text-sage-900">
              {formatCurrency(activityTotals.totalCost)}
            </span>
          </div>
        </div>
      </Card>

      {/* Category Breakdown Pie Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-sage-900 mb-4">Budget Breakdown by Category</h2>
        {categoryTotals.length === 0 ? (
          <p className="text-sage-500 text-center py-8">No budget data available</p>
        ) : (
          <div className="space-y-4">
            {/* Visual pie chart representation using stacked bars */}
            <div className="flex h-8 rounded-full overflow-hidden">
              {categoryTotals.map(({ category, total }, index) => {
                const percentage = calculatePercentage(total, vendorTotals.total);
                const colors = [
                  'bg-jungle-500',
                  'bg-ocean-500',
                  'bg-sunset-500',
                  'bg-volcano-500',
                  'bg-sage-500',
                ];
                const color = colors[index % colors.length];
                
                return percentage > 0 ? (
                  <div
                    key={category}
                    className={`${color} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                    title={`${category}: ${formatCurrency(total)} (${percentage}%)`}
                  />
                ) : null;
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoryTotals.map(({ category, total }, index) => {
                const percentage = calculatePercentage(total, vendorTotals.total);
                const colors = [
                  'bg-jungle-500',
                  'bg-ocean-500',
                  'bg-sunset-500',
                  'bg-volcano-500',
                  'bg-sage-500',
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={category} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-sage-900 truncate capitalize">
                        {category.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-sage-500">
                        {formatCurrency(total)} ({percentage}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Vendor Spending Bar Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-sage-900 mb-4">Top Vendor Spending</h2>
        {!vendors || vendors.length === 0 ? (
          <p className="text-sage-500 text-center py-8">No vendors added yet</p>
        ) : (
          <div className="space-y-3">
            {vendors
              .sort((a, b) => b.baseCost - a.baseCost)
              .slice(0, 10)
              .map((vendor) => {
                const percentage = calculatePercentage(vendor.baseCost, vendorTotals.total);
                const paidPercentage = calculatePercentage(vendor.amountPaid, vendor.baseCost);
                const isOverBudget = vendor.amountPaid > vendor.baseCost;

                return (
                  <div key={vendor.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sage-900 truncate">{vendor.name}</div>
                        <div className="text-xs text-sage-500 capitalize">
                          {vendor.category.replace(/_/g, ' ')}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`font-semibold ${isOverBudget ? 'text-volcano-600' : 'text-sage-900'}`}>
                          {formatCurrency(vendor.baseCost)}
                        </div>
                        <div className="text-xs text-sage-500">
                          {percentage}% of total
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full bg-sage-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isOverBudget ? 'bg-volcano-500' : 'bg-jungle-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                      {/* Show paid amount overlay */}
                      <div
                        className="absolute top-0 left-0 h-full bg-sage-700 opacity-50"
                        style={{ width: `${Math.min(percentage, (paidPercentage * percentage) / 100)}%` }}
                      />
                    </div>
                    {isOverBudget && (
                      <div className="text-xs text-volcano-600">
                        ⚠️ Over budget by {formatCurrency(vendor.amountPaid - vendor.baseCost)}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Budget Items Exceeding Planned Amounts */}
      {vendors && vendors.some((v) => v.amountPaid > v.baseCost) && (
        <Card className="p-6 border-volcano-200 bg-volcano-50">
          <h2 className="text-lg font-semibold text-volcano-900 mb-4">⚠️ Items Exceeding Budget</h2>
          <div className="space-y-2">
            {vendors
              .filter((v) => v.amountPaid > v.baseCost)
              .map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex justify-between items-center py-2 border-b border-volcano-200 last:border-0"
                >
                  <div>
                    <div className="font-medium text-volcano-900">{vendor.name}</div>
                    <div className="text-sm text-volcano-700 capitalize">
                      {vendor.category.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-volcano-900">
                      {formatCurrency(vendor.amountPaid)}
                    </div>
                    <div className="text-sm text-volcano-700">
                      Budget: {formatCurrency(vendor.baseCost)}
                    </div>
                    <div className="text-xs text-volcano-600">
                      Over by: {formatCurrency(vendor.amountPaid - vendor.baseCost)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Vendor Payment Tracking Table */}
      {paymentStatusReport && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-sage-900 mb-4">Vendor Payment Tracking</h2>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-volcano-50 p-4 rounded-lg">
              <div className="text-sm text-sage-600 mb-1">Unpaid</div>
              <div className="text-2xl font-bold text-volcano-600">
                {formatCurrency(paymentStatusReport.totalUnpaid)}
              </div>
              <div className="text-xs text-sage-500 mt-1">
                {paymentStatusReport.unpaidVendors?.length || 0} vendor{(paymentStatusReport.unpaidVendors?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-sunset-50 p-4 rounded-lg">
              <div className="text-sm text-sage-600 mb-1">Partially Paid</div>
              <div className="text-2xl font-bold text-sunset-600">
                {formatCurrency(paymentStatusReport.totalPartial)}
              </div>
              <div className="text-xs text-sage-500 mt-1">
                {paymentStatusReport.partiallyPaidVendors?.length || 0} vendor{(paymentStatusReport.partiallyPaidVendors?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-jungle-50 p-4 rounded-lg">
              <div className="text-sm text-sage-600 mb-1">Paid</div>
              <div className="text-2xl font-bold text-jungle-600">
                {formatCurrency(paymentStatusReport.totalPaid)}
              </div>
              <div className="text-xs text-sage-500 mt-1">
                {paymentStatusReport.paidVendors?.length || 0} vendor{(paymentStatusReport.paidVendors?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Unpaid Vendors */}
          {paymentStatusReport.unpaidVendors && paymentStatusReport.unpaidVendors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-volcano-900 mb-3">Unpaid Vendors</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Vendor</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Category</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Amount Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-200">
                    {paymentStatusReport.unpaidVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-sage-50">
                        <td className="px-4 py-3 text-sm text-sage-900">{vendor.name}</td>
                        <td className="px-4 py-3 text-sm text-sage-600 capitalize">
                          {vendor.category.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-volcano-600 text-right font-semibold">
                          {formatCurrency(vendor.baseCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Partially Paid Vendors */}
          {paymentStatusReport.partiallyPaidVendors && paymentStatusReport.partiallyPaidVendors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-sunset-900 mb-3">Partially Paid Vendors</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Vendor</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Category</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Total Cost</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Paid</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-200">
                    {paymentStatusReport.partiallyPaidVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-sage-50">
                        <td className="px-4 py-3 text-sm text-sage-900">{vendor.name}</td>
                        <td className="px-4 py-3 text-sm text-sage-600 capitalize">
                          {vendor.category.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-sage-900 text-right">
                          {formatCurrency(vendor.baseCost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-jungle-600 text-right">
                          {formatCurrency(vendor.amountPaid)}
                        </td>
                        <td className="px-4 py-3 text-sm text-sunset-600 text-right font-semibold">
                          {formatCurrency(vendor.balanceDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paid Vendors */}
          {paymentStatusReport.paidVendors && paymentStatusReport.paidVendors.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-jungle-900 mb-3">Paid Vendors</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Vendor</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Category</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-200">
                    {paymentStatusReport.paidVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-sage-50">
                        <td className="px-4 py-3 text-sm text-sage-900">{vendor.name}</td>
                        <td className="px-4 py-3 text-sm text-sage-600 capitalize">
                          {vendor.category.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm text-jungle-600 text-right font-semibold">
                          {formatCurrency(vendor.amountPaid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Individual Guest Subsidies */}
      {subsidyTracking && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-sage-900 mb-4">Individual Guest Subsidies</h2>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-ocean-50 p-4 rounded-lg">
              <div className="text-sm text-sage-600 mb-1">Activity Subsidies</div>
              <div className="text-2xl font-bold text-ocean-600">
                {formatCurrency(subsidyTracking.totalActivitySubsidies)}
              </div>
              <div className="text-xs text-sage-500 mt-1">
                {subsidyTracking.activitySubsidies.length} activit{subsidyTracking.activitySubsidies.length !== 1 ? 'ies' : 'y'}
              </div>
            </div>
            <div className="bg-ocean-50 p-4 rounded-lg">
              <div className="text-sm text-sage-600 mb-1">Accommodation Subsidies</div>
              <div className="text-2xl font-bold text-ocean-600">
                {formatCurrency(subsidyTracking.totalAccommodationSubsidies)}
              </div>
              <div className="text-xs text-sage-500 mt-1">
                {subsidyTracking.accommodationSubsidies.length} accommodation{subsidyTracking.accommodationSubsidies.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="bg-ocean-50 p-4 rounded-lg">
              <div className="text-sm text-sage-600 mb-1">Total Subsidies</div>
              <div className="text-2xl font-bold text-ocean-600">
                {formatCurrency(subsidyTracking.grandTotalSubsidies)}
              </div>
              <div className="text-xs text-sage-500 mt-1">
                Host contribution
              </div>
            </div>
          </div>

          {/* Activity Subsidies */}
          {subsidyTracking.activitySubsidies.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-semibold text-sage-900 mb-3">Activity Subsidies</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Activity</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Per Person</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Attendees</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Total Subsidy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-200">
                    {subsidyTracking.activitySubsidies.map((subsidy) => (
                      <tr key={subsidy.activityId} className="hover:bg-sage-50">
                        <td className="px-4 py-3 text-sm text-sage-900">{subsidy.activityName}</td>
                        <td className="px-4 py-3 text-sm text-sage-600 text-right">
                          {formatCurrency(subsidy.subsidyPerPerson)}
                        </td>
                        <td className="px-4 py-3 text-sm text-sage-600 text-right">
                          {subsidy.estimatedAttendees}
                        </td>
                        <td className="px-4 py-3 text-sm text-ocean-600 text-right font-semibold">
                          {formatCurrency(subsidy.totalSubsidy)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Accommodation Subsidies */}
          {subsidyTracking.accommodationSubsidies.length > 0 && (
            <div>
              <h3 className="text-md font-semibold text-sage-900 mb-3">Accommodation Subsidies</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sage-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Accommodation</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-sage-700">Room Type</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Per Night</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Nights</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-sage-700">Total Subsidy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-200">
                    {subsidyTracking.accommodationSubsidies.map((subsidy) => (
                      <tr key={subsidy.accommodationId} className="hover:bg-sage-50">
                        <td className="px-4 py-3 text-sm text-sage-900">{subsidy.accommodationName}</td>
                        <td className="px-4 py-3 text-sm text-sage-600">{subsidy.roomType}</td>
                        <td className="px-4 py-3 text-sm text-sage-600 text-right">
                          {formatCurrency(subsidy.subsidyPerNight)}
                        </td>
                        <td className="px-4 py-3 text-sm text-sage-600 text-right">
                          {subsidy.nights}
                        </td>
                        <td className="px-4 py-3 text-sm text-ocean-600 text-right font-semibold">
                          {formatCurrency(subsidy.totalSubsidy)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subsidyTracking.activitySubsidies.length === 0 && subsidyTracking.accommodationSubsidies.length === 0 && (
            <p className="text-sage-500 text-center py-8">No subsidies configured yet</p>
          )}
        </Card>
      )}
    </div>
  );
}
