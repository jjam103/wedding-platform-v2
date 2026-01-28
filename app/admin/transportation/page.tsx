'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  flight_number?: string;
  arrival_time?: string;
  departure_time?: string;
  airport_code?: 'SJO' | 'LIR' | 'Other';
  shuttle_assignment?: string;
}

interface TimeWindow {
  start: string;
  end: string;
  guests: Guest[];
}

interface VehicleRequirement {
  vehicle_type: string;
  capacity: number;
  quantity_needed: number;
  estimated_cost: number;
}

interface TransportationPageProps {}

export default function TransportationPage({}: TransportationPageProps) {
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('arrivals');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedAirport, setSelectedAirport] = useState<string>('all');
  const [timeWindows, setTimeWindows] = useState<TimeWindow[]>([]);
  const [vehicleRequirements, setVehicleRequirements] = useState<VehicleRequirement[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch manifests when date, airport, or tab changes
  const fetchManifests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = activeTab === 'arrivals' 
        ? '/api/admin/transportation/arrivals'
        : '/api/admin/transportation/departures';
      
      const params = new URLSearchParams({
        date: selectedDate,
        ...(selectedAirport !== 'all' && { airport: selectedAirport }),
      });

      const response = await fetch(`${endpoint}?${params}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to fetch manifests');
        return;
      }

      // Group guests by time windows
      const windows = groupGuestsByTimeWindow(result.data.guests || []);
      setTimeWindows(windows);

      // Calculate vehicle requirements
      const totalGuests = result.data.guests?.length || 0;
      if (totalGuests > 0) {
        const vehicleResponse = await fetch(
          `/api/admin/transportation/vehicle-requirements?guestCount=${totalGuests}`
        );
        const vehicleResult = await vehicleResponse.json();
        
        if (vehicleResult.success) {
          setVehicleRequirements(vehicleResult.data);
          const cost = vehicleResult.data.reduce(
            (sum: number, req: VehicleRequirement) => sum + req.estimated_cost,
            0
          );
          setTotalCost(cost);
        }
      } else {
        setVehicleRequirements([]);
        setTotalCost(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedDate, selectedAirport]);

  useEffect(() => {
    fetchManifests();
  }, [fetchManifests]);

  // Group guests by 2-hour time windows
  const groupGuestsByTimeWindow = (guests: Guest[]): TimeWindow[] => {
    const windows = new Map<string, Guest[]>();
    const timeField = activeTab === 'arrivals' ? 'arrival_time' : 'departure_time';

    guests.forEach((guest) => {
      const time = guest[timeField];
      if (!time) return;

      // Parse hour from time string (HH:MM:SS)
      const hour = parseInt(time.split(':')[0], 10);
      const windowStart = Math.floor(hour / 2) * 2;
      const windowEnd = windowStart + 2;

      const windowKey = `${String(windowStart).padStart(2, '0')}:00 - ${String(windowEnd).padStart(2, '0')}:00`;

      if (!windows.has(windowKey)) {
        windows.set(windowKey, []);
      }
      windows.get(windowKey)!.push(guest);
    });

    // Convert to array and sort by time
    return Array.from(windows.entries())
      .map(([timeRange, guests]) => {
        const [start, end] = timeRange.split(' - ');
        return { start, end, guests };
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  };

  const handleAssignShuttle = async (guestId: string, shuttleName: string) => {
    try {
      const response = await fetch('/api/admin/transportation/assign-shuttle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, shuttleName }),
      });

      const result = await response.json();
      if (result.success) {
        fetchManifests(); // Refresh data
      } else {
        setError(result.error?.message || 'Failed to assign shuttle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleGenerateDriverSheets = async () => {
    try {
      const response = await fetch('/api/admin/transportation/driver-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, type: activeTab }),
      });

      const result = await response.json();
      if (result.success) {
        // Open driver sheets in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.data.html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        setError(result.error?.message || 'Failed to generate driver sheets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handlePrintManifest = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transportation Management</h1>
        <div className="flex gap-2">
          <Button onClick={handleGenerateDriverSheets} variant="secondary">
            Generate Driver Sheets
          </Button>
          <Button onClick={handlePrintManifest} variant="secondary">
            Print Manifest
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('arrivals')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'arrivals'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Arrivals
        </button>
        <button
          onClick={() => setActiveTab('departures')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'departures'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Departures
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="date-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="airport-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Airport
            </label>
            <select
              id="airport-filter"
              value={selectedAirport}
              onChange={(e) => setSelectedAirport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Airports</option>
              <option value="SJO">SJO - San José</option>
              <option value="LIR">LIR - Liberia</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading manifests...</p>
        </div>
      )}

      {/* Time Windows */}
      {!loading && timeWindows.length === 0 && (
        <Card className="p-8 text-center text-gray-500">
          No guests scheduled for {activeTab} on {selectedDate}
        </Card>
      )}

      {!loading && timeWindows.map((window, index) => (
        <Card key={index} className="p-4">
          <h3 className="text-lg font-semibold mb-4">
            {window.start} - {window.end} ({window.guests.length} guests)
          </h3>
          
          <DataTable
            data={window.guests}
            columns={[
              {
                key: 'name',
                label: 'Guest Name',
                render: (guest: Guest) => `${guest.first_name} ${guest.last_name}`,
              },
              {
                key: 'flight_number',
                label: 'Flight',
                render: (guest: Guest) => guest.flight_number || '-',
              },
              {
                key: 'time',
                label: 'Time',
                render: (guest: Guest) => {
                  const time = activeTab === 'arrivals' 
                    ? guest.arrival_time 
                    : guest.departure_time;
                  return time ? time.substring(0, 5) : '-';
                },
              },
              {
                key: 'airport_code',
                label: 'Airport',
                render: (guest: Guest) => guest.airport_code || '-',
              },
              {
                key: 'shuttle',
                label: 'Shuttle',
                render: (guest: Guest) => (
                  <input
                    type="text"
                    value={guest.shuttle_assignment || ''}
                    onChange={(e) => handleAssignShuttle(guest.id, e.target.value)}
                    placeholder="Assign shuttle"
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ),
              },
            ]}
          />
        </Card>
      ))}

      {/* Vehicle Requirements */}
      {!loading && vehicleRequirements.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Vehicle Requirements</h3>
          <div className="space-y-2">
            {vehicleRequirements.map((req, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700">
                  {req.quantity_needed} × {req.vehicle_type} ({req.capacity} passengers each)
                </span>
                <span className="font-medium">${req.estimated_cost}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
              <span>Total Cost:</span>
              <span>${totalCost}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
