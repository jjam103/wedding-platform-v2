'use client';

import { PhotoGallery } from '@/components/guest/PhotoGallery';

export default function TestGalleryPage() {
  // Test with actual photo IDs from the database
  const photoIds = [
    '7bd93347-bd03-43a0-abce-dbb987ef8efe',
    '62e1343e-829a-41a6-a503-61e298a453ce',
    '86ef2fef-15a5-4733-8fe2-6bb64043529f',
    'a9649299-ec84-4bb4-98fc-dade9b6308ce',
    '370f58ba-4416-45a2-91dd-27c4c40e58bc',
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">Photo Gallery Test</h1>
          <p className="text-gray-600 mb-8">Testing photo display with different modes</p>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Gallery Mode (Grid)</h2>
          <PhotoGallery 
            photoIds={photoIds} 
            displayMode="gallery"
            showCaptions={true}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Carousel Mode</h2>
          <PhotoGallery 
            photoIds={photoIds} 
            displayMode="carousel"
            showCaptions={true}
          />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Loop Mode (Auto-play)</h2>
          <PhotoGallery 
            photoIds={photoIds} 
            displayMode="loop"
            autoplaySpeed={3000}
            showCaptions={true}
          />
        </section>
      </div>
    </div>
  );
}
