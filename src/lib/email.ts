// Utility function to build the HTML content for the daily report email sent to consultants when a client submits their daily log. This function takes the client's name, consultant's name, and the daily log data to generate a well-formatted email with all relevant information about the client's day, including water intake, weight, mood, symptoms, meals experience, exercise, and additional notes.
//src/lib/email.ts
import { DailyLog } from './types';
import { format } from 'date-fns';

export function buildReportEmail(
  clientName: string,
  consultantName: string,
  log: DailyLog
): { subject: string; html: string } {
  const logDate = (log.date as any)?.seconds
    ? new Date((log.date as any).seconds * 1000)
    : new Date(log.date);

  const subject = `Daily Report from ${clientName} — ${format(logDate, 'MMM d, yyyy')}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      
      <!-- Header -->
      <div style="background:#16a34a;padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">🥗 Daily Nutrition Report</h1>
        <p style="color:#bbf7d0;margin:4px 0 0;">From ${clientName} · ${format(logDate, 'EEEE, MMMM d yyyy')}</p>
      </div>

      <!-- Body -->
      <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">

        <p style="color:#374151;">Hi ${consultantName},</p>
        <p style="color:#374151;">${clientName} has submitted their daily nutrition report. Here's a summary:</p>

        <!-- Vitals Grid 2x2 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
          <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
            <p style="font-size:24px;font-weight:bold;color:#2563eb;margin:0;">${log.waterIntake}L</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Water Intake</p>
          </div>
          <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
            <p style="font-size:24px;font-weight:bold;color:#7c3aed;margin:0;">${log.weight ? `${log.weight}kg` : '—'}</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Weight</p>
          </div>
          <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
            <p style="font-size:24px;font-weight:bold;color:#16a34a;margin:0;">${log.mood || '—'}</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Mood</p>
          </div>
          <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
            <p style="font-size:24px;font-weight:bold;color:#ea580c;margin:0;">${log.symptoms ? '⚠️' : '✅'}</p>
            <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">${log.symptoms ? 'Has Symptoms' : 'No Symptoms'}</p>
          </div>
        </div>

        <!-- Meals Experience -->
        ${log.mealsExperience ? `
        <h3 style="color:#111827;margin:20px 0 8px;">🍽️ Meals Experience</h3>
        <p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;margin:0 0 16px;">
          ${log.mealsExperience}
        </p>
        ` : ''}

        <!-- Exercise -->
        ${log.exercise ? `
        <h3 style="color:#111827;margin:20px 0 8px;">🏃 Exercise</h3>
        <p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;margin:0 0 16px;">
          ${log.exercise}
        </p>
        ` : ''}

        <!-- Symptoms -->
        ${log.symptoms ? `
        <h3 style="color:#111827;margin:20px 0 8px;">🩺 Symptoms</h3>
        <p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;margin:0 0 16px;">
          ${log.symptoms}
        </p>
        ` : ''}

        ${log.bowelMovement ? `
<h3 style="color:#111827;margin:20px 0 8px;">🚽 Bowel Movement</h3>
<p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;margin:0 0 16px;">
  ${log.bowelMovement}
</p>
` : ''}

${log.nightSleep ? `
<h3 style="color:#111827;margin:20px 0 8px;">😴 Night Sleep</h3>
<p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;margin:0 0 16px;">
  ${log.nightSleep}
</p>
` : ''}

        <!-- Notes -->
        ${log.notes ? `
        <h3 style="color:#111827;margin:20px 0 8px;">📝 Additional Notes</h3>
        <p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;margin:0 0 16px;">
          ${log.notes}
        </p>
        ` : ''}

        <!-- Footer -->
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
          This report was sent automatically via the Nutrition Consultant App.
        </p>
      </div>
    </div>
  `;

  return { subject, html };
}