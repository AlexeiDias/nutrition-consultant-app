// src/components/ui/ExportPDFButton.tsx
'use client';

import { useState } from 'react';
import { ActionPlan } from '@/lib/types';
import { exportActionPlanPDF } from '@/lib/export-pdf';
import toast from 'react-hot-toast';

interface ExportPDFButtonProps {
  plan: ActionPlan;
  consultantName?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function ExportPDFButton({
  plan,
  consultantName,
  variant = 'secondary',
  className = '',
}: ExportPDFButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportActionPlanPDF(plan, consultantName);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  const base = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50';
  const styles = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {exporting ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          📄 Export PDF
        </>
      )}
    </button>
  );
}
