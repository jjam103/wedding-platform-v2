'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, X, HelpCircle, Loader2 } from 'lucide-react';

interface RSVPItem {
  id: string;
  name: string;
  type: 'activity' | 'event' | 'accommodation';
  status: 'attending' | 'declined' | 'maybe' | 'pending';
  guestCount?: number;
  dietaryRestrictions?: string;
  capacity?: number;
  capacityRemaining?: number;
  requiresGuestCount?: boolean;
  requiresDietaryInfo?: boolean;
  date?: string;
  time?: string;
  location?: string;
}

interface RSVPSection {
  type: 'activities' | 'events' | 'accommodations';
  label: string;
  items: RSVPItem[];
}

interface InlineRSVPEditorProps {
  guestId: string;
  onUpdate?: () => void;
}

type RSVPStatus = 'attending' | 'declined' | 'maybe' | 'pending';

const STATUS_CYCLE: RSVPStatus[] = ['pending', 'attending', 'maybe', 'declined'];

const STATUS_CONFIG = {
  attending: {
    icon: Check,
    label: 'Attending',
    color: 'text-green-600 bg-green-50 border-green-200',
    hoverColor: 'hover:bg-green-100',
  },
  declined: {
    icon: X,
    label: 'Declined',
    color: 'text-red-600 bg-red-50 border-red-200',
    hoverColor: 'hover:bg-red-100',
  },
  maybe: {
    icon: HelpCircle,
    label: 'Maybe',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    hoverColor: 'hover:bg-yellow-100',
  },
  pending: {
    icon: () => <div className="w-4 h-4 border-2 border-gray-300 rounded" />,
    label: 'Pending',
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    hoverColor: 'hover:bg-gray-100',
  },
};

