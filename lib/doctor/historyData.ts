export type ClinicalRecordType = "CONSULTATION" | "PRESCRIPTION" | "TRIAGE_REPORT";

export interface PrescriptionMedicine {
  name: string;
  nameAr?: string;
  dosage: string;
  frequency: string;
  frequencyAr: string;
  duration: string;
  durationAr: string;
  notes?: string;
}

export interface PatientVitals {
  bp?: string;          // Blood pressure (e.g. 120/80)
  temp?: string;        // Temperature (e.g. 37.1 C)
  heartRate?: string;   // Pulse (e.g. 78 bpm)
  bloodSugar?: string;  // Glucose (e.g. 110 mg/dL)
  weight?: string;      // Weight (e.g. 74 kg)
}

export interface ClinicalHistoryItem {
  id: string;
  recordNumber: string; // e.g. "CR-2026-108"
  type: ClinicalRecordType;
  doctorId: string;
  doctorName: string;
  doctorNameAr: string;
  specialty: string;
  specialtyAr: string;
  
  // Patient details
  patientId: string;
  patientName: string;
  patientNameAr: string;
  patientAge: number;
  patientGender: "male" | "female";
  patientPhone: string;

  // Timestamps
  date: string;       // YYYY-MM-DD
  time: string;       // e.g. "10:30 AM"
  relativeTimeAr: string;
  relativeTimeEn: string;

  // Clinical Content
  title: string;
  titleAr: string;
  diagnosis?: string;
  diagnosisAr?: string;
  symptoms?: string;
  symptomsAr?: string;
  doctorNotes?: string;
  doctorNotesAr?: string;
  
  // Prescription specifics
  medicines?: PrescriptionMedicine[];
  
  // Triage specifics
  urgency: "High" | "Medium" | "Normal";
  status: "completed" | "reviewed" | "pending_action";
  triageNotes?: string;
  triageNotesAr?: string;
  triageSecretary?: string;
  urgencyReason?: string;

  // Vitals
  vitals?: PatientVitals;
}

export interface DoctorProfile {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  specialty: string;
  specialtyAr: string;
  department: string;
  departmentAr: string;
  licenseId: string;
  avatarBg: string;
  initials: string;
  totalCases: number;
  totalPrescriptions: number;
  pendingReviews: number;
}

export const CLINIC_DOCTORS: DoctorProfile[] = [
  {
    id: "doc-1",
    name: "Dr. Ahmed Hossam",
    nameAr: "د. أحمد حسام",
    title: "Consultant Cardiologist",
    titleAr: "استشاري أمراض القلب والقسطرة",
    specialty: "Cardiology",
    specialtyAr: "أمراض القلب والأوعية الدموية",
    department: "Cardiovascular Department",
    departmentAr: "قسم القلب والأوعية الدموية",
    licenseId: "MOH-EG-49120",
    avatarBg: "bg-blue-600 text-white",
    initials: "AH",
    totalCases: 148,
    totalPrescriptions: 112,
    pendingReviews: 2,
  },
  {
    id: "doc-2",
    name: "Dr. Tarek Omar",
    nameAr: "د. طارق عمر",
    title: "Specialist Internal Medicine",
    titleAr: "أخصائي الأمراض الباطنية والجهاز الهضمي",
    specialty: "Internal Medicine",
    specialtyAr: "الباطنة العامة والجهاز الهضمي",
    department: "Internal Medicine & GI",
    departmentAr: "قسم الباطنة والجهاز الهضمي",
    licenseId: "MOH-EG-38144",
    avatarBg: "bg-emerald-600 text-white",
    initials: "TO",
    totalCases: 124,
    totalPrescriptions: 98,
    pendingReviews: 1,
  },
  {
    id: "doc-3",
    name: "Dr. Sara Kamal",
    nameAr: "د. سارة كمال",
    title: "Consultant Pediatrician",
    titleAr: "استشارية طب الأطفال وحديثي الولادة",
    specialty: "Pediatrics",
    specialtyAr: "طب الأطفال وحديثي الولادة",
    department: "Pediatrics & Neonatology",
    departmentAr: "قسم الأطفال وحديثي الولادة",
    licenseId: "MOH-EG-52908",
    avatarBg: "bg-purple-600 text-white",
    initials: "SK",
    totalCases: 95,
    totalPrescriptions: 76,
    pendingReviews: 0,
  },
];

