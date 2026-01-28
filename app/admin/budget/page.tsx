'use client';

import { useState, useEffect, useCallback } from 'react';
import BudgetDashboard from '@/components/admin/BudgetDashboard';
import type { Vendor } from '@/schemas/vendorSchemas';
import type { Activity } from '@/schemas/activitySchemas';
import type { Accommodation } from '@/schemas/accommodationSchemas';
import type { BudgetBreakdown, PaymentStatusReport, SubsidyTracking } from '@/schemas/budgetSchemas';

/**
 * Budget Dashboard Page
 * 
 * Displays comprehensive budget overview including:
 * - Total cost, host contribution, guest payments, balance due
 * - Vendor payment tracking table
 * - Individual guest subsidies
 * - Real-time recalculation
 * 
 * Requirements: 11.1-11.8
 */
export default function BudgetPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [paymentStatusReport, setPaymentStatusReport] = useState<PaymentStatusReport | null>(null);
  const [subsidyTracking, setSubsidyTracking] = useState<SubsidyTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all budget data
  const fetchBudgetData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch vendors
      const vendorsResponse = await fetch('/api/admin/vendors?pageSize=1000');
      const vendorsData = await vendorsResponse.json();
      if (!vendorsResponse.ok || !vendorsData.success) {
        throw new Error(vendorsData.error?.message || 'Failed to fetch vendors');
      }
      setVendors(vendorsData.data.vendors);

      // Fetch activities
      const activitiesResponse = await fetch('/api/admin/activities?pageSize=1000');
      const activitiesData = await activitiesResponse.json();
      if (!activitiesResponse.ok || !activitiesData.success) {
        throw new Error(activitiesData.error?.message || 'Failed to fetch activities');
      }
      setActivities(activitiesData.data.activities);

      // Fetch accommodations
      const accommodationsResponse = await fetch('/api/admin/accommodations?page=1&pageSize=1000');
      const accommodationsData = await accommodationsResponse.json();
      if (!accommodationsResponse.ok || !accommodationsData.success) {
        throw new Error(accommodationsData.error?.message || 'Failed to fetch accommodations');
      }
      setAccommodations(accommodationsData.data.accommodations);

      // Fetch budget breakdown
      const breakdownResponse = await fetch('/api/admin/budget/breakdown');
      const breakdownData = await breakdownResponse.json();
      if (!breakdownResponse.ok || !breakdownData.success) {
        throw new Error(breakdownData.error?.message || 'Failed to fetch budget breakdown');
      }
      setBudgetBreakdown(breakdownData.data);

      // Fetch payment status report
      const paymentResponse = await fetch('/api/admin/budget/payment-status');
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok || !paymentData.success) {
        throw new Error(paymentData.error?.message || 'Failed to fetch payment status');
      }
      setPaymentStatusReport(paymentData.data);

      // Fetch subsidy tracking
      const subsidyResponse = await fetch('/api/admin/budget/subsidies');
      const subsidyData = await subsidyResponse.json();
      if (!subsidyResponse.ok || !subsidyData.success) {
        throw new Error(subsidyData.error?.message || 'Failed to fetch subsidy tracking');
      }
      setSubsidyTracking(subsidyData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBudgetData();
  }, [fetchBudgetData]);

  // Real-time recalculation - refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBudgetData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBudgetData]);

  if (loading && !budgetBreakdown) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-sage-900">Budget Dashboard</h1>
          <p className="text-sage-600 mt-2">
            Track wedding expenses, vendor payments, and budget allocations
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-sage-600">Loading budget data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-sage-900">Budget Dashboard</h1>
          <p className="text-sage-600 mt-2">
            Track wedding expenses, vendor payments, and budget allocations
          </p>
        </div>
        <div className="bg-volcano-50 border border-volcano-200 rounded-lg p-4">
          <p className="text-volcano-900">Error loading budget data: {error}</p>
          <button
            onClick={fetchBudgetData}
            className="mt-2 px-4 py-2 bg-volcano-600 text-white rounded hover:bg-volcano-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Budget Dashboard</h1>
          <p className="text-sage-600 mt-2">
            Track wedding expenses, vendor payments, and budget allocations
          </p>
        </div>
        <button
          onClick={fetchBudgetData}
          disabled={loading}
          className="px-4 py-2 bg-jungle-600 text-white rounded hover:bg-jungle-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <BudgetDashboard
        vendors={vendors}
        activities={activities}
        accommodations={accommodations}
        budgetBreakdown={budgetBreakdown}
        paymentStatusReport={paymentStatusReport}
        subsidyTracking={subsidyTracking}
        onRefresh={fetchBudgetData}
      />
    </div>
  );
}
