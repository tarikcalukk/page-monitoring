# Backend Security and Structure Report

## Issues

| Priority | Location | Problem | Resolution |
| --- | --- | --- | --- |
| Critical | `server/data/db.js:3`, `server/data/models/index.js:4` | Hardkodirani MySQL `root/password` kredencijali u neiskorištenom DB sloju. | Uklonjeni legacy Sequelize stub fajlovi; konfiguracija se sada učitava iz env varijabli. |
| High | `server/users.json:1` | Lokalni korisnički podaci i bcrypt hash-evi bili su Git-tracked. | `server/users.json` je uklonjen iz Git praćenja i dodat u `.gitignore`; app ga kreira lokalno. |
| High | `server/index.js:42` | JWT fallback secret nije eksplicitno failao u produkciji. | Centralizovan config; produkcija se zaustavlja bez `JWT_SECRET`, development koristi privremeni secret uz warning. |
| High | `server/index.js:715`, `server/index.js:749`, `server/index.js:776` | Auth endpointi su imali ručnu, neujednačenu validaciju i error handling. | Dodan Joi validation middleware, central error handler i service/controller separacija. |
| High | `server/index.js:1-1103` | Jedna velika skripta je sadržavala routing, auth, DB/file pristup, monitoring, email i error handling. | Backend je razdvojen u `routes/`, `controllers/`, `services/`, `models/`, `middleware/`, `utils/`, `config/`. |
| Medium | `server/index.js:67`, `server/index.js:92` | File store nije pisao atomarno; prekid procesa je mogao ostaviti djelimično upisan JSON. | Dodan `models/userStore.js` sa queue lock-om i temp-file + atomic rename upisom. |
| Medium | `server/users.json:505` | Lokalni `users.json` je imao validan JSON niz praćen duplim fragmentom, što je blokiralo registraciju/login u runtimeu. | Lokalni fajl je popravljan iz prvog kompletnog JSON niza i backup je ostavljen kao `server/users.json.*.bak`; novi atomic write sprečava ponavljanje. |
| Medium | `server/index.js:229` | Auth rate limiter je brojao i uspješne pokušaje, što je moglo zaključati registraciju/login nakon normalnog rada. | Zamijenjeno `express-rate-limit` limiterom sa `skipSuccessfulRequests`. |
| Medium | `server/index.js:20-40` | Security headeri i CORS nisu bili centralizovani niti pokriveni standardnim middlewareom. | Dodan `helmet`, CORS whitelist i central security middleware. |
| Medium | `server/index.js:742`, `server/index.js:963`, `server/index.js:1076` | Direktni `console.*` logovi i potencijalno nekonzistentno logovanje grešaka. | Dodan `pino`/`pino-http` logger sa redaction pravilima. |
| Medium | `server/package.json:6` | Test skripta je bila samo syntax check, bez unit/integration pokrivenosti. | Dodani Jest + Supertest testovi za auth, URL/settings i content analysis. |
| Low | Repository root | Nije postojao backend CI workflow. | Dodan `.github/workflows/nodejs-ci.yml`. |

## New dependencies

- `helmet`: sigurni HTTP headeri.
- `express-rate-limit`: standardizovan rate limiting auth endpointa.
- `joi`: request body/query validacija.
- `pino`, `pino-http`: strukturisano logovanje sa redaction pravilima.
- `jest`, `supertest`: unit i integration testovi.
- `eslint`, `@eslint/js`, `globals`, `prettier`, `nodemon`: lint, formatiranje i development workflow.

## Verification

```bash
cd server
npm ci
npm run lint
npm test
npm start
curl http://localhost:5000/health
```
