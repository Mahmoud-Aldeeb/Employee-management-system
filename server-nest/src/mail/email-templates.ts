const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paragraph = (text: string, style = 'font-size:16px;') =>
  `<p style="${style}">${text}</p>`;

const layout = (content: string) =>
  `<div style="max-width:600px;font-family:Arial,sans-serif;">${content}<br/>${paragraph('Best Regards,')}${paragraph('<strong>EMS</strong>')}</div>`;

export function checkOutReminderEmail(params: {
  firstName: string;
  department: string;
  checkInTime: string;
}) {
  const firstName = escapeHtml(params.firstName);
  const department = escapeHtml(params.department);
  const checkInTime = escapeHtml(params.checkInTime);

  return {
    subject: 'Attendance Check-Out Reminder',
    html: layout(
      `<h2>Hi ${firstName},</h2>` +
        paragraph(`You checked in today (${department}) at:`) +
        paragraph(
          `<strong>${checkInTime}</strong>`,
          'font-size:18px;color:#007bff;margin:8px 0;',
        ) +
        paragraph('Please make sure to check out within the next hour.') +
        paragraph('If you have any questions, please contact your admin.'),
    ),
  };
}

export function leaveReminderEmail(params: {
  department: string;
  startDate: string;
}) {
  const department = escapeHtml(params.department);
  const startDate = escapeHtml(params.startDate);

  return {
    subject: 'Leave Application Reminder',
    html: layout(
      '<h2>Hi Admin,</h2>' +
        paragraph(
          `A leave application from the ${department} department is still pending. It starts on:`,
        ) +
        paragraph(
          `<strong>${startDate}</strong>`,
          'font-size:18px;color:#007bff;margin:8px 0;',
        ) +
        paragraph('Please take action on this leave application.'),
    ),
  };
}

export function attendanceReminderEmail(params: {
  firstName: string;
  department: string;
}) {
  const firstName = escapeHtml(params.firstName);
  const department = escapeHtml(params.department);

  return {
    subject: 'Attendance Reminder - Please Mark Your Attendance',
    html: layout(
      `<h2>Hi ${firstName},</h2>` +
        paragraph("We noticed you haven't marked your attendance yet today.") +
        paragraph(
          'The deadline was <strong>11:30 AM</strong> and your attendance is still missing.',
        ) +
        paragraph(
          "Please check in as soon as possible or contact your admin if you're facing any issues.",
        ) +
        paragraph(`Department: ${department}`, 'font-size:14px;color:#666;'),
    ),
  };
}