export const MOCK_CLINICAL_HISTORY: ClinicalHistoryItem[] = [
  {
    id: "hist-001",
    recordNumber: "CR-2026-101",
    type: "CONSULTATION",
    doctorId: "doc-1",
    doctorName: "Dr. Ahmed Hossam",
    doctorNameAr: "د. أحمد حسام",
    specialty: "Cardiology",
    specialtyAr: "أمراض القلب",
    patientId: "pat-101",
    patientName: "Kareem Tarek",
    patientNameAr: "كريم طارق",
    patientAge: 46,
    patientGender: "male",
    patientPhone: "+20 100 123 4567",
    date: "2026-09-03",
    time: "11:30 AM",
    relativeTimeAr: "اليوم 11:30 ص",
    relativeTimeEn: "Today at 11:30 AM",
    title: "Comprehensive Cardiac Follow-up & ECG Review",
    titleAr: "متابعة قلبية شاملة ومراجعة رسم القلب (ECG)",
    diagnosis: "Mild Stage 1 Essential Hypertension with sinus tachycardia.",
    diagnosisAr: "ارتفاع طفيف في ضغط الدم من الدرجة الأولى مع تسارع نبضات جيبي.",
    symptoms: "Occasional chest tightness after exertion, mild headache in the morning.",
    symptomsAr: "ضيق تنفس متقطع بعد المجهود، صداع خفيف في الصباح.",
    doctorNotes: "ECG normal, no ischemic changes. Advised salt restriction, 30 min daily walking, and starting low dose beta blocker.",
    doctorNotesAr: "رسم القلب طبيعي ولا توجد علامات نقص تروية. تم النصح بتقليل الأملاح والمشي ٣٠ دقيقة والبدء في خافض ضغط بجرعة مخفضة.",
    vitals: {
      bp: "142/90",
      temp: "36.8 °C",
      heartRate: "88 bpm",
      bloodSugar: "105 mg/dL",
      weight: "82 kg",
    },
    urgency: "Normal",
    status: "completed",
  },
  {
    id: "hist-002",
    recordNumber: "RX-2026-204",
    type: "PRESCRIPTION",
    doctorId: "doc-1",
    doctorName: "Dr. Ahmed Hossam",
    doctorNameAr: "د. أحمد حسام",
    specialty: "Cardiology",
    specialtyAr: "أمراض القلب",
    patientId: "pat-101",
    patientName: "Kareem Tarek",
    patientNameAr: "كريم طارق",
    patientAge: 46,
    patientGender: "male",
    patientPhone: "+20 100 123 4567",
    date: "2026-09-03",
    time: "11:45 AM",
    relativeTimeAr: "اليوم 11:45 ص",
    relativeTimeEn: "Today at 11:45 AM",
    title: "Cardiovascular Treatment Protocol",
    titleAr: "بروتوكول علاج القلب وضبط الضغط",
    diagnosis: "Stage 1 Hypertension & Rate Control",
    diagnosisAr: "ضبط ضغط الدم وتسارع ضربات القلب",
    medicines: [
      {
        name: "Concor 2.5mg (Bisoprolol)",
        nameAr: "كونكور ٢.٥ مجم",
        dosage: "1 tablet",
        frequency: "Once daily in the morning",
        frequencyAr: "قرص واحد يومياً صباحاً بعد الإفطار",
        duration: "30 days",
        durationAr: "لمدة شهر",
        notes: "Take consistently at the same time each day.",
      },
      {
        name: "Co-Exforge 5/160mg",
        nameAr: "كو-إكسفورج ٥/١٦٠ مجم",
        dosage: "1 tablet",
        frequency: "Once daily before sleep",
        frequencyAr: "قرص واحد يومياً قبل النوم",
        duration: "30 days",
        durationAr: "لمدة شهر",
      },
      {
        name: "Omega-3 1000mg",
        nameAr: "أوميجا ٣ كبسول",
        dosage: "1 capsule",
        frequency: "Once daily with lunch",
        frequencyAr: "كبسولة واحدة مع الغداء",
        duration: "60 days",
        durationAr: "لمدة شهرين",
      },
    ],
    doctorNotes: "Re-check blood pressure twice weekly and record in clinic app log.",
    doctorNotesAr: "قياس الضغط مرتين أسبوعياً وتسجيله في سجل المتابعة بالعيادة.",
    urgency: "Normal",
    status: "completed",
  },
  {
    id: "hist-003",
    recordNumber: "TR-2026-015",
    type: "TRIAGE_REPORT",
    doctorId: "doc-1",
    doctorName: "Dr. Ahmed Hossam",
    doctorNameAr: "د. أحمد حسام",
    specialty: "Cardiology",
    specialtyAr: "أمراض القلب",
    patientId: "pat-102",
    patientName: "Nouran Mahmoud",
    patientNameAr: "نوران محمود",
    patientAge: 32,
    patientGender: "female",
    patientPhone: "+20 102 345 6789",
    date: "2026-09-03",
    time: "10:15 AM",
    relativeTimeAr: "منذ ساعتين",
    relativeTimeEn: "2 hours ago",
    title: "Post-consultation Palpitations Triage Inquiry",
    titleAr: "استفسار طارئ حول نوبات خفقان بعد الدواء",
    urgency: "High",
    status: "reviewed",
    symptoms: "Sudden onset palpitation episodes (fluttering sensation in chest) lasting 10 minutes after morning medication.",
    symptomsAr: "نوبات خفقان مفاجئ (رفرفة بالصدر) استمرت ١٠ دقائق بعد جرعة الصباح.",
    triageSecretary: "Sarah Jenkins (Head Secretary)",
    triageNotes: "Patient contacted clinic WhatsApp in distress. Filtered and expedited for immediate doctor response.",
    triageNotesAr: "تواصلت المريضة عبر واتساب بقلق. تم الفرز وتمرير الحالة للطبيب للرد الفوري.",
    doctorNotes: "Reassuring: Benign extrasystoles likely triggered by caffeine. Advised to stop coffee, continue medication, and report back if recurrent.",
    doctorNotesAr: "مطمئن: ضربات قلب غير منتظمة حميدة مرتبطة بالكافيين. تم التوجيه بوقف المنبهات والاستمرار على العلاج والمتابعة إذا تكررت.",
    vitals: {
      bp: "118/76",
      heartRate: "92 bpm",
      temp: "37.0 °C",
    },
  },
  {
    id: "hist-004",
    recordNumber: "CR-2026-098",
    type: "CONSULTATION",
    doctorId: "doc-2",
    doctorName: "Dr. Tarek Omar",
    doctorNameAr: "د. طارق عمر",
    specialty: "Internal Medicine",
    specialtyAr: "الباطنة العامة",
    patientId: "pat-103",
    patientName: "Hany Youssef",
    patientNameAr: "هاني يوسف",
    patientAge: 58,
    patientGender: "male",
    patientPhone: "+20 103 456 7890",
    date: "2026-09-02",
    time: "02:15 PM",
    relativeTimeAr: "أمس 02:15 م",
    relativeTimeEn: "Yesterday at 02:15 PM",
    title: "Gastroenterology Evaluation & HbA1c Review",
    titleAr: "فحص باطني للجهاز الهضمي ومتابعة سكر تراكمي",
    diagnosis: "GERD (Gastroesophageal Reflux) with Type 2 Diabetes well-managed.",
    diagnosisAr: "ارتجاع مريء مع سكري نوع ثاني منتظم.",
    symptoms: "Heartburn after heavy meals, bloating, and postprandial fullness.",
    symptomsAr: "حموضة وحرقة بعد الوجبات، انتفاخ وثقل بعد الأكل.",
    doctorNotes: "Abdominal exam soft and non-tender. Prescribed PPI therapy for 4 weeks. Diet sheet provided.",
    doctorNotesAr: "فحص البطن سليم. تم وصف مثبط مضخة البروتون لمدة ٤ أسابيع وتقديم جدول غذائي مخصص.",
    vitals: {
      bp: "128/82",
      temp: "36.9 °C",
      bloodSugar: "138 mg/dL (Random)",
      weight: "88 kg",
    },
    urgency: "Normal",
    status: "completed",
  },
  {
    id: "hist-005",
    recordNumber: "RX-2026-190",
    type: "PRESCRIPTION",
    doctorId: "doc-2",
    doctorName: "Dr. Tarek Omar",
    doctorNameAr: "د. طارق عمر",
    specialty: "Internal Medicine",
    specialtyAr: "الباطنة العامة",
    patientId: "pat-103",
    patientName: "Hany Youssef",
    patientNameAr: "هاني يوسف",
    patientAge: 58,
    patientGender: "male",
    patientPhone: "+20 103 456 7890",
    date: "2026-09-02",
    time: "02:30 PM",
    relativeTimeAr: "أمس 02:30 م",
    relativeTimeEn: "Yesterday at 02:30 PM",
    title: "GERD & Metabolic Support Plan",
    titleAr: "علاج ارتجاع المريء وتنظيم الهضم",
    diagnosis: "Gastroesophageal Reflux Disease",
    diagnosisAr: "ارتجاع مريئي والتهاب المعدة",
    medicines: [
      {
        name: "Nexium 40mg (Esomeprazole)",
        nameAr: "نيكسيوم ٤٠ مجم",
        dosage: "1 tablet",
        frequency: "Once daily before breakfast by 30 mins",
        frequencyAr: "قرص واحد يومياً على الريق قبل الفطار بنصف ساعة",
        duration: "28 days",
        durationAr: "لمدة ٤ أسابيع",
      },
      {
        name: "Gaviscon Advance Oral Suspension",
        nameAr: "جافيسكون شراب",
        dosage: "10 ml",
        frequency: "After main meals and at bedtime",
        frequencyAr: "١٠ مل بعد الوجبات وقبل النوم",
        duration: "14 days",
        durationAr: "لمدة أسبوعين عند اللزوم",
      },
      {
        name: "Janumet 50/1000mg",
        nameAr: "جانوميت ٥٠/١٠٠٠ مجم",
        dosage: "1 tablet",
        frequency: "Twice daily with meals",
        frequencyAr: "قرص مرتين يومياً مع الوجبات",
        duration: "30 days",
        durationAr: "لمدة شهر (مستمر)",
      },
    ],
    doctorNotes: "Avoid citrus, spicy meals, and late dinner within 3 hours of sleep.",
    doctorNotesAr: "تجنب الأطعمة الدسمة والمتبلة والنوم مباشرة بعد العشاء.",
    urgency: "Normal",
    status: "completed",
  },
  {
    id: "hist-006",
    recordNumber: "TR-2026-012",
    type: "TRIAGE_REPORT",
    doctorId: "doc-2",
    doctorName: "Dr. Tarek Omar",
    doctorNameAr: "د. طارق عمر",
    specialty: "Internal Medicine",
    specialtyAr: "الباطنة العامة",
    patientId: "pat-104",
    patientName: "Mariam Khaled",
    patientNameAr: "مريم خالد",
    patientAge: 27,
    patientGender: "female",
    patientPhone: "+20 104 567 8901",
    date: "2026-09-01",
    time: "05:10 PM",
    relativeTimeAr: "منذ يومين",
    relativeTimeEn: "2 days ago",
    title: "Post-Antibiotic Rash & Nausea Report",
    titleAr: "تقرير طفح جلدي وغثيان بعد تناول المضاد الحيوي",
    urgency: "Medium",
    status: "reviewed",
    symptoms: "Skin redness on upper arms and mild nausea starting 2 hours after Amoxicillin dose.",
    symptomsAr: "احمرار جلدي بالذراعين وغثيان خفيف بعد جرعة الأموكسيسيلين بساعتين.",
    triageSecretary: "Dina Mansour (Receptionist)",
    triageNotes: "Secretary advised pausing antibiotic until doctor evaluation. WhatsApp conversation ongoing.",
    triageNotesAr: "السكرتيرة نصحت بوقف المضاد فوراً حتى فحص الطبيب والمحادثة جارية بالواتساب.",
    doctorNotes: "Likely drug allergy. Stop Amoxicillin permanently. Switch to Azithromycin 500mg once daily for 3 days. Prescribed Zyrtec 10mg.",
    urgencyReason: "Allergy risk",
  },
  {
    id: "hist-007",
    recordNumber: "CR-2026-090",
    type: "CONSULTATION",
    doctorId: "doc-3",
    doctorName: "Dr. Sara Kamal",
    doctorNameAr: "د. سارة كمال",
    specialty: "Pediatrics",
    specialtyAr: "طب الأطفال",
    patientId: "pat-105",
    patientName: "Omar Sherif (Child)",
    patientNameAr: "عمر شريف (طفل)",
    patientAge: 5,
    patientGender: "male",
    patientPhone: "+20 105 678 9012",
    date: "2026-09-01",
    time: "03:45 PM",
    relativeTimeAr: "منذ يومين",
    relativeTimeEn: "2 days ago",
    title: "Pediatric Upper Respiratory Tract Infection",
    titleAr: "فحص التهاب شعبي حاد ونزلة برد للأطفال",
    diagnosis: "Acute Viral Bronchitis with Mild Wheezing.",
    diagnosisAr: "نزلة شعبية فيروسية حادة مع تزييق خفيف بالصدر.",
    symptoms: "Cough worsening at night, runny nose, temperature 38.4 C for 24 hours.",
    symptomsAr: "سعال يزداد ليلاً، رشح، حرارة ٣٨.٤ ممتدة لـ ٢٤ ساعة.",
    doctorNotes: "Lungs clear bilaterally except mild expiratory wheeze. Good hydration, steam sessions recommended.",
    doctorNotesAr: "فحص الصدر يظهر تزييقاً خفيفاً بدون ضيق تنفس حاد. إعطاء سوائل دافئة وجلسات بخار.",
    vitals: {
      temp: "38.2 °C",
      heartRate: "110 bpm",
      weight: "18.5 kg",
    },
    urgency: "Medium",
    status: "completed",
  },
  {
    id: "hist-008",
    recordNumber: "RX-2026-175",
    type: "PRESCRIPTION",
    doctorId: "doc-3",
    doctorName: "Dr. Sara Kamal",
    doctorNameAr: "د. سارة كمال",
    specialty: "Pediatrics",
    specialtyAr: "طب الأطفال",
    patientId: "pat-105",
    patientName: "Omar Sherif (Child)",
    patientNameAr: "عمر شريف (طفل)",
    patientAge: 5,
    patientGender: "male",
    patientPhone: "+20 105 678 9012",
    date: "2026-09-01",
    time: "04:00 PM",
    relativeTimeAr: "منذ يومين",
    relativeTimeEn: "2 days ago",
    title: "Pediatric Cough & Antipyretic Protocol",
    titleAr: "روشتة علاج السعال وخافض الحرارة للأطفال",
    diagnosis: "Viral Bronchitis",
    diagnosisAr: "نزلة شعبية وسعال",
    medicines: [
      {
        name: "Cetal Pediatric Syrup (Paracetamol)",
        nameAr: "سيتال شراب للأطفال",
        dosage: "5 ml",
        frequency: "Every 6 hours if temp > 38.0",
        frequencyAr: "٥ سم كل ٦ ساعات عند ارتفاع الحرارة",
        duration: "4 days",
        durationAr: "لمدة ٤ أيام عند اللزوم",
      },
      {
        name: "Ventolin Syrup (Salbutamol)",
        nameAr: "فنتولين شراب",
        dosage: "2.5 ml",
        frequency: "Three times daily for 5 days",
        frequencyAr: "٢.٥ سم ٣ مرات يومياً بعد الأكل",
        duration: "5 days",
        durationAr: "لمدة ٥ أيام",
      },
      {
        name: "Physiomer Nasal Spray",
        nameAr: "بخاخ ماء بحر فيزيومير",
        dosage: "1 puff in each nostril",
        frequency: "Before sleep and upon waking",
        frequencyAr: "بخة في كل فتحة أنف قبل النوم وعند الاستيقاظ",
        duration: "7 days",
        durationAr: "لمدة أسبوع",
      },
    ],
    urgency: "Normal",
    status: "completed",
  },
];
