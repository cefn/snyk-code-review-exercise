import * as getPort from 'get-port';
import { createApp, hostApp } from './app';

async function main() {
  // Initialise the server framework and routing
  const app = createApp();

  const availablePort = await getPort({ port: 3000 });
  const hostInfo = await hostApp(app, availablePort);

  const { server } = hostInfo;
  console.info(`Server listening on ${JSON.stringify(server.address())}`);
}

main();
