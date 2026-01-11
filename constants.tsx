

export const CATS_IN = [
  "Sales / Services",
  "Consulting / Freelance",
  "Product Sales",
  "Affiliate / Referral",
  "Interest / Bank",
  "Refunds",
  "Other Income"
];

export const CATS_OUT = [
  "Advertising / Marketing",
  "Software / SaaS",
  "Rent / Workspace",
  "Utilities",
  "Office Supplies",
  "Phone / Internet",
  "Travel",
  "Meals (Business)",
  "Professional Services",
  "Insurance",
  "Contractors",
  "Payroll",
  "Taxes & Licenses",
  "Equipment",
  "Shipping / Delivery",
  "Bank Fees",
  "Other Expense"
];

export const CATS_BILLING = [
  "Web Development",
  "Graphic Design",
  "Strategy Consulting",
  "Content Writing",
  "Digital Marketing",
  "Maintenance Retainer",
  "Software Licensing",
  "Project Milestone",
  "Training / Workshop",
  "Other Service"
];

export const DEFAULT_PAY_PREFS = [
  "Card", "Bank Transfer", "Cash", "PayPal", "Stripe", "Zelle", "Venmo", "Wise"
];

export const DB_KEY = "moniezi_v7_data";

// --- Tax Constants (2025 Estimates) ---
export const TAX_CONSTANTS = {
  // Estimated 2025 Standard Deductions
  STD_DEDUCTION_SINGLE: 15000, 
  STD_DEDUCTION_JOINT: 30000,
  STD_DEDUCTION_HEAD: 22500,
  // Self Employment Tax (Social Security 12.4% + Medicare 2.9%)
  SE_TAX_RATE: 0.153,
  // Only 92.35% of net earnings are subject to SE tax
  SE_TAXABLE_PORTION: 0.9235 
};

// --- Tax Planner Constants (2026 Estimates) ---
export const TAX_PLANNER_2026 = {
  STD_DEDUCTION_SINGLE: 16100,
  STD_DEDUCTION_JOINT: 32200,
  STD_DEDUCTION_HEAD: 24150,
  SE_TAX_RATE: 0.153
};

// --- Demo Data Generator ---
export const getFreshDemoData = () => {
  const FIXED_DATE = '2026-01-01';

  return {
    settings: {
      businessName: "Acme Creative Studio",
      ownerName: "Alex Rivera",
      businessAddress: "123 Innovation Blvd, Tech City, CA 90210",
      businessEmail: "hello@acmecreative.com",
      businessPhone: "(555) 123-4567",
      businessWebsite: "www.acmecreative.com",
      payPrefs: DEFAULT_PAY_PREFS,
      taxRate: 15, // Realistic effective federal income tax rate
      stateTaxRate: 5, // Example state tax
      taxEstimationMethod: 'custom' as const,
      filingStatus: 'single' as const,
      currencySymbol: "$",
      defaultInvoiceTerms: "Net 15. Please make checks payable to Acme Creative Studio.",
      defaultInvoiceNotes: "Thank you for your business!"
    },
    transactions: [
      { id: "demo_1", name: "Premium Client Payment", amount: 4500, category: "Consulting / Freelance", date: FIXED_DATE, type: "income" },
      { id: "demo_2", name: "Monthly Office Rent", amount: 1200, category: "Rent / Workspace", date: FIXED_DATE, type: "expense" },
      { id: "demo_3", name: "AWS Cloud Services", amount: 89.50, category: "Software / SaaS", date: FIXED_DATE, type: "expense" },
      { id: "demo_4", name: "Adobe Creative Cloud", amount: 52.99, category: "Software / SaaS", date: FIXED_DATE, type: "expense" },
      { id: "demo_5", name: "Website Project - Milestone 1", amount: 2200, category: "Sales / Services", date: FIXED_DATE, type: "income" },
      { id: "demo_6", name: "Business Lunch w/ Partner", amount: 65.20, category: "Meals (Business)", date: FIXED_DATE, type: "expense" },
      // Added missing linked transaction for the paid demo invoice below
      { id: "tx_linked_demo_2", name: "Pmt: Nexus Tech - UI Audit", amount: 1500, category: "Sales / Services", date: FIXED_DATE, type: "income", notes: "Linked to invoice inv_demo_2" },
      { id: "demo_7", name: "Facebook Ads Campaign", amount: 500, category: "Advertising / Marketing", date: FIXED_DATE, type: "expense" },
      { id: "demo_8", name: "Shopify Store Sales", amount: 840, category: "Product Sales", date: FIXED_DATE, type: "income" },
      { id: "demo_9", name: "G-Suite Subscription", amount: 12, category: "Software / SaaS", date: FIXED_DATE, type: "expense" },
    ],
    invoices: [
      { 
        id: "inv_demo_1", client: "Starlight Media", 
        clientCompany: "Starlight Media Group",
        clientAddress: "456 Hollywood Blvd, Los Angeles, CA",
        amount: 3200, category: "Consulting / Freelance", 
        description: "Brand Strategy & Logo Design", 
        date: FIXED_DATE, due: FIXED_DATE, status: "unpaid",
        items: [
          { id: '1', description: 'Brand Strategy Session', quantity: 1, rate: 1200 },
          { id: '2', description: 'Logo Design Concepts (3 Revisions)', quantity: 1, rate: 2000 }
        ],
        subtotal: 3200,
        notes: "Looking forward to our next phase."
      },
      { 
        id: "inv_demo_2", client: "Nexus Tech", amount: 1500, category: "Sales / Services", 
        description: "UI Audit Report", date: FIXED_DATE, due: FIXED_DATE, status: "paid", linkedTransactionId: "tx_linked_demo_2",
        items: [
           { id: '1', description: 'Full UI/UX Audit', quantity: 10, rate: 150 }
        ],
        subtotal: 1500
      },
      { 
        id: "inv_demo_3", client: "Global Green Inc", amount: 5000, category: "Consulting / Freelance", 
        description: "Q3 Marketing Consultation", date: FIXED_DATE, due: FIXED_DATE, status: "unpaid",
        poNumber: "PO-998877",
        items: [
           { id: '1', description: 'Q3 Marketing Strategy', quantity: 1, rate: 5000 }
        ],
        subtotal: 5000,
        terms: "Net 30"
      }
    ],
    taxPayments: [
      { id: "tax_demo_1", date: FIXED_DATE, amount: 500, type: "Estimated", note: "Q1 Estimate" }
    ]
  };
};