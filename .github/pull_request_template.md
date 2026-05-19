## Summary

- Modularized backend into routes, controllers, services, models, middleware, utils, and config.
- Hardened auth, validation, CORS/security headers, logging, and local file-store writes.
- Added backend linting, tests, CI, upgrade notes, and security report.

## Verification

```bash
cd server
npm ci
npm run lint
npm test
npm start
curl http://localhost:5000/health
```

## Acceptance checklist

- [ ] `npm ci` works in `server/`
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `GET /health` returns 200
- [ ] No hardcoded secrets are committed
- [ ] Existing client API contract is preserved
