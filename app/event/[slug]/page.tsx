export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/guest/SectionRenderer';
import { listSections } from '@/services/sectionsService';
import { getBySlug, get } from '@/services/eventService';
import { get as getLocation } from '@/services/locationService';
import { list as listActivities } from '@/services/activityService';

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Event Details Page
 * 
 * Displays event information with sections:
 * - Event name, description, dates, location
 * - Related activities
 * - Custom sections with rich text, photos, and references
 * - RSVP information and deadline
 * 
 * Requirements: 
 * - 4.2 (E2E Critical Path Testing - section management flow)
 * - 24.10 (Slug Management - slug-based routing for events)
 * 
 * This route uses [slug] for URL-friendly routing.
 * Backward compatibility: UUID-based URLs redirect to slug-based URLs.
 */
export default async function EventPage({ params }: EventPageProps) {
  // Next.js 15: params is a Promise
  const { slug } = await params;
  
  // Determine if the parameter is a UUID (legacy) or slug (new)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  let event;
  
  if (isUUID) {
    // Legacy UUID-based URL - fetch by ID
    const eventResult = await get(slug);
    
    if (!eventResult.success) {
      notFound();
    }
    
    event = eventResult.data;
    
    // Redirect to slug-based URL if slug exists and is different
    if (event.slug && event.slug !== slug) {
      redirect(`/event/${event.slug}`);
    }
    
    // Continue rendering with UUID if no slug exists
  } else {
    // New slug-based URL - fetch by slug
    const eventResult = await getBySlug(slug);
    
    if (!eventResult.success) {
      notFound();
    }
    
    event = eventResult.data;
  }
  
  // Fetch location if locationId exists
  let location = null;
  if (event.locationId) {
    const locationResult = await getLocation(event.locationId);
    if (locationResult.success) {
      location = locationResult.data;
    }
  }
  
  // Fetch related activities for this event
  const activitiesResult = await listActivities({ eventId: event.id });
  const activities = activitiesResult.success ? activitiesResult.data.activities : [];
  
  // Fetch sections for this event
  const sectionsResult = await listSections('event', event.id);
  const sections = sectionsResult.success ? sectionsResult.data : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-jungle-800 mb-4">
            {event.name}
          </h1>
          
          {/* Event Details */}
          <div className="space-y-3 text-sage-700">
            {event.eventType && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Type:</span>
                <span className="px-3 py-1 bg-sage-100 text-sage-800 rounded-full text-sm">
                  {event.eventType.replace('_', ' ')}
                </span>
              </div>
            )}
            
            {event.startDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Start Date:</span>
                <span>{new Date(event.startDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {event.endDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">End Date:</span>
                <span>{new Date(event.endDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {location && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Location:</span>
                <span>{location.name}</span>
              </div>
            )}
            
            {event.rsvpRequired && event.rsvpDeadline && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">RSVP Deadline:</span>
                <span>{new Date(event.rsvpDeadline).toLocaleDateString()}</span>
              </div>
            )}
            
            {event.status && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <span className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm">
                  {event.status}
                </span>
              </div>
            )}
          </div>
          
          {/* Event Description */}
          {event.description && (
            <div 
              className="mt-6 prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          )}
        </div>
        
        {/* Related Activities */}
        {activities.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-jungle-800 mb-4">Activities</h2>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="border-l-4 border-jungle-500 pl-4 py-2">
                  <h3 className="font-semibold text-lg text-sage-900">{activity.name}</h3>
                  {activity.startTime && (
                    <p className="text-sm text-sage-600">
                      {new Date(activity.startTime).toLocaleString()}
                      {activity.endTime && ` - ${new Date(activity.endTime).toLocaleTimeString()}`}
                    </p>
                  )}
                  {activity.description && (
                    <p className="text-sage-700 mt-1">{activity.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
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
        {sections.length === 0 && activities.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center text-sage-600">
            <p>No additional information available for this event.</p>
          </div>
        )}
      </div>
    </div>
  );
}
