export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/guest/SectionRenderer';
import { listSections } from '@/services/sectionsService';
import { getBySlug, get } from '@/services/accommodationService';

interface AccommodationPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Accommodation Details Page
 * 
 * Displays accommodation information with sections:
 * - Accommodation name, description, address, location
 * - Check-in/check-out dates
 * - Custom sections with rich text, photos, and references
 * - Room types available
 * 
 * Requirements: 
 * - 4.2 (E2E Critical Path Testing - section management flow)
 * - 24.10 (Slug Management - slug-based routing for accommodations)
 * 
 * This route uses [slug] for URL-friendly routing.
 * Backward compatibility: UUID-based URLs redirect to slug-based URLs.
 */
export default async function AccommodationPage({ params }: AccommodationPageProps) {
  // Next.js 15: params is a Promise
  const { slug } = await params;
  
  // Determine if the parameter is a UUID (legacy) or slug (new)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  let accommodation;
  
  if (isUUID) {
    // Legacy UUID-based URL - fetch by ID
    const accommodationResult = await get(slug);
    
    if (!accommodationResult.success) {
      notFound();
    }
    
    accommodation = accommodationResult.data;
    
    // Redirect to slug-based URL if slug exists and is different
    if (accommodation.slug && accommodation.slug !== slug) {
      redirect(`/accommodation/${accommodation.slug}`);
    }
    
    // Continue rendering with UUID if no slug exists
  } else {
    // New slug-based URL - fetch by slug
    const accommodationResult = await getBySlug(slug);
    
    if (!accommodationResult.success) {
      notFound();
    }
    
    accommodation = accommodationResult.data;
  }
  
  // Fetch sections for this accommodation
  const sectionsResult = await listSections('accommodation', accommodation.id);
  const sections = sectionsResult.success ? sectionsResult.data : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Accommodation Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-jungle-800 mb-4">
            {accommodation.name}
          </h1>
          
          {/* Accommodation Details */}
          <div className="space-y-3 text-sage-700">
            {accommodation.address && (
              <div className="flex items-start gap-2">
                <span className="font-semibold">Address:</span>
                <span>{accommodation.address}</span>
              </div>
            )}
            
            {accommodation.locationId && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Location:</span>
                <span>Location details</span>
              </div>
            )}
            
            {accommodation.checkInDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Check-in Date:</span>
                <span>{new Date(accommodation.checkInDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {accommodation.checkOutDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Check-out Date:</span>
                <span>{new Date(accommodation.checkOutDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {accommodation.status && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <span className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm">
                  {accommodation.status}
                </span>
              </div>
            )}
          </div>
          
          {/* Accommodation Description */}
          {accommodation.description && (
            <div 
              className="mt-6 prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: accommodation.description }}
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
            <p>No additional information available for this accommodation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
