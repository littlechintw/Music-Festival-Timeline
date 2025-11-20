// Utility: Generate .ics file for performances
export function generateICS(events) {
  // RFC 5545 iCalendar
  function formatDate(date) {
    // UTC, format: YYYYMMDDTHHmmssZ
    const d = new Date(date);
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nCALSCALE:GREGORIAN\nPRODID:-//Music Festival Planner//EN\n';
  for (const perf of events) {
    ics += 'BEGIN:VEVENT\n';
    ics += `UID:${(perf.id || perf.artist + perf.start)}@music-festival\n`;
    ics += `SUMMARY:${perf.artist}${perf.festivalName ? ' @ ' + perf.festivalName : ''}\n`;
    ics += `DTSTART:${formatDate(perf.start)}\n`;
    ics += `DTEND:${formatDate(perf.end)}\n`;
    if (perf.stage) ics += `LOCATION:${perf.stage}\n`;
    if (perf.description) ics += `DESCRIPTION:${perf.description}\n`;
    ics += 'END:VEVENT\n';
  }
  ics += 'END:VCALENDAR';
  return ics;
}
