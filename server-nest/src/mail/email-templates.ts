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

const button = (href: string, label: string) =>
  `<p><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">${escapeHtml(label)}</a></p>`;

const linkFallback = (link: string) =>
  paragraph(
    'If the button does not work, copy this link into your browser:',
    'font-size:13px;color:#666;',
  ) + paragraph(escapeHtml(link), 'font-size:13px;word-break:break-all;');

export function inviteEmail(params: { firstName: string; link: string }) {
  const firstName = escapeHtml(params.firstName);

  return {
    subject: 'Welcome to EMS - Set your password',
    html: layout(
      `<h2>Hi ${firstName},</h2>` +
        paragraph(
          'An account has been created for you on the Employee Management System.',
        ) +
        paragraph(
          'Choose your password to get started. This link works once and expires in 48 hours.',
        ) +
        button(params.link, 'Set your password') +
        linkFallback(params.link),
    ),
  };
}

export function passwordResetEmail(params: {
  firstName: string;
  link: string;
}) {
  const firstName = escapeHtml(params.firstName);

  return {
    subject: 'Reset your EMS password',
    html: layout(
      `<h2>Hi ${firstName},</h2>` +
        paragraph('We received a request to reset your password.') +
        paragraph(
          'Use the button below to choose a new one. This link works once and expires in 1 hour.',
        ) +
        button(params.link, 'Reset your password') +
        linkFallback(params.link) +
        paragraph(
          'If you did not ask for this, you can ignore this email: your password stays the same.',
          'font-size:13px;color:#666;',
        ),
    ),
  };
}
