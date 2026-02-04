import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateItinerary } from '@/services/itineraryService';

/**
 * PDF Export API Route
 * 
 * Generates a PDF version of the guest's personalized itinerary.
 * 
 * Requirements: 26.5
 */
export async function GET(request: Request) {
  try {
    // 1. Auth check
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }
    
    // 2. Get guest ID from session
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, first_name, last_name')
      .eq('email', session.user.email)
      .single();
    
    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Guest not found' } },
        { status: 404 }
      );
    }
    
    // 3. Generate itinerary
    const result = await generateItinerary(guest.id);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }
    
    const itinerary = result.data;
    
    // 4. Generate PDF HTML content
    const pdfHtml = generatePDFHTML(itinerary, guest);
    
    // 5. For now, return HTML that can be printed as PDF
    // In production, you would use a library like puppeteer or jsPDF
    // to generate actual PDF bytes
    
    return new NextResponse(pdfHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="itinerary-${guest.first_name}-${guest.last_name}.html"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

/**
 * Generates print-friendly HTML for PDF export
 */
function generatePDFHTML(itinerary: any, guest: any): string {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const groupEventsByDate = (events: any[]) => {
    const grouped = new Map<string, any[]>();
    
    events.forEach(event => {
      const dateKey = new Date(event.date).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(event);
    });
    
    return Array.from(grouped.entries()).map(([date, events]) => ({
      date,
      events: events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    }));
  };

  const eventsByDate = groupEventsByDate(itinerary.events);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wedding Itinerary - ${guest.first_name} ${guest.last_name}</title>
  <style>
    @media print {
      @page {
        margin: 1in;
        size: letter;
      }
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      .page-break {
        page-break-before: always;
      }
      .no-print {
        display: none;
      }
    }
    
    body {
      font-family: 'Georgia', serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    
    h1 {
      color: #2d5016;
      border-bottom: 3px solid #2d5016;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    h2 {
      color: #2d5016;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    
    h3 {
      color: #4a7c59;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .section {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background-color: #f9f9f9;
    }
    
    .event {
      margin-bottom: 20px;
      padding-left: 20px;
      border-left: 4px solid #2d5016;
    }
    
    .event-time {
      font-weight: bold;
      color: #2d5016;
    }
    
    .event-name {
      font-size: 1.1em;
      font-weight: bold;
      margin: 5px 0;
    }
    
    .event-details {
      color: #666;
      font-size: 0.95em;
    }
    
    .rsvp-status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: bold;
      margin-left: 10px;
    }
    
    .rsvp-attending {
      background-color: #d4edda;
      color: #155724;
    }
    
    .rsvp-declined {
      background-color: #f8d7da;
      color: #721c24;
    }
    
    .rsvp-maybe {
      background-color: #fff3cd;
      color: #856404;
    }
    
    .rsvp-pending {
      background-color: #d1ecf1;
      color: #0c5460;
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background-color: #2d5016;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .print-button:hover {
      background-color: #1f3810;
    }
    
    .generated-date {
      text-align: center;
      color: #999;
      font-size: 0.85em;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
  
  <div class="header">
    <h1>Wedding Itinerary</h1>
    <p><strong>${guest.first_name} ${guest.last_name}</strong></p>
  </div>
  
  ${itinerary.transportation && (itinerary.transportation.arrival_date || itinerary.transportation.departure_date) ? `
  <div class="section">
    <h2>✈️ Transportation</h2>
    ${itinerary.transportation.arrival_date ? `
    <div>
      <strong>Arrival:</strong> ${formatDate(itinerary.transportation.arrival_date)} at ${formatTime(itinerary.transportation.arrival_date)}
      ${itinerary.transportation.airport_code ? `<br><strong>Airport:</strong> ${itinerary.transportation.airport_code}` : ''}
      ${itinerary.transportation.flight_number ? `<br><strong>Flight:</strong> ${itinerary.transportation.flight_number}` : ''}
    </div>
    ` : ''}
    ${itinerary.transportation.departure_date ? `
    <div style="margin-top: 10px;">
      <strong>Departure:</strong> ${formatDate(itinerary.transportation.departure_date)} at ${formatTime(itinerary.transportation.departure_date)}
    </div>
    ` : ''}
  </div>
  ` : ''}
  
  ${itinerary.accommodation ? `
  <div class="section">
    <h2>🏨 Accommodation</h2>
    ${itinerary.accommodation.accommodation_name ? `<div><strong>${itinerary.accommodation.accommodation_name}</strong></div>` : ''}
    ${itinerary.accommodation.room_type ? `<div>Room: ${itinerary.accommodation.room_type}</div>` : ''}
    ${itinerary.accommodation.check_in && itinerary.accommodation.check_out ? `
    <div>
      Check-in: ${formatDate(itinerary.accommodation.check_in)}<br>
      Check-out: ${formatDate(itinerary.accommodation.check_out)}
    </div>
    ` : ''}
    ${itinerary.accommodation.address ? `<div style="margin-top: 5px; color: #666;">${itinerary.accommodation.address}</div>` : ''}
  </div>
  ` : ''}
  
  <div class="section">
    <h2>📅 Schedule</h2>
    ${eventsByDate.length === 0 ? `
    <p>No events scheduled yet.</p>
    ` : eventsByDate.map(({ date, events }) => `
    <div class="page-break">
      <h3>${formatDate(events[0].date)}</h3>
      ${events.map(event => `
      <div class="event">
        <div class="event-time">${formatTime(event.time)}</div>
        <div class="event-name">
          ${event.name}
          ${event.rsvp_status ? `
          <span class="rsvp-status rsvp-${event.rsvp_status}">${event.rsvp_status}</span>
          ` : ''}
        </div>
        ${event.location ? `<div class="event-details">📍 ${event.location}</div>` : ''}
        ${event.description ? `<div class="event-details">${event.description}</div>` : ''}
      </div>
      `).join('')}
    </div>
    `).join('')}
  </div>
  
  <div class="generated-date">
    Generated on ${new Date(itinerary.generated_at).toLocaleString()}
  </div>
  
  <script>
    // Auto-print dialog on load (optional)
    // window.onload = function() { window.print(); };
  </script>
</body>
</html>
  `.trim();
}
