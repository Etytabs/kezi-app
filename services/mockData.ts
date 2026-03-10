export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "contraceptives" | "hygiene" | "wellness" | "medicine";
  tags: string[];
  image: string;
  merchantId: string;
  inStock: boolean;
  stockLevel: number;
}

export interface Merchant {
  id: string;
  name: string;
  type: "pharmacy" | "wellness" | "clinic";
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  distance?: number;
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Daily Oral Contraceptive",
    description: "Reliable daily birth control pill. Consult healthcare provider before use.",
    price: 15.99,
    category: "contraceptives",
    tags: ["contraceptive", "daily", "prescription"],
    image: "pill",
    merchantId: "1",
    inStock: true,
    stockLevel: 50,
  },
  {
    id: "2",
    name: "Emergency Contraception",
    description: "Morning-after pill for emergency use. Most effective within 72 hours.",
    price: 25.99,
    category: "contraceptives",
    tags: ["contraceptive", "emergency", "prescription"],
    image: "pill",
    merchantId: "1",
    inStock: true,
    stockLevel: 20,
  },
  {
    id: "3",
    name: "Condoms (12 Pack)",
    description: "Latex condoms for safe protection. Reservoir tip for comfort.",
    price: 9.99,
    category: "contraceptives",
    tags: ["contraceptive", "protection", "barrier"],
    image: "box",
    merchantId: "1",
    inStock: true,
    stockLevel: 100,
  },
  {
    id: "4",
    name: "Female Condoms (3 Pack)",
    description: "Female barrier contraception. Hormone-free protection.",
    price: 12.99,
    category: "contraceptives",
    tags: ["contraceptive", "protection", "barrier"],
    image: "box",
    merchantId: "1",
    inStock: true,
    stockLevel: 35,
  },
  {
    id: "5",
    name: "Organic Cotton Pads",
    description: "Ultra-soft organic cotton pads for sensitive skin. Chlorine-free and biodegradable.",
    price: 8.99,
    category: "hygiene",
    tags: ["menstrual", "organic", "eco-friendly"],
    image: "pad",
    merchantId: "1",
    inStock: true,
    stockLevel: 45,
  },
  {
    id: "6",
    name: "Menstrual Cup",
    description: "Medical-grade silicone menstrual cup. Reusable for up to 10 years.",
    price: 29.99,
    category: "hygiene",
    tags: ["menstrual", "eco-friendly", "reusable"],
    image: "cup",
    merchantId: "1",
    inStock: true,
    stockLevel: 12,
  },
  {
    id: "7",
    name: "Period Underwear",
    description: "Absorbent underwear for light to moderate flow days.",
    price: 32.99,
    category: "hygiene",
    tags: ["menstrual", "reusable", "comfort"],
    image: "underwear",
    merchantId: "1",
    inStock: true,
    stockLevel: 18,
  },
  {
    id: "8",
    name: "Feminine Wash",
    description: "pH-balanced gentle cleanser for intimate hygiene.",
    price: 7.99,
    category: "hygiene",
    tags: ["hygiene", "daily", "gentle"],
    image: "bottle",
    merchantId: "2",
    inStock: true,
    stockLevel: 60,
  },
  {
    id: "9",
    name: "Iron Supplement",
    description: "Gentle iron supplement to support healthy iron levels during menstruation.",
    price: 15.99,
    category: "wellness",
    tags: ["menstrual", "health", "vitamin"],
    image: "pill",
    merchantId: "2",
    inStock: true,
    stockLevel: 30,
  },
  {
    id: "10",
    name: "Prenatal Vitamins",
    description: "Complete prenatal vitamin with folate, iron, and DHA.",
    price: 34.99,
    category: "wellness",
    tags: ["ovulation", "fertility", "vitamin"],
    image: "vitamin",
    merchantId: "2",
    inStock: true,
    stockLevel: 25,
  },
  {
    id: "11",
    name: "Fertility Tea",
    description: "Herbal blend to support reproductive health and fertility.",
    price: 12.99,
    category: "wellness",
    tags: ["ovulation", "fertility", "herbal"],
    image: "tea",
    merchantId: "3",
    inStock: false,
    stockLevel: 0,
  },
  {
    id: "12",
    name: "Omega-3 Fish Oil",
    description: "High-quality omega-3 for hormonal balance and skin health.",
    price: 22.99,
    category: "wellness",
    tags: ["follicular", "health", "vitamin"],
    image: "oil",
    merchantId: "2",
    inStock: true,
    stockLevel: 40,
  },
  {
    id: "13",
    name: "Magnesium Complex",
    description: "Magnesium supplement to reduce PMS symptoms and support sleep.",
    price: 18.99,
    category: "wellness",
    tags: ["luteal", "pms", "vitamin"],
    image: "mag",
    merchantId: "2",
    inStock: true,
    stockLevel: 35,
  },
  {
    id: "14",
    name: "Heating Pad",
    description: "Electric heating pad for cramp relief. Three heat settings.",
    price: 24.99,
    category: "wellness",
    tags: ["menstrual", "comfort", "pain-relief"],
    image: "heat",
    merchantId: "3",
    inStock: true,
    stockLevel: 8,
  },
  {
    id: "15",
    name: "Pain Relief Medication",
    description: "Ibuprofen for menstrual cramp relief. Non-drowsy formula.",
    price: 6.99,
    category: "medicine",
    tags: ["menstrual", "pain-relief", "cramps"],
    image: "pill",
    merchantId: "1",
    inStock: true,
    stockLevel: 75,
  },
  {
    id: "16",
    name: "Antifungal Cream",
    description: "Treatment for yeast infections. Fast-acting relief.",
    price: 11.99,
    category: "medicine",
    tags: ["treatment", "infection", "health"],
    image: "cream",
    merchantId: "1",
    inStock: true,
    stockLevel: 40,
  },
];

