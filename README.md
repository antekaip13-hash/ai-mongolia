# AI Mongolia

Digital subscription store + backend-ready commerce engine.

## Ажиллуулах

Local static preview:

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
- Backend endpoint-үүд: `api/`
- Logo: `assets/ai-mongolia-logo.svg`
- Hero visual: `assets/digital-hero.svg`
- Сурталчилгааны copy: `marketing-plan.md`

## Backend mechanics

- `/api/create-order`: cart + customer мэдээллээр order ID болон demo QPay invoice үүсгэнэ
- `/api/order-status`: order ID-р төлөв, progress, timeline буцаана
- `/api/ideas`: community brainstorm board-ийн санаа авах demo endpoint

## Одоогийн боломжууд

- Digital subscription catalog
- Search болон category filter
- Smart bundle recommendation quiz
- Cart drawer, quantity нэмэх/хасах
- Backend-ready order ID creation
- Demo QPay invoice response
- Order tracking UI
- Community brainstorm board
- Day Shift / Night Shift mode
