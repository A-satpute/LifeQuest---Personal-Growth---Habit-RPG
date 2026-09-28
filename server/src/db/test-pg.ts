import net from 'net';
import { PGlite } from '@electric-sql/pglite';
import { fromNodeSocket } from 'pg-gateway/node';
import pg from 'pg';

async function test() {
  console.log('Starting PGlite...');
  const db = new PGlite();

  const server = net.createServer(async (socket) => {
    await fromNodeSocket(socket, {
      serverVersion: '16.3 (PGlite)',
      auth: {
        method: 'password',
        getClearTextPassword: () => 'postgres',
        validateCredentials: () => true,
      },
      async onQuery(query: string) {
        console.log('Query received:', query);
        const res = await db.query(query);
        // let's see how onQuery works or if pglite handles wire protocol directly
        return undefined as any;
      },
    });
  });

  server.listen(54321, async () => {
    console.log('PG Gateway listening on 54321');
    const client = new pg.Client({
      connectionString: 'postgresql://postgres:postgres@localhost:54321/postgres',
    });
    try {
      await client.connect();
      console.log('Client connected successfully!');
      const res = await client.query('SELECT 1 as num');
      console.log('Result:', res.rows);
      await client.end();
    } catch (err) {
      console.error('Client error:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

test();
