export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/guest/SectionRenderer';
import { listSections } from '@/services/sectionsService';
import { getBySlug, get } from '@/services/activityService';

interface ActivityPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Activity Details Page
 * 
 * Displays activity information with sections:
 * - Activity name, description, time, location
 * - Custom sections with rich text, photos, and references
 * - RSVP information and capacity
 * 
 * Requirements: 
 * - 4.2 (E2E Critical Path Testing - section management flow)
 * - 24.10 (Slug Management - slug-based routing for activities)
 * 
 * This route uses [slug] for URL-friendly routing.
 * Backward compatibility: UUID-based URLs redirect to slug-based URLs.
 */
export default async function ActivityPage({ params }: ActivityPageProps) {
  // Next.js 15: params is a Promise
  const { slug } = await params;
  
  // Determine if the parameter is a UUID (legacy) or slug (new)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  let activity;
  
  if (isUUID) {
    // Legacy UUID-based URL - fetch by ID
    const activityResult = await get(slug);
    
    if (!activityResult.success) {
      notFound();
    }
    
    activity = activityResult.data;
    
    // Redirect to slug-based URL if slug exists and is different
    if (activity.slug && activity.slug !== slug) {
      redirect(`/activity/${activity.slug}`);
    }
    
    // Continue rendering with UUID if no slug exists
  } else {
    // New slug-based URL - fetch by slug
    const activityResult = await getBySlug(slug);
    
    if (!activityResult.success) {
      notFound();
    }
    
    activity = activityResult.data;
  }
  
  // Fetch sections for this activity
  const sectionsResult = await listSections('activity', activity.id);
  const sections = sectionsResult.success ? sectionsResult.data : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Activity Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-jungle-800 mb-4">
            {activity.name}
          </h1>
          
          {/* Activity Details */}
          <div className="space-y-3 text-sage-700">
            {activity.activityType && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type:</span>
                <span className="px-3 py-1 bg-sage-100 text-sage-800 rounded-full text-sm">
                  {activity.activityType}
                </span>
              </div>
            )}
            
            {activity.startTime && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Time:</span>
                <span>{new Date(activity.startTime).toLocaleString()}</span>
              </div>
            )}
            
            {activity.locationId && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Location:</span>
                <span>Location details</span>
              </div>
            )}
            
            {activity.eventId && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Event:</span>
                <span>Event details</span>
              </div>
            )}
            
            {activity.capacity && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Capacity:</span>
                <span>{activity.capacity} guests</span>
              </div>
            )}
            
            {activity.costPerPerson !== undefined && activity.costPerPerson !== null && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Cost:</span>
                <span>${activity.costPerPerson} per person</span>
              </div>
            )}
          </div>
          
          {/* Activity Description */}
          {activity.description && (
            <div 
              className="mt-6 prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: activity.description }}
            />
          )}
        </div>
        
        {/* Sections */}
        {sections.length > 0 && (
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-lg p-8">
                <SectionRenderer section={section} />
              </div>
            ))}
          </div>
        )}
        
        {/* No Sections Message */}
        {sections.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-sage-600">
            <p>No additional information available for this activity.</p>
          </div>
        )}
      </div>
    </div>
  );
}
