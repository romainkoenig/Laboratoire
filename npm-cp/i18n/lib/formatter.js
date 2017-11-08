'use strict';

/** @module formatter */

const _ = require('lodash');
const humanizeDuration = require('humanize-duration');
const moment = require('moment-timezone');
const Intl = require('intl');

/**
 * Formatters definition
 *
 * @const {object} FORMATTERS
 */
const FORMATTERS = {
  date: formatDate,
  time: formatTime,
  datetime: formatDateAndTime,
  duration: formatDuration,
  currency: formatCurrency
};

/**
 * Format a value against its specified format
 * @public
 *
 * @param  {mixed}  value  Value to format
 * @param  {string} format Format identifier (date, time, datetime or currency)
 * @param  {string} locale The locale to use for formatting
 * @param  {Engine} engine Translation engine to load keys on
 * @return {string}        The formatted value
 */
function formatter(value, format, locale, engine) {
  const _formatter = FORMATTERS[format];
  return _formatter ? _formatter(value, locale, engine) : value;
}

/**
 * Create a moment date from value with the correct locale attached.
 * @private
 * @param  {Object} date  Date object to format
 * @param  {string|Date} date.value  Date value
 * @param  {Timezone} [date.timezone]  Destination timezone for translation
 * @param  {string} locale The locale to use for formatting
 * @param  {Engine} engine Translation engine to load keys on
 * @return {string}        The formatted value
 */
function localeDate({ value, timezone }, locale, engine) {
  const date = moment(value).locale(locale);

  const _timezone = getValidTimezone(timezone, engine);
  if (_timezone) {
    return date.tz(_timezone);
  }

  return date;
}

/**
 * Format a date
 * @private
 * @param  {string|Date}  value  Date to format
 * @param  {string} locale The locale to use for formatting
 * @param  {Engine} engine Translation engine to load keys on
 * @return {string}        The formatted value
 */
function formatDate(value, locale, engine) {
  return localeDate(value, locale, engine).format('LL');
}

/**
 * Format a time
 * @private
 * @param  {string|Date}  value  Date to format
 * @param  {string} locale The locale to use for formatting
 * @param  {Engine} engine Translation engine to load keys on
 * @return {string}        The formatted value
 */
function formatTime(value, locale, engine) {
  return localeDate(value, locale, engine).format('LT');
}

/**
 * Format a date with time
 * @private
 * @param  {string|Date}  value  Date to format
 * @param  {string} locale The locale to use for formatting
 * @param  {Engine} engine Translation engine to load keys on
 * @return {string}        The formatted value
 */
function formatDateAndTime(value, locale, engine) {
  return localeDate(value, locale, engine).format('LLLL');
}

const _durationUnitsMap = Object.freeze({
  year: 'y',
  years: 'y',
  month: 'mo',
  months: 'mo',
  week: 'w',
  weeks: 'w',
  day: 'd',
  days: 'd',
  hour: 'h',
  hours: 'h',
  minute: 'm',
  minutes: 'm',
  second: 's',
  seconds: 's',
  millisecond: 'ms',
  milliseconds: 'ms'
});

/**
 * Format a duration
 * @private
 * @param  {object} duration The duration to format
 * @param  {number} duration.value A duration in milliseconds
 * @param  {number} [duration.precision] The number of duration units to display
 * @param  {String[]} [duration.units] The number of duration units to display
 * @param  {boolean} [duration.round] Activate result rounding
 * @param  {string} locale The locale to use for formatting
 * @return {string} The formatted duration
 */
function formatDuration({ value, precision, units, round }, locale) {
  const config = {
    language: locale.split('-')[0]
  };
  if (precision) config.largest = precision;
  if (round) config.round = round;
  if (!_.isEmpty(units)) config.units = units.map(unit => _durationUnitsMap[unit]);

  return humanizeDuration(value, config);
}

/**
 * Format a price
 * @private
 * @param  {object} amount  The price to format
 * @param  {number} amount.value The price amount
 * @param  {string} amount.currency The price currency (ISO4217)
 * @param  {number} amount.precision The number of decimal allowed after comma.
 * This is an option, if there is none : NumberFormat will take the number of
 * decimal by default in the country. Because this is an interval between
 * minimumFractionDigits and 3, we need to use both minimumFractionDigits
 * and maximumFractionDigits.
 * @param  {string} locale The locale to use for formatting
 * @return {string}        The formatted value
 */
function formatCurrency({ value, currency, precision }, locale) {
  return Intl.NumberFormat(locale, { // eslint-disable-line new-cap
    style: 'currency',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    currency }).format(value);
}

/**
 * Returns a valid timezone or null if invalid or not defined
 * @param  {Timezone} timezone  Destination timezone for translation
 * @param  {Engine} engine Translation engine to load keys on
 * @return {Timezone|null} Timezone or null
 */
function getValidTimezone(timezone, engine) {
  return timezone || engine.timezone;
}

module.exports = formatter;
