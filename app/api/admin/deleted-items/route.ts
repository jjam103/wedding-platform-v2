/**
 * Deleted Items API Routes
 * 
 * GET /api/admin/deleted-items - Get all soft-deleted items
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/supabaseServer';

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = await createAuthenticatedClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // 3. Fetch deleted items from all tables
    const deletedItems: any[] = [];

    // Content Pages
    if (!type || type === 'content_page') {
      const { data: pages } = await supabase
        .from('content_pages')
        .select('id, title, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (pages) {
        deletedItems.push(
          ...pages.map((p) => ({
            id: p.id,
            type: 'content_page',
            name: p.title,
            deleted_at: p.deleted_at,
            deleted_by: p.deleted_by,
          }))
        );
      }
    }

    // Events
    if (!type || type === 'event') {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (events) {
        deletedItems.push(
          ...events.map((e) => ({
            id: e.id,
            type: 'event',
            name: e.name,
            deleted_at: e.deleted_at,
            deleted_by: e.deleted_by,
          }))
        );
      }
    }

    // Activities
    if (!type || type === 'activity') {
      const { data: activities } = await supabase
        .from('activities')
        .select('id, name, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (activities) {
        deletedItems.push(
          ...activities.map((a) => ({
            id: a.id,
            type: 'activity',
            name: a.name,
            deleted_at: a.deleted_at,
            deleted_by: a.deleted_by,
          }))
        );
      }
    }

    // Sections
    if (!type || type === 'section') {
      const { data: sections } = await supabase
        .from('sections')
        .select('id, title, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (sections) {
        deletedItems.push(
          ...sections.map((s) => ({
            id: s.id,
            type: 'section',
            name: s.title || 'Untitled Section',
            deleted_at: s.deleted_at,
            deleted_by: s.deleted_by,
          }))
        );
      }
    }

    // Columns
    if (!type || type === 'column') {
      const { data: columns } = await supabase
        .from('columns')
        .select('id, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (columns) {
        deletedItems.push(
          ...columns.map((c) => ({
            id: c.id,
            type: 'column',
            name: 'Column',
            deleted_at: c.deleted_at,
            deleted_by: c.deleted_by,
          }))
        );
      }
    }

    // Photos
    if (!type || type === 'photo') {
      const { data: photos } = await supabase
        .from('photos')
        .select('id, caption, deleted_at, deleted_by')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (photos) {
        deletedItems.push(
          ...photos.map((p) => ({
            id: p.id,
            type: 'photo',
            name: p.caption || 'Untitled Photo',
            deleted_at: p.deleted_at,
            deleted_by: p.deleted_by,
          }))
        );
      }
    }

    // Sort by deleted_at (most recent first)
    deletedItems.sort(
      (a, b) =>
        new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()
    );

    // Fetch deleted_by user emails
    const userIds = [...new Set(deletedItems.map((item) => item.deleted_by).filter(Boolean))];
    const userEmails: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('admin_users')
        .select('id, email')
        .in('id', userIds);

      if (users) {
        users.forEach((user) => {
          userEmails[user.id] = user.email;
        });
      }
    }

    // Add user emails to items
    const itemsWithEmails = deletedItems.map((item) => ({
      ...item,
      deleted_by_email: item.deleted_by ? userEmails[item.deleted_by] : undefined,
    }));

    return NextResponse.json({ success: true, data: itemsWithEmails });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}
