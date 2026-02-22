/// Utility function to build the HTML content for the daily report email
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

  const totalCalories = log.meals?.reduce((sum, m) => sum + (m.calories || 0), 0) ?? 0;

  const mealsHtml = log.meals?.length
    ? log.meals.map((m) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${m.time || '—'}</td>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${m.description}</td>
          <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:right;">${m.calories} kcal</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:8px;color:#999;">No meals logged</td></tr>';

  const subject = `Daily Report from ${clientName} — ${format(logDate, 'MMM d, yyyy')}`;

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="background:#16a34a;padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:20px;">🥗 Daily Nutrition Report</h1>
        <p style="color:#bbf7d0;margin:4px 0 0;">From ${clientName} · ${format(logDate, 'EEEE, MMMM d yyyy')}</p>
      </div>

      <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;">
        
        <p style="color:#374151;">Hi ${consultantName},</p>
        <p style="color:#374151;">${clientName} has submitted their daily nutrition report. Here's a summary:</p>

       <!-- Vitals -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0;">
  <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
    <p style="font-size:24px;font-weight:bold;color:#2563eb;margin:0;">${log.waterIntake}L</p>
    <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Water Intake</p>
  </div>
  <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
    <p style="font-size:24px;font-weight:bold;color:#7c3aed;margin:0;">${log.weight}kg</p>
    <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Weight</p>
  </div>
  <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
    <p style="font-size:24px;font-weight:bold;color:#16a34a;margin:0;">${totalCalories}</p>
    <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Total kcal</p>
  </div>
  <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
    <p style="font-size:24px;font-weight:bold;color:#ea580c;margin:0;">${log.mood || '—'}</p>
    <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Mood</p>
  </div>
</div>

        <!-- Meals -->
        <h3 style="color:#111827;margin:20px 0 8px;">🍽️ Meals</h3>
        <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;">TIME</th>
              <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280;">DESCRIPTION</th>
              <th style="padding:8px;text-align:right;font-size:12px;color:#6b7280;">CALORIES</th>
            </tr>
          </thead>
          <tbody>${mealsHtml}</tbody>
        </table>

        ${log.exercise ? `
        <h3 style="color:#111827;margin:20px 0 8px;">🏃 Exercise</h3>
        <p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;">${log.exercise}</p>
        ` : ''}

        ${log.symptoms ? `
        <h3 style="color:#111827;margin:20px 0 8px;">🩺 Symptoms</h3>
        <p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;">${log.symptoms}</p>
        ` : ''}

        ${log.notes ? `
        <h3 style="color:#111827;margin:20px 0 8px;">📝 Notes</h3>
        <p style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:12px;color:#374151;">${log.notes}</p>
        ` : ''}

        <p style="color:#9ca3af;font-size:12px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;">
          This report was sent automatically via the Nutrition Consultant App.
        </p>
      </div>
    </div>
  `;

  return { subject, html };
}