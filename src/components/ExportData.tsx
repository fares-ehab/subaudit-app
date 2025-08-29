import React, { useState, useMemo } from 'react';
import { Download, FileText, ChevronDown, Check, Code, Settings, X } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { format as formatDate } from 'date-fns';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subscription } from '../types';
import { useSubscriptions } from '../hooks/useSubscriptions';

// Custom type declaration for the autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Helper function to safely format CSV fields
const formatCsvField = (field: any): string => {
    const str = String(field ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

interface ExportDataProps {
  subscriptions?: Subscription[];
  title?: string;
}

type ExportFormat = 'csv' | 'txt' | 'pdf' | 'json';

const ALL_CSV_COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'cost', label: 'Cost' },
    { key: 'billing_cycle', label: 'Billing Cycle' },
    { key: 'next_renewal_date', label: 'Next Renewal' },
    { key: 'category', label: 'Category' },
    { key: 'is_active', label: 'Status' },
    { key: 'value_rating', label: 'Value Rating' },
    { key: 'last_used_date', label: 'Last Used' },
    { key: 'id', label: 'Subscription ID' },
];

const ExportData: React.FC<ExportDataProps> = ({ subscriptions: specificSubscriptions, title = "All Subscriptions" }) => {
  // If no specific list is provided (e.g., on the main dashboard), use the full list from the hook.
  const { allSubscriptions } = useSubscriptions({});
  const subscriptionsToExport = specificSubscriptions || allSubscriptions;

  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(['name', 'cost', 'billing_cycle', 'next_renewal_date', 'category', 'is_active'])
  );

  const analytics = useMemo(() => {
    const getMonthlyCost = (sub: Subscription) => {
        if (sub.billing_cycle === 'monthly') return sub.cost;
        if (sub.billing_cycle === 'yearly') return sub.cost / 12;
        if (sub.billing_cycle === 'weekly') return (sub.cost * 52) / 12;
        return 0;
    };
    const totalMonthlyCost = subscriptionsToExport.filter(s => s.is_active).reduce((total, sub) => total + getMonthlyCost(sub), 0);
    return { totalMonthlyCost };
  }, [subscriptionsToExport]);


  const handleExportClick = () => {
    if (subscriptionsToExport.length === 0) {
      toast.error('No data available to export');
      return;
    }
    if (format === 'csv') {
      setIsCsvModalOpen(true);
    } else {
      runExport(format);
    }
  };

  const runExport = (exportFormat: ExportFormat) => {
    setIsExporting(true);
    setIsCsvModalOpen(false);
    
    setTimeout(() => {
        try {
            switch (exportFormat) {
                case 'csv': exportToCSV(); break;
                case 'txt': generateTextReport(); break;
                case 'pdf': generatePdfReport(); break;
                case 'json': exportToJSON(); break;
            }
        } catch (error: any) {
            console.error("Export Error:", error);
            toast.error(`Failed to generate export: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    }, 500);
  };

  const exportToCSV = () => {
    const headers = ALL_CSV_COLUMNS.filter(c => selectedColumns.has(c.key)).map(c => c.label);
    const csvData = subscriptionsToExport.map(sub => {
        return ALL_CSV_COLUMNS.filter(c => selectedColumns.has(c.key)).map(col => {
            let value = sub[col.key as keyof Subscription];
            if (col.key === 'is_active') return value ? 'Active' : 'Cancelled';
            if ((col.key === 'next_renewal_date' || col.key === 'last_used_date') && value) {
                return formatDate(new Date(value as string), 'yyyy-MM-dd');
            }
            return value;
        });
    });
    const csvContent = `\uFEFF${[headers, ...csvData].map(row => row.map(formatCsvField).join(',')).join('\n')}`;
    downloadFile(csvContent, 'text/csv;charset=utf-8;', `subscriptions-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success("CSV export generated!");
  };

  const exportToJSON = () => {
    downloadFile(JSON.stringify(subscriptionsToExport, null, 2), 'application/json', `subscriptions-${new Date().toISOString().split('T')[0]}.json`);
    toast.success("JSON export generated!");
  };

  const generateTextReport = () => {
    const report = `
SUBSCRIPTION AUDIT REPORT - ${title}
Generated: ${formatDate(new Date(), 'MMMM dd, yyyy')}
---------------------------------
Total Subscriptions: ${subscriptionsToExport.length}
Monthly Spend: $${analytics.totalMonthlyCost.toFixed(2)}
Annual Projection: $${(analytics.totalMonthlyCost * 12).toFixed(2)}
    `.trim();
    downloadFile(report, 'text/plain', `subscription-report.txt`);
    toast.success("Text report generated!");
  };

  const generatePdfReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Subscription Report: ${title}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${formatDate(new Date(), 'MMMM dd, yyyy')}`, 14, 28);

     autoTable(doc, {
        startY: 35,
        head: [['Name', 'Cost', 'Billing Cycle', 'Category', 'Status']],
        body: subscriptionsToExport.map(s => [
            s.name || '',
            `$${(s.cost || 0).toFixed(2)}`,
            s.billing_cycle || '',
            s.category || '',
            s.is_active ? 'Active' : 'Canceled'
        ]),
        theme: 'grid'
    });
    
    doc.save(`subscription-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF report generated!");
  };

  const downloadFile = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (subscriptionsToExport.length === 0) return null;

  const formatOptions: Record<ExportFormat, { label: string; icon: React.ElementType }> = {
    csv: { label: 'CSV File', icon: Download },
    pdf: { label: 'PDF Report', icon: FileText },
    json: { label: 'JSON File', icon: Code },
    txt: { label: 'Text Summary', icon: FileText },
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
        <div>
            <h4 className="font-semibold text-gray-800">Export Options</h4>
            <p className="text-sm text-gray-500">Download a copy of your {title.toLowerCase()}.</p>
        </div>
        <div className="flex items-center space-x-2">
            <Menu as="div" className="relative">
                <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                    {formatOptions[format].label}
                    <ChevronDown className="-mr-1 h-5 w-5 text-gray-400" />
                </MenuButton>
                <MenuItems transition className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5">
                    <div className="py-1">
                        {Object.keys(formatOptions).map((key) => {
                            const f = key as ExportFormat;
                            return (
                                <MenuItem key={f}>
                                    <button onClick={() => setFormat(f)} className="group flex w-full items-center gap-2 rounded-lg py-1.5 px-3 data-[focus]:bg-gray-100 text-left">
                                        {format === f ? <Check className="h-4 w-4 text-indigo-600"/> : <div className="h-4 w-4"/>}
                                        {formatOptions[f].label}
                                    </button>
                                </MenuItem>
                            )
                        })}
                    </div>
                </MenuItems>
            </Menu>
            <button onClick={handleExportClick} disabled={isExporting} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold w-36 text-center flex items-center justify-center space-x-2">
                {isExporting ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : (format === 'csv' ? <Settings className="w-4 h-4" /> : <Download className="w-4 h-4" />)}
                <span>{isExporting ? 'Generating...' : (format === 'csv' ? 'Customize...' : 'Export')}</span>
            </button>
        </div>
      </div>

      <AnimatePresence>
        {isCsvModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Customize CSV Export</h3>
                <button onClick={() => setIsCsvModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"><X/></button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Select the columns to include in your export.</p>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {ALL_CSV_COLUMNS.map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={selectedColumns.has(key)} onChange={() => {
                          const newSet = new Set(selectedColumns);
                          if (newSet.has(key)) newSet.delete(key);
                          else newSet.add(key);
                          setSelectedColumns(newSet);
                      }} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-xl">
                <button onClick={() => runExport('csv')} disabled={isExporting || selectedColumns.size === 0} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2">
                  <Download size={16}/>
                  <span>Export {selectedColumns.size} Column(s)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExportData;
