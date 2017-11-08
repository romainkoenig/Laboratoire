'use strict';

const assert = require('assert');

const expect = require('./chai.helper').expect;

const mongoHelper = require('../index');

describe('MongoDB Helper', () => {
  const singleConfig = {
    name: 'db-helper-test',
    uri: 'mongodb://localhost:27017/db-helper-test'
  };

  const multipleConfigs = [{
    name: 'db-helper-test-one',
    uri: 'mongodb://localhost:27017/db-helper-test-one'
  }, {
    name: 'db-helper-test-two',
    uri: 'mongodb://localhost:27017/db-helper-test-two'
  }];

  const DOCUMENT = {
    firstname: 'Foo',
    lastname: 'Bar',
    email: 'foo.bar@example.org'
  };

  before(function*() {
    yield mongoHelper.connect(singleConfig);
    yield mongoHelper
      .getDatabase(singleConfig.name)
      .collection('items')
      .insert(DOCUMENT);

    yield mongoHelper.connectAll(multipleConfigs);
    for (const config of multipleConfigs) {
      yield mongoHelper
        .getDatabase(config.name)
        .collection('items')
        .insert(DOCUMENT);
    }
    delete DOCUMENT._id;
  });

  describe('connect()', () => {
    afterEach(function*() {
      yield mongoHelper.disconnectAll();
    });

    it('should connect - Promise', done => {
      mongoHelper.connect(singleConfig).then(db => {
        expect(db).to.exist();
      })
      .then(() => done())
      .catch(done);
    });

    it('should connect - Generator', function*() {
      const db = yield mongoHelper.connect(singleConfig);
      expect(db).to.exist();
    });

    it('should return an existing connection - Promise', done => {
      mongoHelper.connect(singleConfig)
        .then(() => mongoHelper.connect(singleConfig))
        .then(db => {
          expect(db).to.exist();
        })
        .then(() => done())
        .catch(done);
    });

    it('should return an existing connection - Generator', function*() {
      yield mongoHelper.connect(singleConfig);
      const db = yield mongoHelper.connect(singleConfig);
      expect(db).to.exist();
    });

    it('should create persistent objects - Promise', done => {
      mongoHelper.connect(singleConfig).then(() => {
        expect(mongoHelper._databases.get(singleConfig.name)).to.exist();
        done();
      })
      .catch(done);
      expect(mongoHelper._connections.get(singleConfig.name)).to.exist();
    });

    it('should create persistent objects - Generator', function*() {
      const gen = mongoHelper.connect(singleConfig);
      expect(mongoHelper._connections.get(singleConfig.name)).to.exist();

      yield gen;

      expect(mongoHelper._databases.get(singleConfig.name)).to.exist();
    });

    it('should throw an error (missing "name")', function*() {
      let error;

      try {
        yield mongoHelper.connect({ uri: 'foo' });
      } catch (e) {
        error = e;
      }

      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "name" in config');
    });

    it('should throw an error (missing "uri")', function*() {
      let error;

      try {
        yield mongoHelper.connect({ name: 'foo' });
      } catch (e) {
        error = e;
      }

      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "uri" in config');
    });

    it('should throw an error (invalid "uri")', function*() {
      let error;

      try {
        yield mongoHelper.connect({ uri: 'foo', name: 'foo' });
      } catch (e) {
        error = e;
      }

      expect(error).to.exist();
    });
  });

  describe('connectAll()', () => {
    afterEach(function*() {
      yield mongoHelper.disconnectAll();
    });

    it('should connect - Promise', done => {
      mongoHelper.connectAll(multipleConfigs)
        .then(() => done())
        .catch(done);
    });

    it('should connect - Generator', function*() {
      const db = yield mongoHelper.connectAll(multipleConfigs);
      expect(db).to.exist();
    });

    it('should create persistent objects - Promise', done => {
      mongoHelper.connectAll(multipleConfigs)
        .then(() => {
          multipleConfigs.forEach(config => {
            expect(mongoHelper._databases.get(config.name)).to.exist();
          });
          done();
        })
        .catch(done);

      multipleConfigs.forEach(config => {
        expect(mongoHelper._connections.get(config.name)).to.exist();
      });
    });

    it('should create persistent objects - Generator', function*() {
      const gen = mongoHelper.connectAll(multipleConfigs);
      multipleConfigs.forEach(config => {
        expect(mongoHelper._connections.get(config.name)).to.exist();
      });

      yield gen;

      multipleConfigs.forEach(config => {
        expect(mongoHelper._databases.get(config.name)).to.exist();
      });
    });

    it('should throw an error (no config passed)', () => {
      let error;
      try {
        mongoHelper.connectAll();
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "configs"');
    });

    it('should throw an error (empty array passed) - Promise', () => {
      let error;
      try {
        mongoHelper.connectAll([]);
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "configs"');
    });

    it('should throw an error (some config have no names)', () => {
      let error;
      try {
        mongoHelper.connectAll([{}]);
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "name" in config');
    });

    it('should throw an error (some config have no uris)', () => {
      let error;
      try {
        mongoHelper.connectAll([{ name: 'foobar' }]);
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "uri" in config');
    });
  });

  describe('disconnect()', () => {
    afterEach(function*() {
      yield mongoHelper.disconnectAll();
    });

    it('should disconnect - Promise', done => {
      mongoHelper
        .connect(singleConfig)
        .then(mongoHelper.disconnect(singleConfig.name))
        .then(() => done())
        .catch(done);
    });

    it('should disconnect - Generator', function*() {
      yield mongoHelper.connect(singleConfig);
      yield mongoHelper.disconnect(singleConfig.name);
    });

    it('should delete a persistent object - Promise', done => {
      mongoHelper
        .connect(singleConfig)
        .then(mongoHelper.disconnect(singleConfig.name))
        .then(() => {
          expect(mongoHelper._connections.get(singleConfig.name)).to.not.exist();
          expect(mongoHelper._databases.get(singleConfig.name)).to.not.exist();
          done();
        })
        .catch(done);
    });

    it('should delete a persistent object - Generator', function*() {
      yield mongoHelper.connect(singleConfig);
      yield mongoHelper.disconnect(singleConfig.name);

      expect(mongoHelper._connections.get(singleConfig.name)).to.not.exist();
      expect(mongoHelper._databases.get(singleConfig.name)).to.not.exist();
    });

    it('should throw an error (missing name)', () => {
      let error;
      try {
        mongoHelper.disconnect();
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "name"');
    });

    it('should throw an error (invalid name)', () => {
      let error;
      try {
        mongoHelper.disconnect('foobar');
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Invalid connection name: foobar');
    });

    it('should not throw an error (connect throws an error) - Promise', done => {
      mongoHelper.connect({ name: 'foo', uri: 'bar' });
      mongoHelper
        .disconnect('foo')
        .catch(err => err)
        .then(err => {
          expect(err).to.not.exist();
          done();
        });
    });
  });

  describe('disconnectAll()', () => {
    afterEach(function*() {
      yield mongoHelper.disconnectAll();
    });

    it('should disconnect all connections - Promise', done => {
      mongoHelper
        .connectAll(multipleConfigs)
        .then(mongoHelper.disconnectAll())
        .then(() => done())
        .catch(done);
    });

    it('should disconnect all connections - Generator', function*() {
      yield mongoHelper.connectAll(multipleConfigs);
      yield mongoHelper.disconnectAll();
    });

    it('should delete all persistent objects - Promise', done => {
      mongoHelper
        .connectAll(multipleConfigs)
        .then(() => mongoHelper.disconnectAll())
        .then(() => {
          multipleConfigs.forEach(config => {
            expect(mongoHelper._connections.get(config.name)).to.not.exist();
            expect(mongoHelper._databases.get(config.name)).to.not.exist();
          });
          done();
        })
        .catch(done);
    });

    it('should delete all persistent objects - Generator', function*() {
      yield mongoHelper.connectAll(multipleConfigs);
      yield mongoHelper.disconnectAll();

      multipleConfigs.forEach(config => {
        expect(mongoHelper._connections.get(config.name)).to.not.exist();
        expect(mongoHelper._databases.get(config.name)).to.not.exist();
      });
    });
  });

  describe('getConnection()', () => {
    afterEach(function*() {
      yield mongoHelper.disconnectAll();
    });

    it('should get a single connection Promise - Promise', done => {
      mongoHelper.connect(singleConfig).then(() => {
        const connection = mongoHelper.getConnection(singleConfig.name);
        expect(connection).to.be.a('promise');
        return connection;
      })
      .then(db => db.collection('items')
        .find()
        .limit(1)
        .next())
      .then(doc => {
        delete doc._id;
        assert.deepEqual(DOCUMENT, doc);
        done();
      })
      .catch(done);
    });

    it('should get a single connection Promise - Generator', function*() {
      mongoHelper.connect(singleConfig);
      const connection = mongoHelper.getConnection(singleConfig.name);
      expect(connection).to.be.a('promise');
      const db = yield connection;

      const doc = yield db.collection('items').find().limit(1).next();

      delete doc._id;
      assert.deepEqual(DOCUMENT, doc);
    });

    it('should throw an error (missing name)', () => {
      let error;
      try {
        mongoHelper.getConnection();
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "name"');
    });
  });

  describe('getDatabase()', () => {
    afterEach(function*() {
      yield mongoHelper.disconnectAll();
    });

    it('should get a database pointer - Promise', done => {
      mongoHelper.connect(singleConfig).then(() => {
        const db = mongoHelper.getDatabase(singleConfig.name);
        expect(db).to.exist();
        expect(db).to.not.be.a('promise');
        expect(db).to.have.property('collection');
        return db.collection('items').find().limit(1).next();
      })
      .then(doc => {
        delete doc._id;
        assert.deepEqual(DOCUMENT, doc);
        done();
      })
      .catch(done);
    });

    it('should get a database pointer Promise - Generator', function*() {
      yield mongoHelper.connect(singleConfig);
      const db = mongoHelper.getDatabase(singleConfig.name);
      expect(db).to.exist();
      expect(db).to.not.be.a('promise');
      expect(db).to.have.property('collection');

      const doc = yield db.collection('items').find().limit(1).next();
      delete doc._id;
      assert.deepEqual(DOCUMENT, doc);
    });

    it('should throw an error (missing name)', () => {
      let error;
      try {
        mongoHelper.getDatabase();
      } catch (e) {
        error = e;
      }
      expect(error).to.exist();
      expect(error).to.have.property('message', 'Missing parameter "name"');
    });
  });
});
