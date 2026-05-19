# Page Monitoring

React + Node.js aplikacija za praćenje promjena web sadržaja i poređenje HASH i DOM metoda.

## Backend

```bash
cd server
cp .env.example .env
npm ci
npm run lint
npm test
npm start
```

Server sluša na `http://localhost:5000`, a health check je:

```bash
curl http://localhost:5000/health
```

Obavezno postaviti `JWT_SECRET` u `server/.env` za stabilne tokene. Ako nije postavljen u developmentu, server koristi privremeni runtime secret i svi tokeni isteknu nakon restarta.

## Korisnički podaci

Lokalni file store koristi `server/users.json`, ali taj fajl se više ne commituje. Backend ga kreira automatski pri prvom upisu. Za produkciju i veći broj korisnika preporučena migracija je SQLite/Postgres, opisana u [UPGRADE.md](./UPGRADE.md).

## CI

GitHub Actions workflow u `.github/workflows/nodejs-ci.yml` pokreće:

```bash
cd server
npm ci
npm run lint
npm test
```
