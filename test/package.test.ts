import { nockRecord } from './util';
import { getDependencies, getDependenciesDeep, getNpmData } from '../src/package';

describe('NPM retrieval functions', () => {
  describe('getNpmData()', () => {
    it('retrieves data if package version exists', async () => {
      const { nockDone } = await nockRecord('getNpmData_present');
      const data = await getNpmData('@lauf/store-react');
      if (data === null) {
        throw new Error('Should retrieve data');
      }
      expect(data.name).toBe('@lauf/store-react');
      expect((data as unknown as { author: { name: string } })?.author?.name).toBe('Cefn Hoile');
      nockDone();
    });

    it('returns null for non-existent package', async () => {
      const { nockDone } = await nockRecord('getNpmData_absent');
      const data = await getNpmData('nothingburger42');
      expect(data).toBe(null);
      nockDone();
    });
  });

  describe('getDependencies()', () => {
    it('retrieves data if package version exists', async () => {
      const { nockDone } = await nockRecord('getDependencies_present');
      const data = await getDependencies('@lauf/store-react', '1.0.1');
      if (data === null) {
        throw new Error('Should retrieve data');
      }
      expect(data).toMatchInlineSnapshot(`
        Object {
          "@lauf/store": "^1.0.1",
        }
      `);
      nockDone();
    });

    it('returns null for non-existent package', async () => {
      const { nockDone } = await nockRecord('getDependencies_absent');
      const data = await getDependencies('nothingburger42', '42.42.42');
      expect(data).toBe(null);
      nockDone();
    });
  });

  describe('getDependenciesDeep()', () => {
    it('retrieves data if package version exists', async () => {
      const { nockDone } = await nockRecord('getDependenciesDeep_present');
      const data = await getDependenciesDeep('@lauf/store-react', '1.0.1');
      if (data === null) {
        throw new Error('Should retrieve data');
      }
      expect(data).toMatchInlineSnapshot(`
        Object {
          "@lauf/store": Object {
            "dependencies": Object {
              "immer": Object {
                "dependencies": Object {},
                "version": "8.0.4",
              },
            },
            "version": "1.0.1",
          },
        }
      `);
      nockDone();
    });

    it('returns null for non-existent package', async () => {
      const { nockDone } = await nockRecord('getDependenciesDeep_absent');
      const data = await getDependenciesDeep('nothingburger42', '42.42.42');
      expect(data).toBe(null);
      nockDone();
    });
  });
});
