import React, { useState, useEffect } from 'react';
import { 
  Loader2, Download, X, CheckCircle, Ban, 
  BarChart3, FileText, Plus, DollarSign 
} from 'lucide-react';
import { Transaction, Invoice, UserSettings, Page, InvoiceStatus } from './types';
import { getFreshDemoData } from './constants';
import { getFinancialInsights } from './services/geminiService';

export default function App() {
  // Navigation State
  const [activePage, setActivePage] = useState<Page>(Page.Dashboard);
  
  // Data State
  const [data] = useState(() => getFreshDemoData());
  const [transactions, setTransactions] = useState<Transaction[]>(data.transactions);
  const [invoices, setInvoices] = useState<Invoice[]>(data.invoices);
  const [settings, setSettings] = useState<UserSettings>(data.settings);
  
  // UI State
  const [drawerMode, setDrawerMode] = useState<'edit_inv' | 'new_inv' | null>(null);
  const [activeItem, setActiveItem] = useState<Invoice | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Load Insights on Dashboard mount
  useEffect(() => {
    if (activePage === Page.Dashboard) {
      loadInsight();
    }
  }, [activePage]);

  const loadInsight = async () => {
    setLoadingInsight(true);
    const result = await getFinancialInsights(transactions, invoices, settings.taxRate);
    setInsight(result);
    setLoadingInsight(false);
  };

  // Handlers
  const handleDirectExportPDF = async () => {
    setIsGeneratingPdf(true);
    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGeneratingPdf(false);
    alert('PDF Exported successfully!');
  };

  const toggleInvoicePaidStatus = (invoice: Invoice) => {
    if (!invoice) return;
    const newStatus: InvoiceStatus = invoice.status === 'paid' ? 'unpaid' : 'paid';
    
    const updateInvoice = (inv: Invoice) => 
      inv.id === invoice.id ? { ...inv, status: newStatus } : inv;

    setInvoices(prev => prev.map(updateInvoice));
    setActiveItem(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const voidInvoice = (invoice: Invoice) => {
    if (!invoice) return;
    
    const updateInvoice = (inv: Invoice) => 
      inv.id === invoice.id ? { ...inv, status: 'void' as InvoiceStatus } : inv;

    setInvoices(prev => prev.map(updateInvoice));
    setActiveItem(prev => prev ? { ...prev, status: 'void' as InvoiceStatus } : null);
  };

  // Renderers
  const renderDrawer = () => {
    if (!drawerMode || !activeItem) return null;

    return (
      <div className="fixed inset-y-0 right-0 w-[500px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col z-50 transition-transform">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {drawerMode === 'edit_inv' ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button 
            onClick={() => { setDrawerMode(null); setActiveItem(null); }}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Edit Invoice Mode - Added Action Bar */}
          {drawerMode === 'edit_inv' && activeItem.id && (
              <div className="bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg flex items-center justify-between mb-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex gap-2 w-full">
                      <button 
                          type="button"
                          onClick={handleDirectExportPDF}
                          disabled={isGeneratingPdf}
                          className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all ${isGeneratingPdf ? 'opacity-70 cursor-wait' : ''}`}
                      >
                          {isGeneratingPdf ? <Loader2 size={18} className="animate-spin text-blue-600" /> : <Download size={18} />}
                          <span className="text-[10px] font-bold uppercase tracking-wider">{isGeneratingPdf ? 'Generating...' : 'Export PDF'}</span>
                      </button>
                      
                      <button 
                          type="button"
                          onClick={() => toggleInvoicePaidStatus(activeItem)}
                          disabled={activeItem.status === 'void'}
                          className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 rounded-md border shadow-sm transition-all ${
                              activeItem.status === 'void' 
                                  ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-500' 
                                  : activeItem.status === 'paid' 
                                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 hover:bg-orange-100' 
                                      : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                      >
                          {activeItem.status === 'paid' ? <X size={18} /> : <CheckCircle size={18} />}
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                              {activeItem.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          </span>
                      </button>

                      {activeItem.status !== 'void' && (
                          <button 
                              type="button"
                              onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  voidInvoice(activeItem);
                              }}
                              className="flex-1 py-2.5 flex flex-col items-center justify-center gap-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 shadow-sm transition-all"
                          >
                              <Ban size={18} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Void</span>
                          </button>
                      )}
                  </div>
              </div>
          )}
          
          {/* Invoice Details Display */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Invoice Number</label>
                 <div className="font-mono text-lg">{activeItem.id}</div>
               </div>
               <div>
                 <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Date</label>
                 <div>{activeItem.date}</div>
               </div>
            </div>
            
            <div>
               <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Client</label>
               <div className="text-lg font-medium">{activeItem.client}</div>
               <div className="text-slate-500 text-sm">{activeItem.clientCompany}</div>
            </div>

            <div>
               <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Description</label>
               <div>{activeItem.description}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
               <div className="flex justify-between items-center mb-2">
                 <span className="font-medium">Total Amount</span>
                 <span className="text-xl font-bold">${activeItem.amount.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center text-sm text-slate-500">
                 <span>Status</span>
                 <span className="capitalize">{activeItem.status}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Moniezi
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActivePage(Page.Dashboard)}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activePage === Page.Dashboard 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BarChart3 size={20} className="mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => setActivePage(Page.Invoices)}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${
              activePage === Page.Invoices 
                ? 'bg-blue-50 text-blue-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FileText size={20} className="mr-3" /> Invoices
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="p-8 max-w-7xl mx-auto">
          {activePage === Page.Dashboard && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
              
              {/* AI Insight Card */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    {loadingInsight ? <Loader2 className="animate-spin" /> : <DollarSign />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">CFO Assistant Insight</h3>
                    <p className="text-blue-50 leading-relaxed text-lg">
                      {loadingInsight ? "Analyzing your latest financial data..." : insight || "No insights available at the moment."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-sm font-medium text-slate-500 mb-2">Total Income</div>
                  <div className="text-3xl font-bold text-emerald-600">
                    ${transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-sm font-medium text-slate-500 mb-2">Total Expenses</div>
                  <div className="text-3xl font-bold text-red-600">
                    ${transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-sm font-medium text-slate-500 mb-2">Pending Invoices</div>
                  <div className="text-3xl font-bold text-orange-600">
                    ${invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === Page.Invoices && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Invoices</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
                  <Plus size={18} /> New Invoice
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      <th className="px-6 py-4 text-left">Client</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Amount</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900">{invoice.client}</td>
                        <td className="px-6 py-4 text-slate-500">{invoice.date}</td>
                        <td className="px-6 py-4 font-medium">${invoice.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                            invoice.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            invoice.status === 'void' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            'bg-orange-50 text-orange-700 border-orange-100'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => { setActiveItem(invoice); setDrawerMode('edit_inv'); }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Overlays */}
      {drawerMode && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setDrawerMode(null)}
        />
      )}
      {renderDrawer()}
    </div>
  );
}