export const TODAY_STATS = {
  totalRevenue:    { value: 4820,  change: +12.5, label: "إجمالي الإيرادات", prefix: "", suffix: " د.ع" },
  totalOrders:     { value: 47,    change: +8.2,  label: "إجمالي الطلبات",   prefix: "", suffix: "" },
  dineIn:          { value: 18,    change: -3.1,  label: "تناول داخلي",      prefix: "", suffix: "" },
  takeaway:        { value: 15,    change: +15.0, label: "تيك أواي",          prefix: "", suffix: "" },
  delivery:        { value: 14,    change: +20.0, label: "توصيل",             prefix: "", suffix: "" },
  avgOrderValue:   { value: 102.5, change: +4.2,  label: "متوسط الطلب",      prefix: "", suffix: " د.ع" },
  activeDrivers:   { value: 2,     change: 0,     label: "مندوبو التوصيل",   prefix: "", suffix: "" },
  occupiedTables:  { value: 6,     change: 0,     label: "الطاولات المشغولة", prefix: "", suffix: "/16" },
};

export const HOURLY_DATA = [
  { hour: "8 ص",  orders: 3,  revenue: 210 },
  { hour: "9 ص",  orders: 5,  revenue: 380 },
  { hour: "10 ص", orders: 4,  revenue: 290 },
  { hour: "11 ص", orders: 7,  revenue: 560 },
  { hour: "12 م", orders: 12, revenue: 980 },
  { hour: "1 م",  orders: 9,  revenue: 720 },
  { hour: "2 م",  orders: 6,  revenue: 450 },
  { hour: "3 م",  orders: 4,  revenue: 320 },
  { hour: "4 م",  orders: 3,  revenue: 240 },
  { hour: "5 م",  orders: 5,  revenue: 400 },
  { hour: "6 م",  orders: 8,  revenue: 650 },
  { hour: "7 م",  orders: 10, revenue: 820 },
];

export const TOP_ITEMS = [
  { name: "كبسة دجاج",       sold: 24, revenue: 1320 },
  { name: "شاورما دجاج",     sold: 18, revenue: 504  },
  { name: "مشاوي مشكلة",     sold: 15, revenue: 1275 },
  { name: "مندي دجاج",       sold: 12, revenue: 720  },
  { name: "برجر لحم",         sold: 11, revenue: 495  },
];

export const WEEKLY_REVENUE = [
  { day: "الأحد",     revenue: 3200 },
  { day: "الاثنين",   revenue: 2800 },
  { day: "الثلاثاء",  revenue: 3600 },
  { day: "الأربعاء",  revenue: 4100 },
  { day: "الخميس",   revenue: 5200 },
  { day: "الجمعة",   revenue: 6800 },
  { day: "السبت",    revenue: 4820 },
];
