'use strict';

const _ = require('lodash');
const i18next = require('i18next');

const formatter = require('./formatter');

const DEFAULT_LOCALE = 'en';

/**
 * @class Engine
 *
 * @description
 * This class is adding an abstraction layer over the effective translation engine.
 *
 * Multiple engines have been evaluated and tested. i18next is the one with the
 * most robustness and connectivities.
 *
 * i18n is too simple for our purpose (on-demand Redis loading).
 * node-polyglot is not supporting standards and plurals are not valid as well.
 *
 * @param {object} [config={}] Engine configuration
 * @param {string} [config.locale=en] Engine locale
 * @param {object} [config.translations] Engine initial translations
 * @return {Loader} Instance
 */
class Engine {
  constructor(config = {}) {
    this._config = config;

    this._logger = console;
  }

  get locale() {
    return this._engine.language;
  }

  set locale(locale) {
    this._config.locale = this._engine.language = locale;
  }

  get timezone() {
    return this._config.timezone;
  }

  set timezone(timezone) {
    this._config.timezone = timezone;
  }

  get logger() {
    return this._logger;
  }

  set logger(logger) {
    this._logger = logger;
  }

  getDefaultLocale() {
    return 'en';
  }

  getLocales() {
    const locales = [this.getDefaultLocale()];
    if (this.locale !== this.getDefaultLocale()) {
      locales.unshift(this.locale);
    }
    return locales;
  }

  /**
   * Loader initialization function
   * @param {object} [config={}] Engine configuration
   * @param {string} [config.locale=en] Engine locale
   * @param {object} [config.translations] Engine initial translations
   * @return {void}
   */
  * init(config) {
    if (config) {
      this._config = config;
    }
    yield cb => this._engine.init(_.merge({}, {
      lng: this.locale || DEFAULT_LOCALE,
      interpolation: {
        escapeValue: false,
        format: (value, format, locale) => formatter(value, format, locale, this)
      }
    }, this._config), cb);
  }

  /**
   * Translate a specific key with optional placeholders or plural form
   *
   * @private
   *
   * @param {object} translate Translate object
   * @param {string} translate.key Label key to be translated
   * @param {object|array} [translate.placeholders] Placeholders to apply on translation
   *   template
   * @param {number} [translate.quantity] Plural form quantity
   * @param {string} [translate.fallback] Fallback template to apply if no translation found
   * @return {string} Translated string
   */
  t(translate) {
    const self = this;

    return function* translateGenerator() {
      const { key, placeholders = {}, quantity, fallback } = translate;

      // Plural form:
      if (typeof quantity === 'number') {
        placeholders.count = quantity;
      }

      try {
        // Fallback application:
        if (!self._engine.exists(key) && fallback) {
          return self._engine.t(fallback, placeholders);
        }

        return self._engine.t(key, placeholders);
      } catch (error) {
        self.logger.error(error, translate, '[i18n.Engine#t] Translation error');
        translate.error = error;
      }

      return translate;
    };
  }

  /**
   * Add translations to the engine
   *
   * @see http://i18next.com/docs/jsons/
   *
   * @param {string} locale Locale to add translations on
   * @param {object} translations Translations to add
   * @return {Engine} The current engine
   */
  addTranslations(locale, translations) {
    this._engine.addResourceBundle(locale, 'translation', translations, true);
    return this;
  }

  /**
   * Clone the translation engine
   * @return {Engine} Cloned engine
   */
  clone() {
    const clone = new Engine(this._config);
    clone._engine = this._engine.cloneInstance();
    clone._logger = typeof this._logger.clone === 'function' ? this._logger.clone() : this._logger;
    return clone;
  }
}

Engine.prototype._engine = i18next.createInstance();

module.exports = Engine;
