'use strict';

const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;

const _databases = new Map(); // These will be the database pointers
const _connections = new Map(); // And these will be the connection Promises


/**
 * Connects to the database.
 *
 * @param {Object} config - the database configuration
 * @param {String} config.name - the connection name
 * @param {String} config.uri - the connection uri
 * @returns {Promise} the connection promise
 */
function connect(config) {
  const name = config.name;
  const uri = config.uri;
  assert.ok(name, 'Missing parameter "name" in config');
  assert.ok(uri, 'Missing parameter "uri" in config');

  if (_connections.has(name)) return _connections.get(name);

  const connection = MongoClient.connect(uri, config.options || {});
  _connections.set(name, connection);

  return connection.then(db => {
    _databases.set(name, db);
    return db;
  });
}

/**
 * Connects to all the databases defined in the configuration.
 *
 * @param {Object[]} configs - an array of configuration objects
 * @returns {Promise} a promise of all connections are established
 */
function connectAll(configs) {
  configs = new Set(configs);
  assert.ok(configs.size, 'Missing parameter "configs"');

  configs.forEach(config => {
    assert.ok(config.name, 'Missing parameter "name" in config');
    assert.ok(config.uri, 'Missing parameter "uri" in config');
  });

  return Promise.all([...configs.values()].map(connect));
}

/**
 * Disconnects from a database and removes persistent objects from the pool.
 *
 * @param {Object} name - the connection name
 * @returns {Promise} - a promise of the connection closure
 */
function disconnect(name) {
  assert.ok(name, 'Missing parameter "name"');

  if (!_connections.has(name)) throw new Error(`Invalid connection name: ${name}`);

  return _connections.get(name)
    .catch(() => null)
    .then(db => {
      _connections.delete(name);
      _databases.delete(name);

      if (db) return db.close();
      return Promise.resolve();
    });
  // The promise catches any connection error, and silently ignores it.
  // Reasons:
  //  - any error should have already been caught by the "connect" call,
  //  - the goal here is to close the connection if it exists, or do
  //    nothing otherwise, not minding any connection error.
}

/**
 * Disconnects from all the databases and removes persistent objects from the pool.
 *
 * @returns {Promise} a promise of all the connection closures
 */
function disconnectAll() {
  return Promise.all([..._connections.keys()].map(disconnect));
}

/**
 * Gets a connection promise.
 *
 * @param {String} name - connection name
 * @returns {Promise} the database promise
 */
function getConnection(name) {
  assert.ok(name, 'Missing parameter "name"');
  return _connections.get(name);
}

/**
 * Gets a database pointer.
 * It is created upon a successful connection.
 *
 * @param {String} name - connection name
 * @returns {Object} the database object
 */
function getDatabase(name) {
  assert.ok(name, 'Missing parameter "name"');
  return _databases.get(name);
}

module.exports = {
  _databases,
  _connections,
  getConnection,
  getDatabase,
  connect,
  connectAll,
  disconnect,
  disconnectAll
};
