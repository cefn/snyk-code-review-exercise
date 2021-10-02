import * as getPort from 'get-port';
import { Server } from 'http';
import * as nock from 'nock';
import { nockRecord } from './util';
import got, { CancelableRequest, Response } from 'got';
import { createApp, hostApp } from '../src/app';

describe('/package/:name/:version endpoint', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    const availablePort = await getPort({ port: 3000 });
    ({ server, port } = await hostApp(createApp(), availablePort));
  });

  function emulateDependencyRequest(packageName: string, packageVersion: string): CancelableRequest<Response<string>> {
    return got(`http://localhost:${port}/package/${packageName}/${packageVersion}`, {
      retry: 0,
      throwHttpErrors: false,
    });
  }

  afterAll(async () => {
    server.close();
  });

  it('serves 200 and JSON dependency tree if package version exists', async () => {
    const { nockDone } = await nockRecord('localhost_package_present');

    const packageName = 'react';
    const packageVersion = '16.13.0';

    const { statusCode, body } = await emulateDependencyRequest(packageName, packageVersion);
    const json = JSON.parse(body);

    expect(statusCode).toEqual(200);
    expect(json.name).toEqual(packageName);
    expect(json.version).toEqual(packageVersion);
    expect(json.dependencies).toMatchInlineSnapshot(`
      Object {
        "loose-envify": "^1.1.0",
        "object-assign": "^4.1.1",
        "prop-types": "^15.6.2",
      }
    `);
    nockDone();
  });

  it('serves 404 status and JSON error message if package exists but version non-existent', async () => {
    const { nockDone } = await nockRecord('localhost_version_missing');

    const packageName = 'react';
    const packageVersion = '16.16.16';

    const { statusCode, body } = await emulateDependencyRequest(packageName, packageVersion);
    const json = JSON.parse(body);

    expect(statusCode).toEqual(404);
    expect(json).toMatchInlineSnapshot(`
      Object {
        "message": "No version 16.16.16 of package react exists",
      }
    `);
    nockDone();
  });

  it('serves 404 status and JSON error message if package non-existent', async () => {
    const { nockDone } = await nockRecord('localhost_package_missing');

    const packageName = 'nothingburger42';
    const packageVersion = '42.42.42';

    const res = await emulateDependencyRequest(packageName, packageVersion);
    const { statusCode, body } = res;
    const json = JSON.parse(body);

    expect(statusCode).toEqual(404);
    expect(json).toMatchInlineSnapshot(`
      Object {
        "message": "No package nothingburger42 exists",
      }
    `);
    nockDone();
  });

  it('serves 502 status and JSON error message if npm server uncontactable', async () => {
    try {
      nock('https://registry.npmjs.org:443').get('/anythinggoes').replyWithError({ code: 'ETIMEDOUT' });

      const packageName = 'anythinggoes';
      const packageVersion = '0.0.0';

      const res = await emulateDependencyRequest(packageName, packageVersion);
      const { statusCode, body } = res;
      const json = JSON.parse(body);

      expect(statusCode).toEqual(502);
      expect(json).toMatchInlineSnapshot(`
        Object {
          "message": "NPM registry server not responding",
        }
      `);
    } finally {
      nock.cleanAll();
    }
  });
});
