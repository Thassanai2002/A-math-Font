# A-Math Frontend

Angular 20 frontend สำหรับเกม A-MATH Online

## รัน dev

```bash
npm install
npm start
```

เปิด http://localhost:4200 (proxy `/api` → `http://localhost:5285` ตาม `proxy.conf.json`)

## หน้า

- `/lobby` — สร้างห้อง / เข้าห้อง
- `/join` — กรอก Room Code
- `/game/:gameId` — รอผู้เล่น 2 / กระดาน 15×15

## Deploy (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy dist/frontend/browser
```

โปรดแก้ `src/environments/environment.production.ts` ให้ชี้ `apiUrl` ไปยัง backend ของจริงก่อน build