export function InlineRSVPEditor({ guestId, onUpdate }: InlineRSVPEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sections, setSections] = useState<RSVPSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Load RSVP data when component mounts or section expands
  useEffect(() => {
    if (guestId) {
      loadRSVPData();
    }
  }, [guestId]);

  const loadRSVPData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/guests/${guestId}/rsvps`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load RSVPs');
      }

      const data = result.data;
      const newSections: RSVPSection[] = [
        {
          type: 'activities',
          label: 'Activities',
          items: data.activities || [],
        },
        {
          type: 'events',
          label: 'Events',
          items: data.events || [],
        },
        {
          type: 'accommodations',
          label: 'Accommodations',
          items: data.accommodations || [],
        },
      ];

      setSections(newSections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RSVPs');
      console.error('Error loading RSVPs:', err);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  const toggleSection = useCallback((sectionType: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionType)) {
        next.delete(sectionType);
      } else {
        next.add(sectionType);
      }
      return next;
    });
  }, []);

  const getNextStatus = useCallback((currentStatus: RSVPStatus): RSVPStatus => {
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    return STATUS_CYCLE[nextIndex];
  }, []);

  const updateRSVPStatus = useCallback(
    async (item: RSVPItem, newStatus: RSVPStatus) => {
      // Check capacity constraints before allowing "attending" status
      if (newStatus === 'attending' && item.capacity !== undefined) {
        if (item.capacityRemaining === 0) {
          setError(`Cannot RSVP as attending - ${item.name} is at full capacity`);
          return;
        }
        if (
          item.capacityRemaining !== undefined &&
          item.capacity &&
          item.capacityRemaining / item.capacity < 0.1
        ) {
          // Show warning but allow
          console.warn(
            `Warning: ${item.name} is nearly full (${item.capacityRemaining} / ${item.capacity} spots remaining)`
          );
        }
      }

      // Optimistic UI update
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          items: section.items.map((i) =>
            i.id === item.id ? { ...i, status: newStatus } : i
          ),
        }))
      );

      // Mark item as saving
      setSavingItems((prev) => new Set(prev).add(item.id));
      setError(null);

      try {
        const response = await fetch(`/api/admin/guests/${guestId}/rsvps/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to update RSVP');
        }

        // Update with server response (includes updated capacity)
        setSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            items: section.items.map((i) =>
              i.id === item.id ? { ...i, ...result.data } : i
            ),
          }))
        );

        onUpdate?.();
      } catch (err) {
        // Rollback on error
        setSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            items: section.items.map((i) =>
              i.id === item.id ? { ...i, status: item.status } : i
            ),
          }))
        );
        setError(err instanceof Error ? err.message : 'Failed to update RSVP');
        console.error('Error updating RSVP:', err);
      } finally {
        setSavingItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [guestId, onUpdate]
  );

  const updateGuestCount = useCallback(
    async (item: RSVPItem, guestCount: number) => {
      // Optimistic UI update
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          items: section.items.map((i) =>
            i.id === item.id ? { ...i, guestCount } : i
          ),
        }))
      );

      setSavingItems((prev) => new Set(prev).add(item.id));
      setError(null);

      try {
        const response = await fetch(`/api/admin/guests/${guestId}/rsvps/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestCount }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to update guest count');
        }

        onUpdate?.();
      } catch (err) {
        // Rollback on error
        setSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            items: section.items.map((i) =>
              i.id === item.id ? { ...i, guestCount: item.guestCount } : i
            ),
          }))
        );
        setError(err instanceof Error ? err.message : 'Failed to update guest count');
        console.error('Error updating guest count:', err);
      } finally {
        setSavingItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [guestId, onUpdate]
  );

  const updateDietaryRestrictions = useCallback(
    async (item: RSVPItem, dietaryRestrictions: string) => {
      // Optimistic UI update
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          items: section.items.map((i) =>
            i.id === item.id ? { ...i, dietaryRestrictions } : i
          ),
        }))
      );

      setSavingItems((prev) => new Set(prev).add(item.id));
      setError(null);

      try {
        const response = await fetch(`/api/admin/guests/${guestId}/rsvps/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dietaryRestrictions }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to update dietary restrictions');
        }

        onUpdate?.();
      } catch (err) {
        // Rollback on error
        setSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            items: section.items.map((i) =>
              i.id === item.id
                ? { ...i, dietaryRestrictions: item.dietaryRestrictions }
                : i
            ),
          }))
        );
        setError(
          err instanceof Error ? err.message : 'Failed to update dietary restrictions'
        );
        console.error('Error updating dietary restrictions:', err);
      } finally {
        setSavingItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [guestId, onUpdate]
  );

  const renderStatusButton = useCallback(
    (item: RSVPItem) => {
      const config = STATUS_CONFIG[item.status];
      const IconComponent = config.icon;
      const isSaving = savingItems.has(item.id);

      return (
        <button
          type="button"
          onClick={() => updateRSVPStatus(item, getNextStatus(item.status))}
          disabled={isSaving}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${config.color} ${config.hoverColor} disabled:opacity-50 disabled:cursor-not-allowed`}
          title={`Click to change status (currently: ${config.label})`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <IconComponent className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">{config.label}</span>
        </button>
      );
    },
    [savingItems, updateRSVPStatus, getNextStatus]
  );

  const renderCapacityInfo = useCallback((item: RSVPItem) => {
    if (item.capacity === undefined) return null;

    const remaining = item.capacityRemaining ?? 0;
    const total = item.capacity;
    const percentage = (remaining / total) * 100;

    let colorClass = 'text-green-600';
    if (percentage < 10) {
      colorClass = 'text-red-600';
    } else if (percentage < 25) {
      colorClass = 'text-yellow-600';
    }

    return (
      <div className={`text-sm ${colorClass}`}>
        {remaining} / {total} spots remaining
        {percentage < 10 && remaining > 0 && (
          <span className="ml-2 text-xs font-semibold">⚠️ Nearly Full</span>
        )}
        {remaining === 0 && (
          <span className="ml-2 text-xs font-semibold">🚫 Full</span>
        )}
      </div>
    );
  }, []);

  const renderRSVPItem = useCallback(
    (item: RSVPItem) => {
      const isSaving = savingItems.has(item.id);

      return (
        <div
          key={item.id}
          className="p-4 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              {item.date && (
                <p className="text-sm text-gray-600 mt-1">
                  {item.date}
                  {item.time && ` at ${item.time}`}
                  {item.location && ` • ${item.location}`}
                </p>
              )}
              {renderCapacityInfo(item)}
            </div>
            <div className="flex items-center gap-3">
              {renderStatusButton(item)}
              {isSaving && (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              )}
            </div>
          </div>

          {/* Guest Count Input */}
          {item.requiresGuestCount && item.status === 'attending' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Guests
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={item.guestCount || 1}
                onChange={(e) =>
                  updateGuestCount(item, parseInt(e.target.value, 10) || 1)
                }
                disabled={isSaving}
                className="w-24 px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          )}

          {/* Dietary Restrictions Input */}
          {item.requiresDietaryInfo && item.status === 'attending' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dietary Restrictions
              </label>
              <textarea
                value={item.dietaryRestrictions || ''}
                onChange={(e) => updateDietaryRestrictions(item, e.target.value)}
                disabled={isSaving}
                placeholder="e.g., vegetarian, gluten-free, allergies..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 resize-none"
              />
            </div>
          )}
        </div>
      );
    },
    [
      savingItems,
      renderStatusButton,
      renderCapacityInfo,
      updateGuestCount,
      updateDietaryRestrictions,
    ]
  );

  const renderSection = useCallback(
    (section: RSVPSection) => {
      const isExpanded = expandedSections.has(section.type);
      const itemCount = section.items.length;

      return (
        <div key={section.type} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection(section.type)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900">{section.label}</span>
              <span className="text-sm text-gray-600">({itemCount})</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {isExpanded && (
            <div className="p-4 space-y-3 bg-gray-50">
              {itemCount === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No {section.label.toLowerCase()} found
                </p>
              ) : (
                section.items.map(renderRSVPItem)
              )}
            </div>
          )}
        </div>
      );
    },
    [expandedSections, toggleSection, renderRSVPItem]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading RSVPs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {sections.map(renderSection)}
    </div>
  );
}
