import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

export async function startEmbeddedPostgres(port = 5432) {
  const dbDir = path.resolve(__dirname, '../../data/postgres');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  console.log(`[Database] Initializing PostgreSQL cluster at ${dbDir}...`);
  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'postgres',
    password: 'password',
    port: port,
    persistent: true,
  });

  try {
    await pg.initialise();
    console.log(`[Database] Cluster initialized.`);
  } catch (err: any) {
    // Already initialized is fine
    console.log(`[Database] Cluster already exists or initialized (${err.message})`);
  }

  console.log(`[Database] Starting PostgreSQL server on port ${port}...`);
  await pg.start();
  console.log(`[Database] PostgreSQL server running on port ${port}!`);

  try {
    await pg.createDatabase('lifequest');
    console.log(`[Database] Created database "lifequest".`);
  } catch (err: any) {
    console.log(`[Database] Database "lifequest" ready.`);
  }

  return pg;
}

if (require.main === module) {
  startEmbeddedPostgres(5432).catch((err) => {
    console.error('[Database] Failed to start PostgreSQL:', err);
    process.exit(1);
  });
}
