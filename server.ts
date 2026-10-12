import { spawn } from 'node:child_process';

const isTsxActive = process.execArgv.some((arg) => arg.includes('tsx')) || process.env.TSX_SPAWNED === '1';

if (!isTsxActive) {
  // Self-bootstrap with tsx loader when invoked via standard 'node server.ts'
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', ...process.argv.slice(1)],
    {
      stdio: 'inherit',
      env: { ...process.env, TSX_SPAWNED: '1' },
    }
  );
  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
} else {
  startAppServer();
}

async function startAppServer() {
  const { default: dotenv } = await import('dotenv');
  dotenv.config();

  const { default: express } = await import('express');
  const { default: cors } = await import('cors');
  const { default: path } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const { default: apiRouter } = await import('./src/server/routes/index.ts');
  const { errorHandler } = await import('./src/server/middleware/auth.ts');
  const { checkDatabaseConnection } = await import('./src/server/config/db.ts');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Core Middlewares (Support base64 image uploads up to 20MB)
  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // Mount API Router
  app.use('/api', apiRouter);

  // Global Error Handler
  app.use(errorHandler);

  // Vite Integration (Dev mode) or Static Dist (Production mode)
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Cloud Run requires listening on PORT immediately
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI MakeupMatch Server] Running at http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`);

    // Verify Database connection asynchronously without blocking container startup
    checkDatabaseConnection()
      .then((dbStatus) => {
        if (dbStatus.connected) {
          console.log(`[Database]: ${dbStatus.message} (Version: ${dbStatus.version})`);
        } else {
          console.warn(`[Database Notice]: ${dbStatus.message}`);
        }
      })
      .catch((err) => {
        console.warn(`[Database Warning]: ${err?.message || err}`);
      });
  });
}
