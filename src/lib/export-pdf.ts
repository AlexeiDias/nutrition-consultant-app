// src/lib/export-pdf.ts
import jsPDF from 'jspdf';
import { ActionPlan } from './types';
import { format } from 'date-fns';

const GREEN = '#16a34a';
const DARK = '#111827';
const GRAY = '#6b7280';
const LIGHT_GRAY = '#f3f4f6';
const BORDER = '#e5e7eb';
const WHITE = '#ffffff';
const BLUE = '#2563eb';
const ORANGE = '#ea580c';
const PURPLE = '#7c3aed';

function safeDate(d: any): Date {
  return d?.seconds ? new Date(d.seconds * 1000) : new Date(d);
}

function addPageHeader(doc: jsPDF, title: string, subtitle: string, pageNum: number) {
  // Green header bar
  doc.setFillColor(GREEN);
  doc.rect(0, 0, 210, 18, 'F');
  doc.setTextColor(WHITE);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 10, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 10, 16.5);
  // Page number
  doc.text(`Page ${pageNum}`, 200, 12, { align: 'right' });
}

function addSectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(LIGHT_GRAY);
  doc.rect(10, y, 190, 7, 'F');
  doc.setTextColor(DARK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(text, 13, y + 5);
  return y + 10;
}

function addTextField(doc: jsPDF, label: string, value: string, x: number, y: number, w: number): number {
  doc.setTextColor(GRAY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(label.toUpperCase(), x, y);
  doc.setTextColor(DARK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const lines = doc.splitTextToSize(value || '—', w - 4);
  doc.text(lines, x, y + 4);
  return y + 4 + lines.length * 4.5;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, plan: ActionPlan, pageRef: { num: number }): number {
  if (y + needed > 280) {
    doc.addPage();
    pageRef.num += 1;
    const startDate = safeDate(plan.startDate);
    const nextDate = safeDate(plan.nextConsultation);
    addPageHeader(
      doc,
      plan.title,
      `${plan.clientName} · ${format(startDate, 'MMM d')} – ${format(nextDate, 'MMM d, yyyy')}`,
      pageRef.num
    );
    return 25;
  }
  return y;
}

export async function exportActionPlanPDF(plan: ActionPlan, consultantName?: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageRef = { num: 1 };

  const startDate = safeDate(plan.startDate);
  const nextDate = safeDate(plan.nextConsultation);
  const totalDays = Math.ceil((nextDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // ── PAGE 1: Cover ──────────────────────────────────────────────
  doc.setFillColor(GREEN);
  doc.rect(0, 0, 210, 60, 'F');

  doc.setTextColor(WHITE);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(plan.title, 10, 25);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`For: ${plan.clientName}`, 10, 35);
  if (consultantName) doc.text(`By: ${consultantName}`, 10, 41);
  if (plan.programGoal) doc.text(`Goal: ${plan.programGoal}`, 10, 47);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 10, 53);

  let y = 70;

  // Plan summary cards
  const cards = [
    { label: 'Start Date', value: format(startDate, 'MMM d, yyyy'), color: GREEN },
    { label: 'Next Consultation', value: format(nextDate, 'MMM d, yyyy'), color: BLUE },
    { label: 'Duration', value: `${totalDays} days`, color: PURPLE },
    { label: 'Status', value: plan.status.charAt(0).toUpperCase() + plan.status.slice(1), color: ORANGE },
  ];

  cards.forEach((card, i) => {
    const x = 10 + (i % 2) * 98;
    const cardY = y + Math.floor(i / 2) * 22;
    doc.setFillColor(card.color);
    doc.roundedRect(x, cardY, 92, 18, 3, 3, 'F');
    doc.setTextColor(WHITE);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 6, cardY + 11);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label.toUpperCase(), x + 6, cardY + 16);
  });

  y += 52;

  // Weight goals
  if (plan.startWeight || plan.targetWeight) {
    y = addSectionTitle(doc, 'WEIGHT GOALS', y);
    if (plan.startWeight) {
      doc.setFillColor(LIGHT_GRAY);
      doc.roundedRect(10, y, 88, 14, 2, 2, 'F');
      doc.setTextColor(PURPLE);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`${plan.startWeight} kg`, 14, y + 9);
      doc.setTextColor(GRAY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('STARTING WEIGHT', 14, y + 13);
    }
    if (plan.targetWeight) {
      doc.setFillColor(LIGHT_GRAY);
      doc.roundedRect(112, y, 88, 14, 2, 2, 'F');
      doc.setTextColor(GREEN);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`${plan.targetWeight} kg`, 116, y + 9);
      doc.setTextColor(GRAY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('TARGET WEIGHT', 116, y + 13);
    }
    y += 22;
  }

  // TDEE
  if (plan.tdee > 0) {
    doc.setFillColor('#eff6ff');
    doc.roundedRect(10, y, 190, 14, 2, 2, 'F');
    doc.setTextColor(BLUE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Daily Calorie Target (TDEE): ${plan.tdee} kcal`, 14, y + 9);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Calculated via Mifflin-St Jeor equation from client body metrics', 14, y + 13);
    y += 20;
  }

  // Plan status
  const statusColor = plan.planStatus === 'reviewed' ? GREEN : ORANGE;
  const statusText = plan.planStatus === 'reviewed'
    ? '✓ This plan has been reviewed by the consultant'
    : '⏳ This plan is pending clinical review';
  doc.setFillColor(plan.planStatus === 'reviewed' ? '#f0fdf4' : '#fff7ed');
  doc.roundedRect(10, y, 190, 10, 2, 2, 'F');
  doc.setTextColor(statusColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(statusText, 14, y + 7);
  y += 16;

  // ── TASKS ──────────────────────────────────────────────────────
  if (plan.tasks && plan.tasks.length > 0) {
    y = checkPageBreak(doc, y, 20, plan, pageRef);
    y = addSectionTitle(doc, `TASKS (${plan.tasks.filter(t => t.completed).length}/${plan.tasks.length} completed)`, y);

    const categories = ['exercise', 'hydration', 'lifestyle'] as const;
    const catColors: Record<string, string> = {
      exercise: '#eff6ff',
      hydration: '#ecfeff',
      lifestyle: '#faf5ff',
    };
    const catLabels: Record<string, string> = {
      exercise: '🏃 Exercise',
      hydration: '💧 Hydration',
      lifestyle: '🌿 Lifestyle',
    };

    for (const cat of categories) {
      const catTasks = plan.tasks.filter(t => t.category === cat);
      if (catTasks.length === 0) continue;

      y = checkPageBreak(doc, y, 12, plan, pageRef);
      doc.setTextColor(DARK);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(catLabels[cat], 13, y);
      y += 4;

      for (const task of catTasks) {
        y = checkPageBreak(doc, y, 12, plan, pageRef);
        doc.setFillColor(catColors[cat]);
        doc.roundedRect(13, y, 184, task.description ? 14 : 10, 1, 1, 'F');

        // Checkbox
        doc.setDrawColor(task.completed ? GREEN : BORDER);
        doc.setLineWidth(0.5);
        doc.roundedRect(16, y + 2, 5, 5, 1, 1, task.completed ? 'FD' : 'D');
        if (task.completed) {
          doc.setTextColor(WHITE);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.text('✓', 17.5, y + 6);
        }

        doc.setTextColor(task.completed ? GRAY : DARK);
        doc.setFontSize(8);
        doc.setFont('helvetica', task.completed ? 'normal' : 'bold');
        doc.text(task.title, 24, y + 6);

        if (task.description) {
          doc.setTextColor(GRAY);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(task.description, 170);
          doc.text(descLines, 24, y + 11);
        }

        y += task.description ? 17 : 13;
      }
      y += 3;
    }
  }

  // ── MEAL PLAN ──────────────────────────────────────────────────
  if (plan.planDays && plan.planDays.length > 0) {
    y = checkPageBreak(doc, y, 20, plan, pageRef);
    y = addSectionTitle(doc, `MEAL PLAN (${plan.planDays.length} days)`, y);

    for (const day of plan.planDays) {
      const dayTotalCals = day.meals.reduce((s, m) => s + m.totalCalories, 0);
      y = checkPageBreak(doc, y, 18, plan, pageRef);

      // Day header
      doc.setFillColor(GREEN);
      doc.roundedRect(13, y, 184, 10, 2, 2, 'F');
      doc.setTextColor(WHITE);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`Day ${day.day}  ·  ${format(new Date(day.date), 'EEEE, MMM d')}`, 17, y + 7);
      doc.setFontSize(8);
      doc.text(`${dayTotalCals} kcal total`, 193, y + 7, { align: 'right' });
      y += 13;

      for (const meal of day.meals) {
        y = checkPageBreak(doc, y, 14, plan, pageRef);

        // Meal row
        doc.setFillColor(LIGHT_GRAY);
        doc.roundedRect(16, y, 181, 8, 1, 1, 'F');
        doc.setTextColor(GRAY);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(meal.slot.toUpperCase(), 19, y + 5.5);
        doc.setTextColor(DARK);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(meal.name, 55, y + 5.5);
        doc.setTextColor(ORANGE);
        doc.text(`${meal.totalCalories} kcal`, 193, y + 5.5, { align: 'right' });
        y += 10;

        // Macros
        if (meal.totalProtein > 0 || meal.totalFat > 0 || meal.totalCarbs > 0) {
          doc.setTextColor(GRAY);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Protein: ${meal.totalProtein}g  ·  Fat: ${meal.totalFat}g  ·  Carbs: ${meal.totalCarbs}g`,
            19, y
          );
          y += 5;
        }

        // Ingredients
        if (meal.ingredients && meal.ingredients.length > 0) {
          for (const ing of meal.ingredients) {
            y = checkPageBreak(doc, y, 6, plan, pageRef);
            doc.setFillColor(WHITE);
            doc.setDrawColor(BORDER);
            doc.setLineWidth(0.2);
            doc.rect(19, y, 178, 5, 'FD');
            doc.setTextColor(DARK);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`· ${ing.name}`, 22, y + 3.5);
            doc.setTextColor(GRAY);
            doc.text(`${ing.quantity}g  ·  ${ing.calories} kcal`, 193, y + 3.5, { align: 'right' });
            y += 5.5;
          }
        }
        y += 3;
      }
      y += 5;
    }
  }

  // ── FOOTER on last page ────────────────────────────────────────
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(LIGHT_GRAY);
    doc.rect(0, 287, 210, 10, 'F');
    doc.setTextColor(GRAY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Nutrition Consultant App · AI-generated meal plans are suggestions only and should be reviewed by a qualified professional.', 10, 293);
    doc.text(`${i} / ${pageCount}`, 200, 293, { align: 'right' });
  }

  // Save
  const fileName = `${plan.clientName.replace(/\s+/g, '_')}_${plan.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(fileName);
}
