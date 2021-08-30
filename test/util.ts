import * as path from 'path';
import * as nock from 'nock';

// to refresh nock snapshots
// run `export NOCK_BACK_MODE='record' && npm run test`
const { back } = nock;
back.fixtures = path.resolve(__dirname, 'nockFixtures');
if (!process.env['NOCK_BACK_MODE']) {
  back.setMode('lockdown');
}

/**
 * Uses nock recording and mocking to play back archived HTTP requests from npm
 * @param testId unique id for recordings
 * @returns control object
 */
export async function nockRecord(testId: string): Promise<{ nockDone: () => void }> {
  return await back(`${testId}.json`, {
    // don't block localhost
    after: () => nock.enableNetConnect('localhost'),
    // forget localhost recordings
    afterRecord: (outputs) => outputs.filter((o) => !o.scope.match(/localhost/)),
  });
}
