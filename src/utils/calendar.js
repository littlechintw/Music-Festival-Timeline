// Utility: Generate Google Calendar event link
// Single event link
export function googleCalendarLink({ summary, start, end, location, details }) {
  // Format: YYYYMMDDTHHmmssZ (UTC)
  function toGoogleDate(date) {
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
  const startStr = toGoogleDate(start);
  const endStr = toGoogleDate(end);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(summary)}&dates=${startStr}/${endStr}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(details)}`;
}

// Multi-event: generate array of links (for batch add, user opens each)
export function googleCalendarLinks(perfs) {
  return perfs.map(perf => googleCalendarLink({
    summary: perf.artist + (perf.festivalName ? ' @ ' + perf.festivalName : ''),
    start: perf.start,
    end: perf.end,
    location: perf.stage,
    details: 'From Festival App',
  }));
}
