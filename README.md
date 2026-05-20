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

## Docker

Za lokalno pokretanje produkcijskog setup-a:

```bash
cp .env.docker.example .env
docker compose up --build
```

Frontend: `http://localhost:3000`

Backend health check: `http://localhost:5000/health`

Mailpit inbox for local verification codes: `http://localhost:8025`

Docker setup koristi tri servisa:

- `api`: Node/Express backend sa sistemskim Chromiumom za Puppeteer.
- `client`: Nginx koji servira React production build.
- `mailpit`: lokalni SMTP inbox za testiranje e-mail verifikacije.

Korisnički runtime podaci se čuvaju u Docker volume-u `page_monitoring_data`, na putanji `/app/data/users.json` unutar backend containera.

### Slanje e-mailova

Default Docker setup koristi Mailpit. To znači da se verifikacijski kodovi i izvještaji vide na `http://localhost:8025`, ali se ne isporučuju u stvarni Gmail inbox.

Za stvarno slanje preko Gmail SMTP-a, u root `.env` postavi:

```bash
EMAIL_DELIVERY_MODE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_FROM="Page Monitoring <tvoj-email@gmail.com>"
EMAIL_USER=tvoj-email@gmail.com
EMAIL_PASS=tvoj-google-app-password
```

Za Gmail moraš koristiti Google App Password, ne običnu Gmail lozinku.
