import type { MenuItem, MenuCategory } from "./mock-types";

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: "appetizers", name: "مقبلات",         icon: "appetizers", itemCount: 6 },
  { id: "soups",      name: "شوربات",          icon: "soups",      itemCount: 4 },
  { id: "mains",      name: "أطباق رئيسية",   icon: "mains",      itemCount: 8 },
  { id: "grills",     name: "مشويات",          icon: "grills",     itemCount: 6 },
  { id: "sandwiches", name: "ساندويشات",       icon: "sandwiches", itemCount: 5 },
  { id: "drinks",     name: "مشروبات",         icon: "drinks",     itemCount: 8 },
  { id: "desserts",   name: "حلويات",          icon: "desserts",   itemCount: 5 },
];

export const MENU_ITEMS: MenuItem[] = [
  // مقبلات
  { id: "m01", name: "حمص بالطحينة",          nameEn: "Hummus",               category: "appetizers", price: 18, image: "", available: true,  preparationTime: 5  },
  { id: "m02", name: "متبل باذنجان",           nameEn: "Baba Ganoush",         category: "appetizers", price: 20, image: "", available: true,  preparationTime: 5  },
  { id: "m03", name: "فتوش",                   nameEn: "Fattoush",             category: "appetizers", price: 22, image: "", available: true,  preparationTime: 8  },
  { id: "m04", name: "تبولة",                  nameEn: "Tabbouleh",            category: "appetizers", price: 22, image: "", available: true,  preparationTime: 8  },
  { id: "m05", name: "فلافل (6 قطع)",          nameEn: "Falafel",              category: "appetizers", price: 25, image: "", available: true,  preparationTime: 10 },
  { id: "m06", name: "ورق عنب",               nameEn: "Grape Leaves",         category: "appetizers", price: 30, image: "", available: false, preparationTime: 15 },
  // شوربات
  { id: "m07", name: "شوربة عدس",             nameEn: "Lentil Soup",          category: "soups",      price: 20, image: "", available: true,  preparationTime: 10 },
  { id: "m08", name: "شوربة طماطم",           nameEn: "Tomato Soup",          category: "soups",      price: 18, image: "", available: true,  preparationTime: 10 },
  { id: "m09", name: "شوربة دجاج",            nameEn: "Chicken Soup",         category: "soups",      price: 25, image: "", available: true,  preparationTime: 12 },
  { id: "m10", name: "شوربة مأكولات بحرية",   nameEn: "Seafood Soup",         category: "soups",      price: 35, image: "", available: true,  preparationTime: 15 },
  // أطباق رئيسية
  { id: "m11", name: "كبسة دجاج",             nameEn: "Chicken Kabsa",        category: "mains",      price: 55, image: "", available: true,  preparationTime: 25 },
  { id: "m12", name: "كبسة لحم",              nameEn: "Lamb Kabsa",           category: "mains",      price: 75, image: "", available: true,  preparationTime: 30 },
  { id: "m13", name: "مندي دجاج",             nameEn: "Chicken Mandi",        category: "mains",      price: 60, image: "", available: true,  preparationTime: 30 },
  { id: "m14", name: "مندي لحم",              nameEn: "Lamb Mandi",           category: "mains",      price: 80, image: "", available: true,  preparationTime: 35 },
  { id: "m15", name: "ماكرونة بالدجاج",       nameEn: "Pasta with Chicken",   category: "mains",      price: 45, image: "", available: true,  preparationTime: 20 },
  { id: "m16", name: "أرز بالخضار",           nameEn: "Vegetable Rice",       category: "mains",      price: 35, image: "", available: true,  preparationTime: 20 },
  { id: "m17", name: "فريكة بالدجاج",         nameEn: "Freekeh with Chicken", category: "mains",      price: 58, image: "", available: false, preparationTime: 25 },
  { id: "m18", name: "صينية دجاج بالخضار",   nameEn: "Chicken Tray",         category: "mains",      price: 65, image: "", available: true,  preparationTime: 30 },
  // مشويات
  { id: "m19", name: "مشاوي مشكلة (للشخص)",  nameEn: "Mixed Grill",          category: "grills",     price: 85, image: "", available: true,  preparationTime: 20 },
  { id: "m20", name: "كباب دجاج",             nameEn: "Chicken Kebab",        category: "grills",     price: 55, image: "", available: true,  preparationTime: 15 },
  { id: "m21", name: "كباب لحم",              nameEn: "Meat Kebab",           category: "grills",     price: 65, image: "", available: true,  preparationTime: 18 },
  { id: "m22", name: "شيش طاووق",             nameEn: "Shish Tawook",         category: "grills",     price: 55, image: "", available: true,  preparationTime: 15 },
  { id: "m23", name: "دجاج مشوي كامل",        nameEn: "Whole Grilled Chicken",category: "grills",     price: 70, image: "", available: true,  preparationTime: 25 },
  { id: "m24", name: "سمك مشوي",              nameEn: "Grilled Fish",         category: "grills",     price: 90, image: "", available: true,  preparationTime: 20 },
  // ساندويشات
  { id: "m25", name: "شاورما دجاج",           nameEn: "Chicken Shawarma",     category: "sandwiches", price: 28, image: "", available: true,  preparationTime: 8  },
  { id: "m26", name: "شاورما لحم",            nameEn: "Meat Shawarma",        category: "sandwiches", price: 35, image: "", available: true,  preparationTime: 8  },
  { id: "m27", name: "برجر دجاج",             nameEn: "Chicken Burger",       category: "sandwiches", price: 38, image: "", available: true,  preparationTime: 12 },
  { id: "m28", name: "برجر لحم",              nameEn: "Beef Burger",          category: "sandwiches", price: 45, image: "", available: true,  preparationTime: 12 },
  { id: "m29", name: "ساندويش فلافل",         nameEn: "Falafel Sandwich",     category: "sandwiches", price: 20, image: "", available: true,  preparationTime: 8  },
  // مشروبات
  { id: "m30", name: "عصير برتقال طازج",      nameEn: "Fresh Orange Juice",   category: "drinks",     price: 18, image: "", available: true,  preparationTime: 5  },
  { id: "m31", name: "عصير مانجو",            nameEn: "Mango Juice",          category: "drinks",     price: 18, image: "", available: true,  preparationTime: 5  },
  { id: "m32", name: "ليموناضة",              nameEn: "Lemonade",             category: "drinks",     price: 15, image: "", available: true,  preparationTime: 5  },
  { id: "m33", name: "شاي",                   nameEn: "Tea",                  category: "drinks",     price: 8,  image: "", available: true,  preparationTime: 5  },
  { id: "m34", name: "قهوة عربية",            nameEn: "Arabic Coffee",        category: "drinks",     price: 10, image: "", available: true,  preparationTime: 5  },
  { id: "m35", name: "كولا",                  nameEn: "Cola",                 category: "drinks",     price: 8,  image: "", available: true,  preparationTime: 2  },
  { id: "m36", name: "ماء معدني",             nameEn: "Water",                category: "drinks",     price: 5,  image: "", available: true,  preparationTime: 1  },
  { id: "m37", name: "سموذي فراولة",          nameEn: "Strawberry Smoothie",  category: "drinks",     price: 22, image: "", available: true,  preparationTime: 8  },
  // حلويات
  { id: "m38", name: "أم علي",               nameEn: "Umm Ali",              category: "desserts",   price: 25, image: "", available: true,  preparationTime: 10 },
  { id: "m39", name: "كنافة",                nameEn: "Kunafa",               category: "desserts",   price: 28, image: "", available: true,  preparationTime: 10 },
  { id: "m40", name: "بقلاوة",               nameEn: "Baklava",              category: "desserts",   price: 30, image: "", available: true,  preparationTime: 5  },
  { id: "m41", name: "آيس كريم (كوب)",       nameEn: "Ice Cream",            category: "desserts",   price: 20, image: "", available: true,  preparationTime: 5  },
  { id: "m42", name: "مهلبية",               nameEn: "Muhallabia",           category: "desserts",   price: 22, image: "", available: true,  preparationTime: 5  },
];
