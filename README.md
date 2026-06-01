# AI Mongolia

Digital subscription store, order tracking, payment-ready checkout, community idea board.

## Ажиллуулах

Local preview:

```bash
python -m http.server 8081
```

Browser дээр:

```text
http://127.0.0.1:8081/
```

Vercel дээр `/api` folder автоматаар serverless functions болж deploy хийгдэнэ.

## Засах гол хэсгүүд

- Бүтээгдэхүүний default seed: `api/_products.js`
- Нүүр, section layout: `index.html`
- Өнгө, responsive design: `styles.css`
- Захиалгын API: `api/`
- Logo: `assets/ai-mongolia-logo.svg`
- Hero visual: `assets/digital-hero.svg`
- Сурталчилгааны copy: `marketing-plan.md`

## Захиалгын механик

- `/api/create-order`: cart + customer мэдээллээр order ID болон төлбөрийн нэхэмжлэх үүсгэнэ
- `/api/order-status`: order ID-р төлөв, progress, timeline буцаана
- `/api/ideas`: хэрэглэгчийн санал авах route
- `/api/admin-orders`: admin dashboard-д захиалга жагсаах, төлөв солих route
- `/api/products`: дэлгүүрийн бүтээгдэхүүний catalog буцаана
- `/api/admin-products`: admin panel-аас бүтээгдэхүүн нэмэх, үнэ, зураг, хугацаа, тайлбар засах route

## Admin dashboard

Admin хуудас:

```text
/admin.html
```

Vercel дээр `ADMIN_PIN` env нэмбэл admin API PIN шаардана. PIN тавиагүй үед dashboard нээлттэй тул production ашиглалтад заавал PIN тохируулах хэрэгтэй.

## Database тохиргоо

Захиалгыг бодитоор хадгалахын тулд Vercel KV эсвэл Upstash Redis REST credential тохируулна.

```text
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
ADMIN_PIN=...
```

Env байхгүй үед API түр хадгалалтаар ажиллана. Энэ нь хөгжүүлэлтэд тохиромжтой, production захиалгад database заавал хэрэгтэй.

## Одоогийн боломжууд

- Digital subscription catalog
- Admin panel-аас бүтээгдэхүүний зураг, үнэ, хугацаа, тайлбар засах
- Search болон category filter
- Smart bundle recommendation quiz
- Cart drawer, quantity нэмэх/хасах
- Order ID creation
- Payment request response
- Order tracking UI
- Community brainstorm board
- Day Shift / Night Shift mode
