# 🚀 دليل نشر FEKRA AI على السيرفر (خطوة بخطوة)

> الدليل ده مكتوب لسيرفر **Ubuntu 22.04/24.04** (أو أي توزيعة Linux). 
> بعد ما تخلص، هتفتح الموقع من أي جهاز في العالم على `http://عنوان-السيرفر:3000`

---

## 📋 محتوى النظام بعد النشر

| الخدمة | الوصف | البورت |
|---|---|---|
| **PostgreSQL 16** | قاعدة البيانات (بيانات حقيقية دائمة) | 5432 |
| **FEKRA API** (NestJS) | المصادقة JWT + المالية + اعتمادات 4/4 + سجل التدقيق | 4000 |
| **FEKRA Web** (Next.js) | واجهة النظام (عربي RTL) | 3000 |

---

## 1️⃣ استأجر سيرفر (لو مش معاك واحد)

أي VPS يكفي: **2 GB RAM على الأقل** (مثلاً Hetzner CX22 أو DigitalOcean أو Contabo).
اختار نظام التشغيل: **Ubuntu 24.04 LTS**.

---

## 2️⃣ اتصل بالسيرفر وثبّت Docker

افتح الترمنال على جهازك واتصل بالسيرفر (على Windows استخدم PowerShell):

```bash
ssh root@عنوان-السيرفر
```

ثبّت Docker بأمر واحد:

```bash
curl -fsSL https://get.docker.com | sh
```

تأكد إنه اشتغل:

```bash
docker --version
```

---

## 3️⃣ انقل المشروع على السيرفر

**الطريقة الأولى (الأسرع) — من GitHub:**
لو المشروع عندك على GitHub:

```bash
git clone https://github.com/ahmedelsadny/fekra-ai.git
cd fekra-ai
```

**الطريقة الثانية — رفع المجلد مباشرة:**
على جهازك (في فولدر المشروع) اعمل نسخة نظيفة وارفعها:

```bash
# على جهازك (PowerShell):
scp -r -v . root@عنوان-السيرفر:/root/fekra-ai
```
> لو عنّك `node_modules` ضخمة، انسخ من غيرها — السيرفر هيسطب كل حاجة بنفسه.
> (الأفضل: اعمل `git init` + ارفع المشروع على GitHub — أنضف وأسهل للتحديثات).

---

## 4️⃣ شغّل النظام كله (أمر واحد!)

```bash
cd /root/fekra-ai   # أو مسار المشروع عندك
docker compose -f docker-compose.prod.yml up -d --build
```

⏳ أول مرة بياخد **5-15 دقيقة** (بيبني الصور وينزّل الحزم). 
بعد كده راقب السيرفر وهو بيجهز نفسه:

```bash
docker compose -f docker-compose.prod.yml logs -f api
```

لما تشوف السطر ده يبقى تمام: `🚀 Fekra AI API running on: http://localhost:4000/api/v1` — اضغط `Ctrl+C` للخروج من المتابعة.

> ✅ الأمر ده لوحده بيعمل كل حاجة: يشغّل قاعدة البيانات + يجهّز جداول قاعدة البيانات تلقائياً + الشركاء الأربعة (Seed) + يشغل الـ API والواجهة.

---

## 5️⃣ افتح النظام وادخل

من أي متصفح على أي جهاز:

```
http://عنوان-السيرفر:3000
```

بيانات دخول الشركاء المؤسسين الأربعة:

| الشريك | البريد | كلمة السر |
|---|---|---|
| Mahmoud Ashraf | `Mahmoud@fekra.com` | `20101510` |
| Ahmed Elsadny | `Elsadny@fekra.com` | `ahmed01285217746` |
| Ahmed Fouda | `Fouda@fekra.com` | `fouda11111fekra` |
| Mohamed Monem | `Monem@fekra.com` | `monem1214##fekra` |

> ⚠️ **مهم جداً:** أول ما تدخل، غيّر كلمات السر (خطوة 7 تحت) — دي كلمات سر أولية للتجهيز فقط.

