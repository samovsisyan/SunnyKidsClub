import { config } from './config.js';
import { app } from './app.js';
import { ensureAdmin } from './lib/bootstrap.js';

await ensureAdmin().catch((e) => console.error('ensureAdmin failed', e));

app.listen(config.port, () => {
  console.log(`☀️  Sunny Kids Club API listening on http://localhost:${config.port}`);
});
