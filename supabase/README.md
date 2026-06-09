# إعداد Supabase

## خطوات الربط

### 1. إنشاء مشروع Supabase
1. اذهب إلى https://supabase.com/dashboard
2. أنشئ مشروعاً جديداً
3. احتفظ بـ **Project URL** و **anon public key** من:
   `Settings → API`

### 2. تحديث ملف `.env`
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEV_MODE=false
```

### 3. تشغيل migrations في Supabase SQL Editor
افتح `SQL Editor` في لوحة تحكم Supabase ونفّذ الملفات بالترتيب:

#### الخطوة أ — Schema (الجداول والصلاحيات)
انسخ محتوى الملف التالي والصقه في SQL Editor:
```
supabase/migrations/001_initial_schema.sql
```

#### الخطوة ب — Seed Data (المنيو والمناطق والأسباب)
```
supabase/migrations/002_seed_data.sql
```

#### الخطوة ج — Test Users (مستخدمون تجريبيون)
```
supabase/migrations/003_test_users.sql
```

> ⚠️ نفّذ `003_test_users.sql` في بيئة التطوير فقط!

### 4. تفعيل Realtime
في لوحة Supabase:
`Database → Replication → Supabase Realtime`  
تأكد أن جداول `orders` و `order_items` و `profiles` مفعّلة.

---

## بيانات الدخول التجريبية

| الدور     | اسم المستخدم | كلمة المرور  |
|-----------|-------------|--------------|
| مدير      | admin       | admin123     |
| كاشير     | cashier     | cashier123   |
| مطبخ      | kitchen     | kitchen123   |
| ميدان     | field       | field123     |
| توصيل     | delivery    | delivery123  |

---

## بنية الجداول

| الجدول                 | الوصف                          |
|------------------------|-------------------------------|
| `profiles`             | حسابات الموظفين + الأدوار      |
| `menu_categories`      | تصنيفات المنيو                 |
| `menu_items`           | عناصر المنيو مع الأسعار        |
| `delivery_areas`       | مناطق التوصيل + الرسوم         |
| `orders`               | الطلبات مع كامل دورة الحياة    |
| `order_items`          | عناصر كل طلب                   |
| `cancellation_reasons` | أسباب الإلغاء                  |
| `issue_reasons`        | أسباب المشاكل                  |
| `activity_logs`        | سجل النشاطات                   |
| `push_tokens`          | رموز الإشعارات                 |

---

## دورة حياة الطلب

```
cashier → pending
kitchen → preparing   (pending → preparing)
field   → ready       (preparing → ready)
field   → delivering  (ready → delivering + driver assigned)
driver  → delivered   (delivering → delivered)
أي دور → cancelled    (مع سبب)
```

> **الإيرادات** تُحسب فقط من `status = delivered`  
> **رسوم التوصيل** لا تدخل إيرادات المطعم — تُسجّل للسائق
