'use strict';
/**
 * @typedef Timezone
 * @type string
 *
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 *
 * @example
 * Europe/Paris
 */

/**
 * @module i18n
 *
 * @description
 * Wrapper over [i18n-node](https://github.com/mashpie/i18n-node) module. _Read its
 * doc first !_
 */
const _ = require('lodash');
const tv4 = require('tv4');

const Loader = require('./Loader');
const Engine = require('./Engine');

/**
 * @translate JSON Schema
 *
 * @private
 * @const {object} TRANSLATE_SCHEMA
 *
 * @see @translate.schema.json
 *
 * @example
 * {
 *   "type": "object",
 *   "required": ["@translate"],
 *   "properties": {
 *     "@translate": {
 *       "type": "object",
 *       "required": ["key"],
 *       "properties": {
 *         "key": {
 *           "type": "string",
 *           "description": "Template key to translate"
 *         },
 *         "quantity": {
 *           "type": "number",
 *           "description": "Plural form quantity"
 *         },
 *         "placeholders": {
 *           "type": "object",
 *           "description": "Template placeholders"
 *         },
 *         "fallback": {
 *           "type": "string",
 *           "description": "Fallback template to be used if the key is not found"
 *         }
 *       }
 *     }
 *   },
 *   "additionalProperties": false
 * }
 *
 * @type {object}
 */
const TRANSLATE_SCHEMA = Object.freeze(require('./@translate.schema'));

/**
 * @translate symbol
 *
 * @const {string} TRANSLATE_SYMBOL
 */
const TRANSLATE_SYMBOL = Object.freeze(TRANSLATE_SCHEMA.required[0]);

const _loader = new Loader();
const _engine = new Engine();

/**
 * Validate the node against the @translate schema definition.
 *
 * @private
 *
 * @param  {object} node The node to test
 * @return {boolean} Validation result
 */
function _validateNode(node) {
  const result = tv4.validateResult(node, TRANSLATE_SCHEMA);

  return result.valid;
}

/**
 * Walk through an array or an object recursively
 *
 * @private
 *
 * @param  {array|object} object Object to translate
 * @param {Engine} engine Engine to use for translation
 * @return {object|string} Prepared object for translation or translated
 *   content
 */
function _walkArrayOrObject(object, engine) {
  const keys = [];

  for (const key of Object.keys(object)) {
    const { res, keys: _keys } = _walk(object[key], engine);

    keys.push(..._keys);
    object[key] = res;
  }

  return { res: object, keys };
}

/**
 * Walk through the object recursively to prepare for translation.
 *
 * @private
 *
 * @param  {object} object Object to translate
 * @param {Engine} engine Engine to use for translation
 * @return {object|string} Prepared object for translation or translated
 *   content
 */
function _walk(object, engine) {
  if (_validateNode(object)) {
    return {
      res: engine.t(object[TRANSLATE_SYMBOL]),
      keys: [object[TRANSLATE_SYMBOL].key]
    };
  }

  if (_.isPlainObject(object)) {
    const _object = Object.assign({}, object);

    return _walkArrayOrObject(_object, engine);
  }

  if (_.isArray(object)) {
    const _object = [...object];

    return _walkArrayOrObject(_object, engine);
  }

  if (object && typeof object.toJSON === 'function') {
    const _object = object.toJSON();
    return _walk(_object, engine);
  }

  return { res: object, keys: [] };
}

/**
 * Translate all @translation nodes in the given object
 *
 * @private
 *
 * @param {Object} object Object to translate
 * @param {string} [locale=en] Locale to use for translation
 * @param {Timezone} [timezone] Valid timezone definition
 * @returns {object|string} Translated object or string
 */
function* translate(object, locale = 'en', timezone = null) {
  // const engine = _engine.cloneInstance();
  const engine = _engine.clone();

  engine.locale = locale;
  engine.timezone = timezone;

  // Initialize the engine for this translation process:
  yield engine.init();

  // Walk the object and load keys:
  const { res, keys } = _walk(object, engine);

  // Load keys from Redis:
  yield _loader.load(engine, keys);

  try {
    return yield res;
  } catch (error) {
    return res;
  }
}

/**
 * i18n @translate object builder helper
 *
 * @example
 *
 * >>> i18n._('hello');
 * { '@translate': { key: 'hello' } }
 *
 * >>> i18n.t('hello');
 * { '@translate': { key: 'hello' } }
 *
 * >>> i18n.helper('hello');
 * { '@translate': { key: 'hello' } }
 *
 * >>> i18n._('hello-name', { name: 'John' });
 * { '@translate': { key: 'hello-name', placeholders: { name: 'John' } } }
 *
 * >>> i18n._('hello-france', {}, { fallback: 'Hello France' });
 * { '@translate': { key: 'hello-france', fallback: 'Hello France' } }
 *
 * >>> i18n._('dogs', { name: 'Rantanplan' }, { quantity: 1 });
 * { '@translate': { key: 'dogs', quantity: 1 } }
 *
 * @param  {string} key                The key to translate
 * @param  {object} placeholders       The placeholders to apply on
 * @param  {string} options.fallback   The fallback if the key is not found
 * @param  {number} options.quantity}  The quantity to use for plural form
 * @return {object}                    @translate object
 */
function buildTranslationObject(key, placeholders, { fallback, quantity } = {}) {
  const _translate = { key };

  if (!_.isEmpty(placeholders) && _.isPlainObject(placeholders)) {
    _translate.placeholders = placeholders;
  }

  if (fallback !== undefined) {
    _translate.fallback = fallback;
  }

  if (quantity !== undefined) {
    _translate.quantity = quantity;
  }

  return { '@translate': _translate };
}

module.exports = {
  get engine() {
    return _engine;
  },
  get loader() {
    return _loader;
  },
  translate,
  buildTranslationObject,
  _: buildTranslationObject
};
