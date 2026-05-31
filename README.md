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

- Бүтээгдэхүүнүүд: `script.js` доторх `products` массив
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

## Одоогийн боломжууд

- Digital subscription catalog
- Search болон category filter
- Smart bundle recommendation quiz
- Cart drawer, quantity нэмэх/хасах
- Order ID creation
- Payment request response
- Order tracking UI
- Community brainstorm board
- Day Shift / Night Shift mode