export const MERCHANTS: Merchant[] = [
  {
    id: "1",
    name: "Pharma Plus Kigali",
    type: "pharmacy",
    address: "KG 7 Ave, Kigali",
    latitude: -1.9403,
    longitude: 30.0587,
    rating: 4.8,
    distance: 0.5,
  },
  {
    id: "2",
    name: "Ubuzima Wellness Center",
    type: "wellness",
    address: "KN 3 Road, Nyarugenge",
    latitude: -1.9536,
    longitude: 30.0606,
    rating: 4.6,
    distance: 0.8,
  },
  {
    id: "3",
    name: "King Faisal Hospital Pharmacy",
    type: "clinic",
    address: "KG 544 St, Kacyiru",
    latitude: -1.9358,
    longitude: 30.0919,
    rating: 4.9,
    distance: 1.2,
  },
];

export const DAILY_TIPS = {
  menstrual: [
    "Stay hydrated and drink warm beverages to ease cramps.",
    "Rest when you need to - your body is doing important work.",
    "Try gentle stretching or yoga to relieve tension.",
  ],
  follicular: [
    "Your energy is rising - great time to start new projects!",
    "Focus on learning something new today.",
    "Increase protein intake to support follicle development.",
  ],
  ovulation: [
    "You're at your social and creative peak!",
    "Schedule important meetings or presentations now.",
    "This is your most fertile time if trying to conceive.",
  ],
  luteal: [
    "Practice self-care and prioritize rest.",
    "Reduce caffeine and increase complex carbs.",
    "Journaling can help process emotions during this time.",
  ],
};

export const DAILY_INSPIRATIONS = [
  {
    quote: "Every woman and girl has the right to access sexual and reproductive health services without discrimination.",
    author: "Rwanda SRH Law (2016)",
  },
  {
    quote: "Good health is a state of complete physical, mental, and social well-being, not merely the absence of disease.",
    author: "World Health Organization",
  },
  {
    quote: "Investing in women and girls is one of the most effective ways to accelerate development.",
    author: "HDI Rwanda",
  },
  {
    quote: "Access to reproductive health care is fundamental to achieving gender equality and women's empowerment.",
    author: "WHO Maternal Health",
  },
  {
    quote: "Every person has the right to make decisions concerning their reproductive health.",
    author: "Rwanda SRH Policy",
  },
  {
    quote: "Self-care is not selfish. You cannot serve from an empty vessel.",
    author: "Eleanor Brown",
  },
  {
    quote: "Your body is your most priceless possession. Take care of it.",
    author: "Jack LaLanne",
  },
  {
    quote: "Caring for myself is not self-indulgence, it is self-preservation.",
    author: "Audre Lorde",
  },
  {
    quote: "Mothers and children are entitled to special care and assistance.",
    author: "Universal Declaration of Human Rights",
  },
  {
    quote: "Rest when you're weary. Refresh and renew yourself.",
    author: "Lailah Gifty Akita",
  },
  {
    quote: "You are enough just as you are. Each emotion you feel, everything in your life, everything you do is enough.",
    author: "Kara Loewentheil",
  },
  {
    quote: "Empowering women is key to building a future we want.",
    author: "UN Women Rwanda",
  },
  {
    quote: "Your cycle is your superpower. Learn to work with it, not against it.",
    author: "Lisa Lister",
  },
  {
    quote: "Women's health is the foundation of a healthy society.",
    author: "Rwanda Ministry of Health",
  },
  {
    quote: "Be gentle with yourself, you're doing the best you can.",
    author: "Unknown",
  },
];
