// Regional tools i18n dictionary: authentic bilingual support for high-demand South Asian tools
export type SupportedLang = "en" | "hi";

export const REGIONAL_TOOL_SLUGS = [
  "gst-tax-calculator",
  "passport-photo-resizer",
  "land-area-converter",
  "number-to-words-rupees",
  "whatsapp-direct-chat",
] as const;

export const REGIONAL_TOOL_KINDS = [
  "gstTax",
  "passportPhoto",
  "landArea",
  "numberToWords",
  "whatsappDirect",
] as const;

export function isRegionalTool(slugOrKind: string): boolean {
  if (!slugOrKind) return false;
  return (
    REGIONAL_TOOL_SLUGS.includes(slugOrKind as any) ||
    REGIONAL_TOOL_KINDS.includes(slugOrKind as any)
  );
}

// Hindi 0-99 numeral mapping for standard Indian banking & financial representation
const HINDI_NUMS_0_99 = [
  "शून्य", "एक", "दो", "तीन", "चार", "पांच", "छह", "सात", "आठ", "नौ",
  "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
  "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
  "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनतालीस",
  "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चवालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास",
  "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
  "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सरसठ", "अड़सठ", "उनहत्तर",
  "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उन्यासी",
  "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी",
  "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पंचानवे", "छानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे",
];

export function numberToHindiWords(num: number): string {
  if (!Number.isFinite(num) || num < 0) return "कृपया मान्य धनात्मक संख्या दर्ज करें।";
  if (num === 0) return "शून्य रुपये केवल";
  if (num > 999999999) return "राशि भारतीय मानक सीमा (99 करोड़) से अधिक है।";

  const intPart = Math.floor(num);
  const paise = Math.round((num - intPart) * 100);

  const parts: string[] = [];
  const crores = Math.floor(intPart / 10000000);
  const lakhs = Math.floor((intPart % 10000000) / 100000);
  const thousands = Math.floor((intPart % 100000) / 1000);
  const hundreds = Math.floor((intPart % 1000) / 100);
  const rest = Math.floor(intPart % 100);

  if (crores > 0) parts.push(`${HINDI_NUMS_0_99[crores]} करोड़`);
  if (lakhs > 0) parts.push(`${HINDI_NUMS_0_99[lakhs]} लाख`);
  if (thousands > 0) parts.push(`${HINDI_NUMS_0_99[thousands]} हज़ार`);
  if (hundreds > 0) parts.push(`${HINDI_NUMS_0_99[hundreds]} सौ`);
  if (rest > 0) parts.push(HINDI_NUMS_0_99[rest]);

  const rupeesStr = parts.length > 0 ? `${parts.join(" ")} रुपये` : "";
  const paiseStr = paise > 0 ? `${HINDI_NUMS_0_99[paise]} पैसे` : "";

  if (rupeesStr && paiseStr) {
    return `${rupeesStr} और ${paiseStr} केवल`;
  }
  if (rupeesStr) {
    return `${rupeesStr} केवल`;
  }
  if (paiseStr) {
    return `${paiseStr} केवल`;
  }
  return "शून्य रुपये केवल";
}

