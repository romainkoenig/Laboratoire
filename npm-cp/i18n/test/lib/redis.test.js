const expect = require('chai').expect;

const moment = require('moment');
const redis = require('redis');

const i18n = require('../../lib/i18n');

describe('redis', () => {
  let client;
  before(function* before() {
    client = redis.createClient('redis://localhost:6379');

    yield cb => client.flushall(cb);

    yield cb => client.hset('howdy', 'en', 'Howdy', cb);
    yield cb => client.hset('hello-john', 'en', 'Hello {{john}}', cb);
  });
  beforeEach(function* beforeEach() {
    yield i18n.engine.init({});
    yield i18n.loader.init({
      url: 'redis://localhost:6379'
    });
  });
  describe('nominal use', () => {
    it('translates to redis successfully', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'howdy'
        }
      });
      expect(translation).to.be.equal('Howdy');
    });
  });

  describe.skip('load test', () => {
    it('allows to translate high volume quickly', function* it() {
      const table = [];
      for (let n = 1; n <= Math.pow(2, 10); n *= 2) {
        const object = {};
        for (let i = 0; i < n; i++) {
          yield cb => client.hset(`howdy-${n}-${i}`, 'en', `Howdy ${n} ${i}`, cb); // eslint-disable-line no-loop-func, max-len
          object[`key-${n}-${i}`] = {
            '@translate': {
              key: `howdy-${n}-${i}`
            }
          };
        }

        const tic = moment();
        const translation = yield i18n.translate(object);
        table.push([n, moment().diff(tic, 'ms')]);

        expect(translation['key-1-0']).to.not.be.equal('key-1-0');
        expect(Object.keys(translation)).to.have.lengthOf(n);
      }

      const last = table.pop();
      expect(last[1]).to.be.below(200);
    });
  });
});
