import * as express from 'express';
import type { Express, RequestHandler } from 'express';
import { getDependencies, getNPMPackage } from './package';
import { Server } from 'http';

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
const handlePackageRequest: RequestHandler<{ name: string; version: string }> = async function (req, res) {
  const { name, version } = req.params;
  try {
    const npmPackage = await getNPMPackage(name);
    if (npmPackage) {
      const dependencies = await getDependencies(npmPackage, version);
      if (dependencies) {
        return res.status(200).json({ name, version, dependencies });
      }
      return res.status(404).json({ message: `No version ${version} of package ${name} exists` });
    }
    return res.status(404).json({ message: `No package ${name} exists` });
  } catch (error) {
    return res.status(502).json({ message: 'NPM registry server not responding' });
  }
};

/**
 * Bootstrap the application framework
 */
export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.get('/package/:name/:version', handlePackageRequest);
  return app;
}

export async function hostApp(app: Express, port: number): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      return resolve({
        server,
        port,
      });
    });
  });
}
