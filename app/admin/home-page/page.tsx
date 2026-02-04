'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RichTextEditorSkeleton } from '@/components/admin/RichTextEditorSkeleton';
import { SectionEditorSkeleton } from '@/components/admin/SectionEditorSkeleton';

// Lazy load heavy components
const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor').then(mod => ({ default: mod.RichTextEditor })), {
  loading: () => <RichTextEditorSkeleton />,
  ssr: false,
});

const SectionEditor = dynamic(() => import('@/components/admin/SectionEditor').then(mod => ({ default: mod.SectionEditor })), {
  loading: () => <SectionEditorSkeleton />,
  ssr: false,
});

const InlineSectionEditor = dynamic(() => import('@/components/admin/InlineSectionEditor').then(mod => ({ default: mod.InlineSectionEditor })), {
  loading: () => <div className="p-4 text-sm text-gray-600">Loading sections...</div>,
  ssr: false,
});

interface HomePageConfig {
  title: string | null;
  subtitle: string | null;
  welcomeMessage: string | null;
  heroImageUrl: string | null;
}

/**
 * Home Page Editor
 * 
 * Allows admins to customize the wedding homepage with:
 * - Title and subtitle
 * - Welcome message (rich text)
 * - Hero image URL
 * - Manage sections button (opens SectionEditor)
 * - Preview button (opens guest-facing homepage)
 * - Auto-save draft every 30 seconds
 */
export default function HomePageEditorPage() {
  const router = useRouter();
  const [config, setConfig] = useState<HomePageConfig>({
    title: null,
    subtitle: null,
    welcomeMessage: null,
    heroImageUrl: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [showInlineSectionEditor, setShowInlineSectionEditor] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load home page config
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/home-page');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home page config');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save home page config
  const saveConfig = useCallback(async (showToast = true) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/admin/home-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
        setIsDirty(false);
        setLastSaved(new Date());
        
        if (showToast) {
          // Show success toast (would use toast context in real implementation)
          console.log('Home page saved successfully');
        }
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save home page config');
    } finally {
      setSaving(false);
    }
  }, [config]);

  // Auto-save every 30 seconds if dirty
  useEffect(() => {
    if (isDirty && !saving) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveConfig(false); // Silent auto-save
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, saving, saveConfig]);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFieldChange = (field: keyof HomePageConfig, value: string | null) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handlePreview = () => {
    // Open guest-facing homepage in new tab
    window.open('/', '_blank');
  };

  const handleManageSections = () => {
    setShowSectionEditor(true);
  };

  const handleToggleInlineSectionEditor = () => {
    setShowInlineSectionEditor(!showInlineSectionEditor);
  };

  const handleSectionEditorClose = () => {
    setShowSectionEditor(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (showSectionEditor) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Home Page Sections</h1>
          <Button onClick={handleSectionEditorClose} variant="secondary">
            Back to Home Page Editor
          </Button>
        </div>
        <SectionEditor pageType="home" pageId="home" onSave={handleSectionEditorClose} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Home Page Editor</h1>
        <p className="text-gray-600">
          Customize your wedding homepage with a title, subtitle, welcome message, and hero image.
        </p>
        {lastSaved && (
          <p className="text-sm text-gray-500 mt-2">
            Last saved: {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </div>

      {error && (
        <Card className="mb-6 p-4 bg-red-50 border-red-200">
          <p className="text-red-800">{error}</p>
        </Card>
      )}

      <div className="space-y-6">
        {/* Wedding Title */}
        <Card className="p-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Wedding Title *
          </label>
          <input
            id="title"
            type="text"
            value={config.title || ''}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Sarah & Michael's Costa Rica Wedding"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          />
          <p className="mt-1 text-sm text-gray-500">
            The main title displayed on your wedding homepage
          </p>
        </Card>

        {/* Subtitle */}
        <Card className="p-6">
          <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
            Subtitle
          </label>
          <input
            id="subtitle"
            type="text"
            value={config.subtitle || ''}
            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
            placeholder="June 14-16, 2025 • Tamarindo, Costa Rica"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          />
          <p className="mt-1 text-sm text-gray-500">
            Optional subtitle with date and location
          </p>
        </Card>

        {/* Hero Image URL */}
        <Card className="p-6">
          <label htmlFor="heroImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Hero Image URL
          </label>
          <input
            id="heroImageUrl"
            type="url"
            value={config.heroImageUrl || ''}
            onChange={(e) => handleFieldChange('heroImageUrl', e.target.value)}
            placeholder="https://example.com/hero-image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
          />
          {config.heroImageUrl && (
            <div className="mt-3">
              <img
                src={config.heroImageUrl}
                alt="Hero preview"
                className="max-w-xs rounded-md border border-gray-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          <p className="mt-1 text-sm text-gray-500">
            URL of the hero image displayed at the top of the homepage
          </p>
        </Card>

        {/* Welcome Message */}
        <Card className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Welcome Message
          </label>
          <RichTextEditor
            value={config.welcomeMessage || ''}
            onChange={(html) => handleFieldChange('welcomeMessage', html)}
            placeholder="Write a welcome message for your guests..."
            disabled={saving}
          />
          <p className="mt-1 text-sm text-gray-500">
            Rich text welcome message displayed on the homepage
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            <Button
              onClick={handleManageSections}
              variant="secondary"
              disabled={saving}
            >
              Manage Sections (Full Editor)
            </Button>
            <Button
              onClick={handleToggleInlineSectionEditor}
              variant="secondary"
              disabled={saving}
            >
              {showInlineSectionEditor ? 'Hide' : 'Show'} Inline Section Editor
            </Button>
            <Button
              onClick={handlePreview}
              variant="secondary"
              disabled={saving}
            >
              Preview
            </Button>
          </div>
          <Button
            onClick={() => saveConfig(true)}
            disabled={saving || !isDirty}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Inline Section Editor */}
        {showInlineSectionEditor && (
          <Card className="p-6">
            <InlineSectionEditor 
              pageType="home" 
              pageId="home" 
              onSave={() => {
                console.log('Section saved');
              }}
              compact={false}
            />
          </Card>
        )}

        {isDirty && !saving && (
          <p className="text-sm text-amber-600">
            You have unsaved changes. They will be auto-saved in 30 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