export const regionalTranslations = {
  en: {
    common: {
      langName: "English",
      otherLang: "हिन्दी",
      switchTo: "हिन्दी में बदलें",
      verifiedModule: "VERIFIED LOCAL MODULE",
      privacyNote: "Input stays in this browser tab.",
      telemetryDeck: ["LOCAL INSTRUMENT", "CURRENT-TAB EXECUTOR"],
      copy: "Copy",
      copied: "Copied!",
      backToTools: "← Back to tool foundry",
      inputDeck: "01 · INPUT DECK",
      localExecutor: "LOCAL EXECUTOR",
      outputBay: "02 · OUTPUT BAY",
      privacyRelay: "PRIVACY RELAY BUS",
      currentTabOnly: "CURRENT TAB ONLY",
    },
    whatsappDirect: {
      telemetry: ["COMMUNICATION RELAY", "DIRECT LINK / LOCAL"],
      badgeTitle: "100% Private & Direct:",
      badgeDesc: "Send WhatsApp messages to any unsaved contact number without adding them to your phone address book.",
      countryCodeLabel: "Country Code",
      phoneLabel: "Phone Number (Without 0 or country code)",
      phonePlaceholder: "e.g. 98765 43210",
      messageLabel: "Message (Optional / Pre-filled)",
      messagePlaceholder: "Type your message or pick a quick template below...",
      chars: "chars",
      openInWhatsapp: "Open in WhatsApp",
      copyChatLink: "Copy Chat Link",
      linkCopied: "Link Copied!",
      directUrl: "Direct URL:",
      qrInstruction: "Scan QR code with another phone camera or WhatsApp scanner to start chatting immediately.",
      templates: [
        { title: "Salam / Greetings", text: "Hello! Hope you are having a wonderful day." },
        { title: "Business Enquiry", text: "Hello! I saw your service/product and would like to inquire about pricing and details." },
        { title: "Location Request", text: "Hi! Could you please share your live Google Maps location?" },
        { title: "Payment Reminder", text: "Gentle reminder regarding the pending invoice/payment. Please let me know once processed." },
        { title: "Resume / Job Note", text: "Hello! I am sharing my CV/profile regarding the open opportunity." },
      ],
    },
    gstTax: {
      telemetry: ["TAX ENGINE", "INVOICE BREAKDOWN"],
      exclusiveMode: "➕ GST Exclusive (Add GST to Amount)",
      inclusiveMode: "🔄 GST Inclusive (Extract GST from Price)",
      exclusiveLabel: "Base Amount (Excluding GST)",
      inclusiveLabel: "Total Price (Including GST)",
      slabRateLabel: "GST Slab Rate (%)",
      jurisdictionInter: "Tax Jurisdiction: Inter-State (IGST 100%)",
      jurisdictionIntra: "Tax Jurisdiction: Intra-State (CGST 50% + SGST 50%)",
      switchToCgstSgst: "Switch to CGST + SGST",
      switchToIgst: "Switch to IGST",
      taxBreakdownTitle: "Tax & Price Breakdown",
      copyReceipt: "Copy Receipt",
      invoiceCopied: "Invoice Copied!",
      basePrice: "Base Price",
      cgst: "CGST",
      sgst: "SGST",
      igst: "IGST",
      totalTax: "Total Tax",
      finalInvoiceTotal: "FINAL INVOICE TOTAL",
      invoiceSubText: "Includes all taxes and base goods/services charge",
      invoiceReceiptHeader: "🧾 GST TAX INVOICE BREAKDOWN",
      typeExclusive: "GST Exclusive (Tax Added)",
      typeInclusive: "GST Inclusive (Tax Included)",
      totalAmountWord: "TOTAL AMOUNT",
    },
    passportPhoto: {
      telemetry: ["EXAM PORTAL SPEC", "COMPRESSION / MEMORY"],
      standardsTitle: "Government & Exam Portal Standards:",
      standardsDesc: "Meets strict size constraints for UPSC, SSC, Railways, State PSC, NTA, Nadra & College online admission forms (e.g. Photo 20KB-50KB, Signature 10KB-20KB).",
      presets: {
        sarkariPhoto: { title: "📸 Sarkari Photo", desc: "20KB – 50KB • 3.5×4.5 cm" },
        signature: { title: "✍️ Signature Box", desc: "10KB – 20KB • 3:1 Ratio" },
        passport: { title: "🛂 Passport 2×2\"", desc: "50KB – 100KB • 300 DPI" },
        custom: { title: "⚙️ Custom Pixels", desc: "Set exact W × H & Quality" },
      },
      uploadTitle: "Select Photo or Signature to Resize",
      uploadDesc: "Drag & drop or tap to choose JPG, PNG, or WebP. Processed 100% inside your device memory.",
      widthPx: "Width (px)",
      heightPx: "Height (px)",
      qualityLabel: "JPEG Quality / Compression",
      targetSize: "Target Output Size:",
      dimensions: "Dimensions:",
      downloadBtn: "Download",
      chooseNew: "Choose new photo",
      exactPreview: "Exact Scale Preview",
    },
    landArea: {
      telemetry: ["REGIONAL MATRIX", "PLOT CONVERTER"],
      bannerTitle: "South Asian Regional Land Calculator:",
      bannerDesc: "Instantly converts plot, field, and real estate measurements across Bigha, Marla, Kanal, Guntha, Gaj, Cent, Acre, and Square Feet.",
      amountLabel: "Land Area Amount",
      unitLabel: "Selected Measurement Unit",
      matrixTitle: "Complete Multi-Unit Conversion Matrix:",
      units: {
        sqft: { name: "Square Feet (Sq. Ft)", region: "Standard" },
        gaj: { name: "Square Gaj / Yard (Guz)", region: "North & Central India" },
        bigha_up: { name: "Bigha (UP / North standard)", region: "UP / Bihar" },
        bigha_punjab: { name: "Bigha (Punjab / Haryana)", region: "Punjab / Haryana" },
        bigha_bengal: { name: "Bigha (Bengal / East)", region: "West Bengal / Assam" },
        marla: { name: "Marla", region: "Punjab / Pakistan / Haryana" },
        kanal: { name: "Kanal (20 Marla)", region: "Punjab / Pakistan / J&K" },
        guntha: { name: "Guntha / Gunta", region: "Maharashtra / Gujarat / South" },
        cent: { name: "Cent / Decimal", region: "Kerala / TN / Andhra / Bengal" },
        acre: { name: "Acre (43,560 sq ft)", region: "Universal Standard" },
        hectare: { name: "Hectare (10,000 sq m)", region: "International" },
        sqm: { name: "Square Metres (Sq. M)", region: "Metric" },
      },
    },
    numberToWords: {
      telemetry: ["BANKING PROTOCOL", "CHEQUE FORMATTER"],
      bannerTitle: "Banking & Cheque Slip Generator:",
      bannerDesc: "Converts numerical amounts to Indian numbering words (Lakhs & Crores) formatted for Bank Cheques, Invoices, Slips, and Legal Agreements.",
      inputLabel: "Enter Amount in Numerals (₹ / Rs)",
      chequeFormatTitle: "BANK CHEQUE / SLIP FORMAT",
      copyWords: "Copy Words",
      copiedWords: "Copied to Clipboard!",
      rupeesInWords: "Rupees in Words:",
      hindiWordsLabel: "Words in Hindi (हिंदी अनुवाद):",
      indianNumbering: "Indian Numbering:",
      verifiedMath: "Verified Local Math",
    },
  },
  hi: {
    common: {
      langName: "हिन्दी",
      otherLang: "English",
      switchTo: "Switch to English",
      verifiedModule: "सत्यापित लोकल मॉड्यूल · 100% सुरक्षित",
      privacyNote: "आपका डेटा केवल इसी ब्राउज़र टैब में रहता है।",
      telemetryDeck: ["लोकल टूल इंजन", "ब्राउज़र टैब निष्पादक"],
      copy: "कॉपी करें",
      copied: "कॉपी हो गया!",
      backToTools: "← सभी टूल्स पर वापस जाएं",
      inputDeck: "01 · इनपुट डेक",
      localExecutor: "लोकल एक्ज़ीक्यूटर",
      outputBay: "02 · आउटपुट परिणाम",
      privacyRelay: "सुरक्षित लोकल रिले",
      currentTabOnly: "केवल वर्तमान टैब में",
    },
    whatsappDirect: {
      telemetry: ["डायरेक्ट संचार रिले", "डायरेक्ट लिंक / 100% लोकल"],
      badgeTitle: "100% सुरक्षित एवं डायरेक्ट:",
      badgeDesc: "बिना मोबाइल नंबर सेव किए किसी को भी सीधे व्हाट्सएप मैसेज भेजें। फोन डायरेक्टरी में सेव करने की आवश्यकता नहीं।",
      countryCodeLabel: "कंट्री कोड (देश कोड)",
      phoneLabel: "मोबाइल नंबर (बिना 0 या देश कोड के)",
      phonePlaceholder: "उदा. 98765 43210",
      messageLabel: "संदेश (वैकल्पिक / पहले से लिखा संदेश)",
      messagePlaceholder: "अपना संदेश यहाँ लिखें या नीचे दिए गए त्वरित टेम्पलेट में से चुनें...",
      chars: "अक्षर",
      openInWhatsapp: "व्हाट्सएप में खोलें",
      copyChatLink: "चैट लिंक कॉपी करें",
      linkCopied: "लिंक कॉपी हो गया!",
      directUrl: "डायरेक्ट URL:",
      qrInstruction: "तुरंत चैट शुरू करने के लिए किसी दूसरे फोन के कैमरे या व्हाट्सएप स्कैनर से यह क्यूआर कोड स्कैन करें।",
      templates: [
        { title: "नमस्ते / अभिवादन", text: "नमस्ते! आशा है आपका दिन मंगलमय और सफल हो।" },
        { title: "व्यापारिक पूछताछ", text: "नमस्ते! मैंने आपका उत्पाद/सेवा देखा। कृपया मूल्य और विस्तृत विवरण साझा करें।" },
        { title: "लोकेशन का अनुरोध", text: "नमस्ते! क्या आप कृपया अपनी वर्तमान गूगल मैप्स लोकेशन साझा कर सकते हैं?" },
        { title: "भुगतान अनुस्मारक", text: "लंबित इनवॉइस/बिल के संदर्भ में विनम्र अनुस्मारक। कृपया भुगतान होने पर सूचित करें।" },
        { title: "बायोडाटा / नौकरी आवेदन", text: "नमस्ते! मैं उपलब्ध रिक्त पद के लिए अपना बायोडाटा एवं विवरण प्रस्तुत कर रहा हूँ।" },
      ],
    },
    gstTax: {
      telemetry: ["टैक्स इंजन", "इनवॉइस रसीद व विभाजन"],
      exclusiveMode: "➕ जीएसटी अलग से जोड़ें (एक्सक्लूसिव)",
      inclusiveMode: "🔄 जीएसटी पहले से शामिल (इन्क्लूसिव)",
      exclusiveLabel: "मूल राशि (बिना जीएसटी कर के)",
      inclusiveLabel: "कुल मूल्य (जीएसटी कर सहित)",
      slabRateLabel: "जीएसटी स्लैब दर (%)",
      jurisdictionInter: "टैक्स क्षेत्राधिकार: अंतर-राज्यीय (IGST 100%)",
      jurisdictionIntra: "टैक्स क्षेत्राधिकार: राज्य के भीतर (CGST 50% + SGST 50%)",
      switchToCgstSgst: "CGST + SGST में बदलें",
      switchToIgst: "IGST में बदलें",
      taxBreakdownTitle: "टैक्स एवं मूल्य विभाजन",
      copyReceipt: "रसीद कॉपी करें",
      invoiceCopied: "रसीद कॉपी हो गई!",
      basePrice: "मूल मूल्य (Base Price)",
      cgst: "CGST",
      sgst: "SGST",
      igst: "IGST",
      totalTax: "कुल जीएसटी टैक्स",
      finalInvoiceTotal: "अंतिम कुल बिल राशि (Total Amount)",
      invoiceSubText: "सभी सरकारी टैक्स एवं मूल वस्तु/सेवा शुल्क सम्मिलित",
      invoiceReceiptHeader: "🧾 जीएसटी टैक्स इनवॉइस रसीद",
      typeExclusive: "जीएसटी अलग से जोड़ा गया (एक्सक्लूसिव)",
      typeInclusive: "जीएसटी पहले से शामिल (इन्क्लूसिव)",
      totalAmountWord: "कुल देय राशि",
    },
    passportPhoto: {
      telemetry: ["सरकारी परीक्षा मानक", "कम्प्रेशन / डिवाइस मेमोरी"],
      standardsTitle: "सरकारी व प्रतियोगी परीक्षा फॉर्म मानक:",
      standardsDesc: "UPSC, SSC, रेलवे, राज्य लोक सेवा आयोग, NTA व कॉलेज ऑनलाइन एडमिशन फॉर्म के लिए सटीक आकार (फोटो 20KB–50KB, हस्ताक्षर 10KB–20KB)।",
      presets: {
        sarkariPhoto: { title: "📸 सरकारी फॉर्म फोटो", desc: "20KB – 50KB • 3.5×4.5 सेमी" },
        signature: { title: "✍️ हस्ताक्षर बॉक्स", desc: "10KB – 20KB • 3:1 अनुपात" },
        passport: { title: "🛂 पासपोर्ट 2×2\"", desc: "50KB – 100KB • 300 DPI" },
        custom: { title: "⚙️ कस्टम साइज", desc: "इच्छानुसार चौड़ाई, ऊंचाई व क्वालिटी" },
      },
      uploadTitle: "रीसाइज़ करने के लिए फोटो या हस्ताक्षर चुनें",
      uploadDesc: "JPG, PNG या WebP फोटो चुनें या ड्रैग करें। फोटो 100% आपके डिवाइस की मेमोरी में सुरक्षित प्रोसेस होती है।",
      widthPx: "चौड़ाई (Width px)",
      heightPx: "ऊंचाई (Height px)",
      qualityLabel: "JPEG कम्प्रेशन / क्वालिटी",
      targetSize: "तैयार फाइल का साइज:",
      dimensions: "आकार (Dimensions):",
      downloadBtn: "फोटो डाउनलोड करें",
      chooseNew: "नई फोटो चुनें",
      exactPreview: "सटीक स्केल प्रीव्यू",
    },
    landArea: {
      telemetry: ["क्षेत्रीय भूमि माप", "प्लॉट क्षेत्रफल कनवर्टर"],
      bannerTitle: "क्षेत्रीय भूमि एवं प्लॉट क्षेत्रफल कैलकुलेटर:",
      bannerDesc: "बीघा, कट्ठा, मारला, कनाल, गुंठा, वर्ग गज, सेंट, एकड़ और वर्ग फुट में जमीन व प्लॉट का तुरंत सटीक रूपांतरण करें।",
      amountLabel: "जमीन का माप / क्षेत्रफल दर्ज करें",
      unitLabel: "वर्तमान माप इकाई चुनें",
      matrixTitle: "सम्पूर्ण इकाई रूपांतरण तालिका (Multi-Unit Matrix):",
      units: {
        sqft: { name: "वर्ग फुट (Sq. Feet)", region: "मानक पैमाना" },
        gaj: { name: "वर्ग गज / यार्ड (Guz)", region: "उत्तर व मध्य भारत" },
        bigha_up: { name: "बीघा (यूपी / उत्तर भारत मानक)", region: "उत्तर प्रदेश / बिहार" },
        bigha_punjab: { name: "बीघा (पंजाब / हरियाणा)", region: "पंजाब / हरियाणा" },
        bigha_bengal: { name: "बीघा (बंगाल / पूर्वी भारत)", region: "पश्चिम बंगाल / असम" },
        marla: { name: "मारला (Marla)", region: "पंजाब / हरियाणा" },
        kanal: { name: "कनाल (20 मारला)", region: "पंजाब / जम्मू-कश्मीर" },
        guntha: { name: "गुंठा / गुंटा (Guntha)", region: "महाराष्ट्र / गुजरात / दक्षिण भारत" },
        cent: { name: "सेंट / डेसिमल (Cent)", region: "केरल / तमिलनाडु / आंध्र / बंगाल" },
        acre: { name: "एकड़ (43,560 वर्ग फुट)", region: "अंतरराष्ट्रीय मानक" },
        hectare: { name: "हेक्टेयर (10,000 वर्ग मीटर)", region: "मीट्रिक मानक" },
        sqm: { name: "वर्ग मीटर (Sq. Metres)", region: "मीट्रिक पैमाना" },
      },
    },
    numberToWords: {
      telemetry: ["बैंकिंग प्रोटोकॉल", "चेक एवं स्लिप प्रारूप"],
      bannerTitle: "बैंकिंग एवं चेक राशि शब्द जनरेटर:",
      bannerDesc: "बैंक चेक, रसीद, इनवॉइस और कानूनी समझौतों के लिए अंकों को भारतीय अंकन प्रणाली (लाख और करोड़) में शब्दों में बदलें।",
      inputLabel: "अंकों में राशि दर्ज करें (₹ / Rs)",
      chequeFormatTitle: "बैंक चेक / स्लिप प्रारूप (CHEQUE FORMAT)",
      copyWords: "शब्द कॉपी करें",
      copiedWords: "क्लिपबोर्ड पर कॉपी हो गया!",
      rupeesInWords: "शब्दों में रुपये (English Bank Format):",
      hindiWordsLabel: "हिंदी में शब्द (Hindi Words):",
      indianNumbering: "भारतीय अंकन प्रणाली:",
      verifiedMath: "100% प्रमाणित लोकल गणना",
    },
  },
} as const;
