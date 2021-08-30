import * as express from 'express';
import type { Express, RequestHandler } from 'express';
import { getDependencies } from './package';

/**
 * Attempts to retrieve package data from the npm registry and return it
 */
const getPackage: RequestHandler<{ name: string; version: string }> = async function (req, res) {
  const { name, version } = req.params;
  try {
    const dependencies = await getDependencies(name, version);
    if (dependencies) {
      return res.status(200).json({ name, version, dependencies });
    }
    return res.status(404).json({ message: `No package ${name} with version ${version} exists` });
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

  app.get('/package/:name/:version', getPackage);

  return app;
}
