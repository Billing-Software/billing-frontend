export type SupportedLanguage = 'en' | 'te' | 'hi';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' }
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.new_bill': 'New Bill',
    'nav.invoices': 'Invoices & Bills',
    'nav.purchases': 'Purchases & Vendors',
    'nav.cashbank': 'Cash & Bank / Cheques',
    'nav.reports': 'GST Reports',
    'nav.customers': 'Customers & Parties',
    'nav.inventory': 'Inventory & Stock',
    'nav.services': 'Services Catalog',
    'nav.store': 'My Online Store',
    'nav.expenses': 'Expenses',
    'nav.branches': 'Branches',
    'nav.staff': 'Staff Management',
    'nav.settings': 'Settings',
    'nav.help': 'Help Center',

    // Actions & Buttons
    'btn.new_sale': 'New Sale (Alt+S)',
    'btn.save': 'Save',
    'btn.cancel': 'Cancel',
    'btn.print': 'Print Receipt',
    'btn.whatsapp': 'Share on WhatsApp',
    'btn.hold_bill': 'Hold Bill (F6)',
    'btn.resume_bill': 'Resume Bill',
    'btn.convert_to_sale': 'Convert to Sale',
    'btn.add_item': 'Add Item',
    'btn.add_payment': 'Add Payment',
    'btn.export_pdf': 'Export PDF',
    'btn.export_excel': 'Export Excel',
    'btn.generate_eway': 'E-Way Bill JSON',

    // Financial Terms
    'term.receivables': "You'll Get",
    'term.payables': "You'll Give",
    'term.cash_in_hand': 'Cash in Hand',
    'term.bank_balance': 'Bank Balance',
    'term.stock_value': 'Total Stock Value',
    'term.today_sales': "Today's Sales",
    'term.gross_profit': 'Gross Profit',
    'term.net_profit': 'Net Profit',
    'term.subtotal': 'Subtotal',
    'term.tax': 'GST Tax',
    'term.total': 'Total Amount',
    'term.balance': 'Balance Due'
  },

  te: {
    // Navigation
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.new_bill': 'కొత్త బిల్లు',
    'nav.invoices': 'ఇన్వాయిస్‌లు & బిల్లులు',
    'nav.purchases': 'కొనుగోళ్లు & సప్లయర్లు',
    'nav.cashbank': 'నగదు, బ్యాంక్ & చెక్కులు',
    'nav.reports': 'జీఎస్టీ నివేదికలు',
    'nav.customers': 'కస్టమర్లు & ఖాతా',
    'nav.inventory': 'స్టాక్ & వస్తువులు',
    'nav.services': 'సేవల జాబితా',
    'nav.store': 'ఆన్‌లైన్ స్టోర్',
    'nav.expenses': 'ఖర్చులు',
    'nav.branches': 'బ్రాంచీలు',
    'nav.staff': 'సిబ్బంది నిర్వహణ',
    'nav.settings': 'సెట్టింగ్‌లు',
    'nav.help': 'సహాయ కేంద్రం',

    // Actions & Buttons
    'btn.new_sale': 'కొత్త అమ్మకం (Alt+S)',
    'btn.save': 'సేవ్ చేయండి',
    'btn.cancel': 'రద్దు చేయండి',
    'btn.print': 'ప్రింట్ బిల్లు',
    'btn.whatsapp': 'వాట్సాప్‌లో పంపండి',
    'btn.hold_bill': 'బిల్లు హోల్డ్ (F6)',
    'btn.resume_bill': 'బిల్లు కొనసాగించండి',
    'btn.convert_to_sale': 'అమ్మకంగా మార్చండి',
    'btn.add_item': 'వస్తువును జోడించండి',
    'btn.add_payment': 'చెల్లింపు జోడించండి',
    'btn.export_pdf': 'పీడీఎఫ్ డౌన్‌లోడ్',
    'btn.export_excel': 'ఎక్సెల్ డౌన్‌లోడ్',
    'btn.generate_eway': 'ఈ-వే బిల్లు JSON',

    // Financial Terms
    'term.receivables': 'రావలసిన మొత్తం (You\'ll Get)',
    'term.payables': 'చెల్లించవలసిన మొత్తం (You\'ll Give)',
    'term.cash_in_hand': 'నగదు నిల్వ (Cash in Hand)',
    'term.bank_balance': 'బ్యాంక్ నిల్వ (Bank Balance)',
    'term.stock_value': 'మొత్తం స్టాక్ విలువ',
    'term.today_sales': 'నేటి అమ్మకాలు',
    'term.gross_profit': 'స్థూల లాభం',
    'term.net_profit': 'నికర లాభం',
    'term.subtotal': 'మొత్తం',
    'term.tax': 'జీఎస్టీ పన్ను',
    'term.total': 'మొత్తం చెల్లింపు',
    'term.balance': 'బాకీ నిల్వ'
  },

  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.new_bill': 'नया बिल',
    'nav.invoices': 'बिल व इनवॉइस',
    'nav.purchases': 'खरीद व सप्लायर्स',
    'nav.cashbank': 'कैश, बैंक व चेक',
    'nav.reports': 'जीएसटी रिपोर्ट्स',
    'nav.customers': 'ग्राहक व खाता',
    'nav.inventory': 'स्टॉक व सामान',
    'nav.services': 'सेवा सूची',
    'nav.store': 'ऑनलाइन दुकान',
    'nav.expenses': 'खर्चे',
    'nav.branches': 'शाखाएं',
    'nav.staff': 'स्टाफ प्रबंधन',
    'nav.settings': 'सेटिंग्स',
    'nav.help': 'मदद केंद्र',

    // Actions & Buttons
    'btn.new_sale': 'नई बिक्री (Alt+S)',
    'btn.save': 'सहेजें',
    'btn.cancel': 'रद्द करें',
    'btn.print': 'बिल प्रिंट करें',
    'btn.whatsapp': 'व्हाट्सएप पर भेजें',
    'btn.hold_bill': 'बिल रोकें (F6)',
    'btn.resume_bill': 'बिल जारी रखें',
    'btn.convert_to_sale': 'बिक्री में बदलें',
    'btn.add_item': 'सामान जोड़ें',
    'btn.add_payment': 'भुगतान जोड़ें',
    'btn.export_pdf': 'पीडीएफ निर्यात',
    'btn.export_excel': 'एक्सेल निर्यात',
    'btn.generate_eway': 'ई-वे बिल JSON',

    // Financial Terms
    'term.receivables': 'लेने हैं (You\'ll Get)',
    'term.payables': 'देने हैं (You\'ll Give)',
    'term.cash_in_hand': 'हाथ में नकद',
    'term.bank_balance': 'बैंक शेष',
    'term.stock_value': 'कुल स्टॉक मूल्य',
    'term.today_sales': 'आज की बिक्री',
    'term.gross_profit': 'सकल लाभ',
    'term.net_profit': 'शुद्ध लाभ',
    'term.subtotal': 'उप-योग',
    'term.tax': 'जीएसटी कर',
    'term.total': 'कुल राशि',
    'term.balance': 'बकाया राशि'
  }
};

export const getTranslation = (lang: SupportedLanguage, key: string): string => {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
};
