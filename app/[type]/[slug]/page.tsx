export const dynamic = 'force-dynamic';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@/components/guest/SectionRenderer';
import { listSections } from '@/services/sectionsService';
import { getContentPageBySlug } from '@/services/contentPagesService';

interface ContentPageProps {
  params: Promise<{ type: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

/**
 * Dynamic Content Page
 * 
 * Displays custom content pages with sections:
 * - Page title and metadata
 * - Custom sections with rich text, photos, and references
 * - Flexible layout with 1 or 2 columns
 * - Preview mode support for draft content (admin only)
 * 
 * Requirements: 
 * - 4.2 (E2E Critical Path Testing - section management flow)
 * - 24.10 (Slug Management - preview mode support)
 */
export default async function ContentPage({ params, searchParams }: ContentPageProps) {
  // Next.js 15: params and searchParams are Promises
  const { type, slug } = await params;
  const { preview } = await searchParams;
  
  // Only handle 'custom' type for content pages
  if (type !== 'custom') {
    notFound();
  }
  
  // Check if preview mode is enabled
  const isPreviewMode = preview === 'true';
  
  // If preview mode, verify admin authentication
  if (isPreviewMode) {
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    // Only admins can access preview mode
    if (!session) {
      notFound();
    }
  }
  
  // Fetch content page by slug
  const contentPageResult = await getContentPageBySlug(slug);
  
  if (!contentPageResult.success) {
    notFound();
  }
  
  const contentPage = contentPageResult.data;
  
  // In preview mode, show draft/published content
  // In normal mode, only show published content
  if (!isPreviewMode && contentPage.status !== 'published') {
    notFound();
  }
  
  // Fetch sections for this content page
  const sectionsResult = await listSections('custom', contentPage.id);
  const sections = sectionsResult.success ? sectionsResult.data : [];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-jungle-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded">
            <p className="font-bold">Preview Mode</p>
            <p className="text-sm">
              You are viewing {contentPage.status} content. This is only visible to admins.
            </p>
          </div>
        )}
        
        {/* Page Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-jungle-800 mb-4">
            {contentPage.title}
          </h1>
          
          {/* Status Badge (Preview Mode Only) */}
          {isPreviewMode && (
            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold text-sage-700">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                contentPage.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {contentPage.status}
              </span>
            </div>
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
            <p>No content available for this page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