⚠️ لو صفحة الدخول مش بتدخل: تأكد إن بورتات 3000 و 4000 مفتوحة في الـ Firewall بتاع السيرفر:

```bash
ufw allow 3000
ufw allow 4000
```

---

## 6️⃣ جرّب سيناريو الاعتماد الحقيقي 4/4

1. ادخل بحساب **Mahmoud** → "المالية والخزينة" → سجّل مصروف جديد.
2. افتح "اعتماد المصروفات" — هتلاقي المصروف مستني تصويت.
3. اعمل **تسجيل خروج** وادخل بحساب شريك تاني → صوّت موافقة.
4. كرر مع الشركاء الأربعة — عند الموافقة الرابعة: ✅ **المصروف بيتعتمد تلقائياً وينعكس على الرصيد للكل**.
5. لو أي شريك ضغط "رفض" في أي لحظة → المصروف بيتحول لمرفوض نهائياً.

كل حركة بتتسجل في **Audit Trail** غير قابل للحذف (`GET /api/v1/audit`).

---

## 7️⃣ أمور مهمة بعد النشر

### 🔐 تغيير كلمات سر الشركاء (ضروري)
اتصل بالسيرفر وشغّل أمر تغيير كلمة سر (مثال لمحمود):

```bash
docker exec -it fekra-api npx ts-node -e "
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
const p = new PrismaClient();
(async () => {
  await p.user.update({ where: { email: 'Mahmoud@fekra.com' }, data: { passwordHash: await argon2.hash('كلمة-السر-الجديدة') } });
  console.log('✅ Password updated');
  await p.\$disconnect();
})();
"
```
كرر لكل شريك بكلمة سر مختلفة.

### 🔑 تغيير أسرار الـ JWT (موصى به)
قبل أول تشغيل (أو اعمل `down` ثم `up` من جديد):

```bash
cd /root/fekra-ai
JWT_ACCESS_SECRET="اختر-مفتاح-سري-طويل-وعشوائي" docker compose -f docker-compose.prod.yml up -d --build
```

### 💾 نسخة احتياطية من قاعدة البيانات

```bash
docker exec fekra-postgres pg_dump -U fekra_user fekra_ai > fekra-backup-$(date +%F).sql
```

استرجاع نسخة:

```bash
cat fekra-backup-YYYY-MM-DD.sql | docker exec -i fekra-postgres psql -U fekra_user fekra_ai
```

### 🔄 تحديث النظام بعد تعديلات جديدة

```bash
cd /root/fekra-ai
git pull   # لو شغال بـ GitHub
docker compose -f docker-compose.prod.yml up -d --build
```

### 🌐 ربط دومين (اختياري)
لو عندك دومين، وجّه DNS بتاعه لعنوان السيرفر، وبعدين استخدم Nginx + Let's Encrypt (أو Cloudflare) عشان تفتح الموقع على بورت 443 بدل 3000.

---

## 🧯 مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `port 3000 already in use` | فيه خدمة تانية على البورت — غيّر الرقم في `docker-compose.prod.yml` لـ `"3001:3000"` |
| الدخول بيفشل: "تعذر الاتصال بالسيرفر" | تأكد إن الـ API شغال: `docker compose -f docker-compose.prod.yml logs api` وإن بورت 4000 مفتوح |
| بيانات بتختفت؟ | مستحيل مع قاعدة البيانات — بس لو الدخول شغال بدون سيرفر فهو "وضع تجريبي محلي" — راجع خطوة 4 |
| أمر build بيفشل | شوف اللوج بالتفصيل: `docker compose -f docker-compose.prod.yml build --no-cache` |

---

## 🖥️ (اختياري) التشغيل المحلي بدون Docker

لو حبيت تجرب على جهازك محلياً بـ PostgreSQL محلي:

```bash
npm install
npm run db:generate
npm run db:migrate    # محتاج PostgreSQL شغال على 5432 (DATABASE_URL في apps/api/.env)
npm run db:seed
npm run dev          # يشغل الواجهة + الـ API مع بعض
```
