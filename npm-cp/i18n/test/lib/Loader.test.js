const expect = require('chai').expect;
const sinon = require('sinon');

const redis = require('redis');

const i18n = require('../../lib/i18n');

describe('Loader', () => {
  const sandbox = sinon.sandbox.create();
  let client;
  before(function* before() {
    client = redis.createClient('redis://localhost:6379');

    yield cb => client.flushall(cb);

    yield cb => client.hset('howdy', 'en', 'Howdy', cb);
    yield cb => client.hset('howdy', 'fr', 'Hey', cb);
    yield cb => client.hset('hello-john', 'en', 'Hello {{john}}', cb);
  });
  beforeEach(function* beforeEach() {
    yield i18n.engine.init({});
    yield i18n.loader.init({
      url: 'redis://localhost:6379'
    });
    i18n.loader._cache.reset();
  });
  afterEach(() => {
    sandbox.restore();
  });

  describe('when initializing', () => {
    it('inits without configuration', function* it() {
      const loader = yield i18n.loader.init();
      expect(loader.constructor.name).to.be.equal('Loader');
    });
    it('inits without Redis url', function* it() {
      const loader = yield i18n.loader.init({});
      expect(loader.constructor.name).to.be.equal('Loader');
    });
    it('disconnects from Redis successfully', function* it() {
      i18n.loader.disconnect();
      const translation = yield i18n.translate({
        '@translate': {
          key: 'hello-john',
          placeholders: {
            john: 'John'
          }
        }
      });
      expect(translation).to.be.equal('hello-john');
    });
  });

  describe('when using the lru cache', () => {
    it('stores translations in memory cache', () => {
      i18n.loader.setItemToCache('lru', {
        en: 'Howdy'
      });

      i18n.loader.setItemToCache('lru', {
        fr: 'Hey'
      });

      const translations = i18n.loader.getItemFromCache('lru');

      expect(translations).to.deep.equal({
        en: 'Howdy',
        fr: 'Hey'
      });
    });
  });

  describe('when retrieving translations', () => {
    it('retrieves translations successfully', function* it() {
      i18n.engine.locale = 'fr';
      const translations = yield i18n.loader.load(i18n.engine, ['howdy', 'hello-john']);

      expect(translations).to.deep.equal({
        en: {
          howdy: 'Howdy',
          'hello-john': 'Hello {{john}}'
        },
        fr: {
          howdy: 'Hey'
        }
      });

      const translation = yield i18n.translate({
        '@translate': {
          key: 'howdy'
        }
      }, 'fr');

      expect(translation).to.be.equal('Hey');
    });
  });

  describe('when using lru cache', () => {
    it('retrieves translations successfully', function* it() {
      i18n.engine.locale = 'fr';

      i18n.loader.setItemToCache('lru-key', {
        en: 'LRU Cache'
      });

      const translations = yield i18n.loader.load(i18n.engine, ['howdy', 'hello-john']);

      expect(translations).to.deep.equal({
        en: {
          howdy: 'Howdy',
          'hello-john': 'Hello {{john}}'
        },
        fr: {
          howdy: 'Hey'
        }
      });

      const translation = yield i18n.translate({
        '@translate': {
          key: 'howdy'
        }
      }, 'fr');

      expect(translation).to.be.equal('Hey');

      const translation2 = yield i18n.translate({
        '@translate': {
          key: 'howdy'
        }
      }, 'fr');

      expect(translation2).to.be.equal('Hey');
    });
  });

  describe('when logging translations', () => {
    it('logs messages on console if no configuration is provided', () => {
      const stub = sandbox.stub(console, 'warn', () => {});

      i18n.loader.logger.warn('Test');

      expect(stub.callCount).to.be.equal(1);
      expect(stub.args[0]).to.deep.equal(['Test']);
    });
    it('logs messages on provided logger if', function* it() {
      const logger = {
        warn: () => {}
      };
      const stub = sandbox.stub(logger, 'warn', () => {});

      yield i18n.loader.init({ logger });

      i18n.loader.logger.warn('Test');

      expect(stub.callCount).to.be.equal(1);
      expect(stub.args[0]).to.deep.equal(['Test']);
    });
  });

  describe('when handling errors', () => {
    it.skip('is safe to Redis EAI_AGAIN issue ', function* it() {
      let warnMessageAdded = false;
      yield i18n.loader.init({
        url: 'redis://wrong-domain:1234',
        logger: {
          warn: () => {
            warnMessageAdded = true;
          }
        }
      });

      const translations = yield i18n.loader.load(i18n.engine, ['howdy']);

      expect(translations).to.deep.equal({});
      expect(warnMessageAdded).to.be.eql(true);
    });
    it('is safe to Redis ECONNREFUSED issue ', function* it() {
      let warnMessageAdded = false;
      yield i18n.loader.init({
        url: 'redis://localhost:1234',
        logger: {
          warn: () => {
            warnMessageAdded = true;
          }
        }
      });

      const translations = yield i18n.loader.load(i18n.engine, ['howdy']);

      expect(translations).to.deep.equal({});
      expect(warnMessageAdded).to.be.eql(true);
    });
    it.skip('is using a retry strategy', () => {});
  });
});
