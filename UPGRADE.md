# Backend Upgrade Notes

## API kompatibilnost

Javni API ugovor je zadržan: postojeći endpointi, request body/query shape i osnovni response shape ostaju isti. Dodat je samo `GET /health` za CI/ops provjeru.

## Obavezne env varijable

1. Kopirati `server/.env.example` u `server/.env`.
2. Postaviti jak `JWT_SECRET` prije produkcije.
3. Po potrebi podesiti `CORS_ORIGIN`, `EMAIL_USER`, `EMAIL_PASS` i `DATA_FILE`.

## Podaci

`server/users.json` je uklonjen iz Git praćenja jer sadrži lokalne korisničke podatke i bcrypt hash-eve. Fajl ostaje lokalno na mašini i aplikacija ga nastavlja koristiti. Novi deploy bez postojećeg fajla starta s praznom listom korisnika.

## DB migration plan

Trenutni file store je siguran za lokalni/single-instance rad: koristi async read/write, red operacija i atomic rename. Za multi-user produkciju ili više Node instanci migrirati na SQLite/Postgres:

1. Kreirati tabele `users`, `urls`, `method_metrics`, `method_history`.
2. Napisati jednokratnu skriptu koja čita `users.json` i puni relacione tabele.
3. Zamijeniti `models/userStore.js` repository metodama koje koriste prepared statements/ORM.
4. Zadržati iste service/controller metode da API ostane stabilan.

Rollback: vratiti prethodni commit i ostaviti postojeći `server/users.json` na mjestu. Ako je migracija na DB već izvršena, eksportovati podatke nazad u isti JSON shape prije rollbacka.

## Uklonjeni legacy fajlovi

Neiskorišteni Sequelize/MySQL stub fajlovi iz `server/data/` su uklonjeni jer su imali hardkodirane kredencijale i nisu bili povezani sa runtime aplikacijom.
