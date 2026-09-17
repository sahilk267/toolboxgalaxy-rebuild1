// Daily inspiring, soulful & peaceful du'as / quotes (Urdu, Hindi, English transliteration & translation)
export interface DailyDuaQuote {
  id: string;
  theme: string;
  arabic?: string;
  urdu: string;
  hindi: string;
  english: string;
  blessing: string;
  blessingUrdu?: string;
  blessingHindi?: string;
  blessingEnglish?: string;
}

export const dailyQuotesAndDuas: DailyDuaQuote[] = [
  {
    id: "quote-1",
    theme: "Sukoon & Barkat (Peace & Blessings)",
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
    urdu: "اے میرے رب! میرے سینے کو کھول دے اور میرے کام کو آسان فرما۔",
    hindi: "हे मेरे रब! मेरे सीने को खोल दे और मेरे हर काम को आसान बना दे।",
    english: "O my Lord! Open up for me my heart and ease for me my task.",
    blessing: "✨ Blessing: May God grant your heart peace, your face a smile, and blessings in every endeavor. Amen!",
    blessingUrdu: "✨ دعا: اللہ آپ کے دل کو سکون، چہرے پر مسکراہٹ اور ہر معاملے میں برکت عطا فرمائے۔ آمین!",
    blessingHindi: "✨ दुआ: ईश्वर आपके दिल को सुकून, चेहरे पर मुस्कुराहट और हर कार्य में बरकत प्रदान करे। आमीन!",
    blessingEnglish: "✨ Blessing: May God grant your heart peace, your face a smile, and blessings in every endeavor. Amen!"
  },
  {
    id: "quote-2",
    theme: "Rizq & Khair (Abundance & Goodness)",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
    urdu: "اے اللہ! میں تجھ سے نفع بخش علم، پاکیزہ رزق اور قبول ہونے والے عمل کا سوال کرتا ہوں۔",
    hindi: "हे ईश्वर! मुझे लाभदायक ज्ञान, पवित्र आजीविका और स्वीकार्य कर्म प्रदान करें।",
    english: "O God, I ask You for beneficial knowledge, good provision, and acceptable deeds.",
    blessing: "🤲 Blessing: May God bless your sustenance, health, and life with boundless abundance and good fortune.",
    blessingUrdu: "🤲 دعا: اللہ پاک آپ کے رزق، صحت، اور زندگی میں بے حساب برکت اور خیر عطا فرمائے۔",
    blessingHindi: "🤲 दुआ: ईश्वर आपकी आजीविका, स्वास्थ्य और जीवन में अपार बरकत और भलाई प्रदान करे।",
    blessingEnglish: "🤲 Blessing: May God bless your sustenance, health, and life with boundless abundance and good fortune."
  },
  {
    id: "quote-3",
    theme: "Mushkilat Ka Hal (Ease in Hardship)",
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    urdu: "اللہ ہمارے لیے کافی ہے اور وہ بہترین کارساز ہے۔",
    hindi: "ईश्वर हमारे लिए पर्याप्त है और वह सबसे उत्तम कार्यसाधक है।",
    english: "Sufficient for us is Allah, and He is the best Disposer of affairs.",
    blessing: "🌟 Blessing: May today bring you happiness, ease, and relief from every worry.",
    blessingUrdu: "🌟 دعا: آج کا دن آپ کے لیے خوشیوں، آسانیوں اور ہر غم سے نجات کا سبب بنے۔",
    blessingHindi: "🌟 दुआ: आज का दिन आपके लिए खुशियों, सुगमता और हर चिंता से मुक्ति का कारण बने।",
    blessingEnglish: "🌟 Blessing: May today bring you happiness, ease, and relief from every worry."
  },
  {
    id: "quote-4",
    theme: "Shukar & Rehmat (Gratitude & Mercy)",
    arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ",
    urdu: "اے میرے رب! مجھے توفیق دے کہ میں تیری اس نعمت کا شکر ادا کروں جو تو نے مجھ پر کی۔",
    hindi: "हे प्रभु! मुझे शक्ति दे कि मैं तेरी उन नेमतों का शुक्रगुज़ार रहूँ जो तूने मुझे बख्शी हैं।",
    english: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me.",
    blessing: "🌸 Blessing: May God always keep you and your loved ones joyful, safe, and protected.",
    blessingUrdu: "🌸 دعا: خدا آپ کو اور آپ کے تمام پیاروں کو ہمیشہ ہنستا مسکراتا اور سلامت رکھے۔",
    blessingHindi: "🌸 दुआ: ईश्वर आपको और आपके सभी अपनों को हमेशा मुस्कुराता और सुरक्षित रखे।",
    blessingEnglish: "🌸 Blessing: May God always keep you and your loved ones joyful, safe, and protected."
  },
  {
    id: "quote-5",
    theme: "Hidayat & Noor (Light & Guidance)",
    arabic: "اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا، وَفِي بَصَرِي نُورًا",
    urdu: "اے اللہ! میرے دل میں نور پیدا فرما اور میری نگاہوں میں روشنی عطا فرما۔",
    hindi: "हे ईश्वर! मेरे दिल में नूर भर दे और मेरी आँखों में रोशनी प्रदान कर।",
    english: "O Allah, place light in my heart, and light in my sight.",
    blessing: "💫 Blessing: May there be clarity in your thoughts, sweetness in your words, and success in every choice.",
    blessingUrdu: "💫 دعا: آپ کی سوچ میں نکھار، گفتگو میں مٹھاس اور زندگی کے ہر فیصلے میں کامیابی ہو۔",
    blessingHindi: "💫 दुआ: आपकी सोच में स्पष्टता, बातों में मिठास और हर निर्णय में सफलता मिले।",
    blessingEnglish: "💫 Blessing: May there be clarity in your thoughts, sweetness in your words, and success in every choice."
  },
  {
    id: "quote-6",
    theme: "Afiyat & Salamati (Health & Well-being)",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالآخِرَةِ",
    urdu: "اے اللہ! میں تجھ سے دنیا اور آخرت میں معافی اور عافیت مانگتا ہوں۔",
    hindi: "हे प्रभु! मैं तुझसे दुनिया और परलोक दोनों में सुरक्षा और भलाई की प्रार्थना करता हूँ।",
    english: "O Allah, I ask You for forgiveness and well-being in this world and the hereafter.",
    blessing: "🌹 Blessing: May God protect you from all harm, illness, and hardships. Amen!",
    blessingUrdu: "🌹 دعا: اللہ آپ کو ہر بری نظر، بیماری اور پریشانی سے اپنی پناہ میں رکھے۔ آمین!",
    blessingHindi: "🌹 दुआ: ईश्वर आपको हर कष्ट, बीमारी और परेशानी से अपनी शरण में रखे। आमीन!",
    blessingEnglish: "🌹 Blessing: May God protect you from all harm, illness, and hardships. Amen!"
  },
  {
    id: "quote-7",
    theme: "Umeed & Himmat (Hope & Strength)",
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    urdu: "بیشک ہر مشکل کے بعد آسانی ہے۔",
    hindi: "निश्चय ही हर कठिनाई के बाद सरलता और सहजता है।",
    english: "Indeed, with hardship comes ease.",
    blessing: "🌻 Blessing: May every shadow in your life turn into a bright morning of hope. Stay blessed!",
    blessingUrdu: "🌻 دعا: آپ کی زندگی کا ہر اندھیرا امید کی خوبصورت صبح میں بدل جائے۔ خوش رہیں!",
    blessingHindi: "🌻 दुआ: आपके जीवन का हर अंधेरा उम्मीद की सुंदर सुबह में बदल जाए। प्रसन्न रहें!",
    blessingEnglish: "🌻 Blessing: May every shadow in your life turn into a bright morning of hope. Stay blessed!"
  }
];

export function getDailyQuote(): DailyDuaQuote {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return dailyQuotesAndDuas[dayOfYear % dailyQuotesAndDuas.length];
}
