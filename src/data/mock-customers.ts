export interface PreviousCustomer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  defaultZoneId?: string;
  totalOrders: number;
}

export const MOCK_CUSTOMERS: PreviousCustomer[] = [
  { id: "c1", name: "أحمد محمد الرشيدي",       phone: "0501234567", address: "شارع الملك فهد، حي العليا",          defaultZoneId: "z1", totalOrders: 15 },
  { id: "c2", name: "خالد عبدالله السعيد",      phone: "0509876543", address: "حي النزهة، شارع التحلية",           defaultZoneId: "z3", totalOrders: 8  },
  { id: "c3", name: "فيصل محمد العتيبي",        phone: "0551122334", address: "حي الملقا، الدوار الثاني",          defaultZoneId: "z2", totalOrders: 22 },
  { id: "c4", name: "سارة عبدالعزيز القحطاني", phone: "0542233441", address: "شارع العروبة، حي السفارات",          defaultZoneId: "z1", totalOrders: 5  },
  { id: "c5", name: "نورة محمد الدوسري",        phone: "0566778899", address: "حي الروضة، شارع الأمير سلطان",      defaultZoneId: "z4", totalOrders: 11 },
  { id: "c6", name: "عبدالرحمن سعد الغامدي",   phone: "0533445566", address: "شارع الأمير محمد بن سعود",          defaultZoneId: "z2", totalOrders: 3  },
  { id: "c7", name: "منيرة علي الشهري",         phone: "0577889900", address: "حي الصفا، الطريق الدائري",          defaultZoneId: "z5", totalOrders: 7  },
  { id: "c8", name: "بدر سليمان المطيري",       phone: "0544332211", address: "طريق الملك عبدالعزيز، حي الورود",   defaultZoneId: "z3", totalOrders: 19 },
  { id: "c9", name: "ريم عبدالكريم العمري",     phone: "0555667788", address: "حي الربيع، شارع الجامعة",           defaultZoneId: "z6", totalOrders: 6  },
  { id: "c10", name: "ماجد إبراهيم الحربي",    phone: "0522334455", address: "حي الصحافة، شارع التعاون",          defaultZoneId: "z8", totalOrders: 14 },
];
