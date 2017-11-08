'use strict';

const EventEmitter = require('events');

const _ = require('lodash');
const redis = require('redis');
const lru = require('lru-cache');

/**
 * @class Loader
 *
 * @description
 * This class is responsible of Redis database translations loading. To work
 * propertly, it must be configured with a valid Redis database url.
 *
 * @param {object} [config={}] Loader configuration
 * @param {string} [config.url] Redis url such as `redis://localhost:6379`
 * @return {Loader} Instance
 */
class Loader extends EventEmitter {
  constructor(config = {}) {
    super();

    this._config = config;

    this._cache = lru(Object.assign({
      max: 500,
      maxAge: 1000 * 60 * 60
    }, config.cache || {}));

    this.on('add', this.setItemToCache);
  }

  /**
   * Loader initialization function
   * @param {object} [config={}] Loader configuration
   * @param {string} [config.url] Redis url such as `redis://localhost:6379`
   * @return {void}
   */
  * init(config) { // eslint-disable-line require-yield
    if (config) {
      this._config = config;
    }
    this.disconnect();
    if (!this.redis && this._config.url) {
      this.redis = redis.createClient(this._config.url, {
        retry_strategy: options => {
          /* istanbul ignore else */
          if (options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands
            // with a individual error
            return new Error('The server refused the connection');
          } else if (options.error.code === 'EAI_AGAIN') {
            // End reconnecting on a specific error and flush all commands
            // with a individual error
            return new Error('The server is not accessible');
          }

          // reconnect after
          // @FIXME
          /* istanbul ignore next */
          return Math.max(options.attempt * 100, 3000);
        }
      });
    }
    return this;
  }

  get logger() {
    return this._config.logger || console;
  }

  /**
   * Disconnect from redis
   * @return {void}
   */
  disconnect() {
    if (this.redis) {
      this.redis.quit();
      delete this.redis;
    }
  }

  /**
   * Get a specifig key from cache
   * @param  {string} key The translation key to retrieve
   * @param  {...string} locales The list of locales to filter or all if none found
   * @return {object} item
   */
  getItemFromCache(key, ...locales) {
    const value = this._cache.get(key) || {};

    if (locales.length) {
      return _.pick(value, ...locales);
    }

    return value;
  }

  /**
   * Set updated translatios to the cache for a given key
   * @param  {string} key The translation key to retrieve
   * @param  {object} translations The list of templates per locale
   * @return {void}
   */
  setItemToCache(key, translations) {
    const value = this.getItemFromCache(key);

    this._cache.set(key, Object.assign(value, translations));
  }

  /**
   * @typedef LoaderGetItemFromCacheResponse
   * @type Object
   * @property {object} translations The translations found from cache
   * @property {array} unknown The list of keys not found in cache
   */

  /**
   * Load keys from cache
   * @param {Engine} engine Translation engine to load keys on
   * @param {array} keys Array of keys to load
   * @return {LoaderGetItemFromCacheResponse} Translations loading result
   */
  loadFromCache(engine, keys) {
    const translations = {};

    // Locales to load (fallback):
    const locales = engine.getLocales();

    const unknown = [];

    for (const key of keys) {
      const _translations = this.getItemFromCache(key, ...locales);
      if (!_.isEmpty(_translations)) {
        Object.assign(translations, _.reduce(_translations, (result, value, locale) => {
          _.set(result, `${locale}.${key}`, value);
          return result;
        }, {}));
      } else {
        unknown.push(key);
      }
    }

    return { translations, unknown };
  }

  /**
   * Load keys from Redis
   * @param {Engine} engine Translation engine to load keys on
   * @param {array} keys Array of keys to load
   * @return {object} translations Newly loaded translations
   */
  * load(engine, keys) {
    const translations = {};
    if (!this.redis) return translations;

    try {
      // Locales to load (fallback):
      const locales = engine.getLocales();

      const { translations: _translations, unknown } = this.loadFromCache(engine, keys);

      Object.assign(translations, _translations);

      if (unknown.length) {
        const multi = this.redis.multi();

        for (const key of unknown) {
          multi.hmget(key, ...engine.getLocales());
        }

        const res = yield cb => multi.exec(cb);

        // Reformat the translations:
        for (const [i, key] of keys.entries()) {
          for (const [j, locale] of locales.entries()) {
            const template = _.get(res, `${i}.${j}`);
            if (template) {
              this.emit('add', key, { [locale]: template });
              _.set(translations, `${locale}.${key}`, template);
            }
          }
        }
      }

      // Add translations to the engine:
      _.forOwn(translations, (templates, locale) => {
        engine.addTranslations(locale, templates);
      });
    } catch (error) {
      this.logger.warn(error, '[Loader] Failed to load translations from Redis');
    }

    return translations;
  }
}

module.exports = Loader;
