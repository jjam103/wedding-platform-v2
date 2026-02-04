export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/guest/SectionRenderer';
import { listSections } from '@/services/sectionsService';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RoomTypePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Room Type Details Page
 * 
 * Displays room type information with sections:
 * - Room type name, description, capacity
 * - Pricing and host subsidy information
 * - Custom sections with rich text, photos, and references
 * - Accommodation details
 * 
 * Requirements: 
 * - 4.2 (E2E Critical Path Testing - section management flow)
 * - 24.10 (Slug Management - slug-based routing for room types)
 * 
 * This route uses [slug] for URL-friendly routing.
 * Backward compatibility: UUID-based URLs redirect to slug-based URLs.
 */
export default async function RoomTypePage({ params }: RoomTypePageProps) {
  // Next.js 15: params is a Promise
  const { slug } = await params;
  
  const supabase = createServerComponentClient({ cookies });
  
  // Determine if the parameter is a UUID (legacy) or slug (new)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  
  let roomType;
  
  if (isUUID) {
    // Legacy UUID-based URL - fetch by ID
    const { data, error } = await supabase
      .from('room_types')
      .select('*, accommodations(*)')
      .eq('id', slug)
      .single();
    
    if (error || !data) {
      notFound();
    }
    
    roomType = data;
    
    // Redirect to slug-based URL if slug exists and is different
    if (roomType.slug && roomType.slug !== slug) {
      redirect(`/room-type/${roomType.slug}`);
    }
    
    // Continue rendering with UUID if no slug exists
  } else {
    // New slug-based URL - fetch by slug
    const { data, error } = await supabase
      .from('room_types')
      .select('*, accommodations(*)')
      .eq('slug', slug)
      .single();
    
    if (error || !data) {
      notFound();
    }
    
    roomType = data;
  }
  
  // Fetch sections for this room type
  const sectionsResult = await listSections('room_type', roomType.id);
  const sections = sectionsResult.success ? sectionsResult.data : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Room Type Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-jungle-800 mb-4">
            {roomType.name}
          </h1>
          
          {/* Accommodation Link */}
          {roomType.accommodations && (
            <div className="mb-4">
              <a 
                href={`/accommodation/${roomType.accommodations.slug || roomType.accommodations.id}`}
                className="text-ocean-600 hover:text-ocean-700 underline"
              >
                ← Back to {roomType.accommodations.name}
              </a>
            </div>
          )}
          
          {/* Room Type Details */}
          <div className="space-y-3 text-sage-700">
            {roomType.capacity && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Capacity:</span>
                <span>{roomType.capacity} guests</span>
              </div>
            )}
            
            {roomType.totalRooms && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Total Rooms:</span>
                <span>{roomType.totalRooms}</span>
              </div>
            )}
            
            {roomType.pricePerNight !== undefined && roomType.pricePerNight !== null && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Price per Night:</span>
                <span>${roomType.pricePerNight}</span>
              </div>
            )}
            
            {roomType.hostSubsidyPerNight !== undefined && roomType.hostSubsidyPerNight !== null && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Host Subsidy per Night:</span>
                <span>${roomType.hostSubsidyPerNight}</span>
              </div>
            )}
            
            {roomType.status && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <span className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm">
                  {roomType.status}
                </span>
              </div>
            )}
          </div>
          
          {/* Room Type Description */}
          {roomType.description && (
            <div 
              className="mt-6 prose prose-lg max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: roomType.description }}
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
            <p>No additional information available for this room type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
