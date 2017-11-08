# Mongo helper

[![Circle CI](https://circleci.com/gh/transcovo/mongo-helper.svg?style=shield&circle-token=8a8246e33a2aebdfbe382f9e7b49e902fa58de5a)](https://circleci.com/gh/transcovo/mongo-helper)
[![Coverage Status](https://coveralls.io/repos/github/transcovo/mongo-helper/badge.svg?branch=master&t=Bb5i2C)](https://coveralls.io/github/transcovo/mongo-helper?branch=master)

## Requirements

This module uses Node `6` features, so module that require it have to use at least that version.

- mongodb `2+`

## Getting started

This module provides helpers for managing mongo connections.

```
const mongoHelper = require('@chauffeur-prive/mongo-helper');
```

## API

###mongoHelper.connect(config)

Parameters:

```
const config = {
  name: 'store',
  uri: 'mongodb://localhost:27017/store'
};
```

Promises:

```
mongoHelper.connect(config).then(db => {
    ...
});
```

Generators:

```
const db = yield mongoHelper.connect(config);
```

###mongoHelper.connectAll(configs)

Parameters:

```
const configs = [{
  name: 'store',
  uri: 'mongodb://localhost:27017/store'
}, {
  name: 'analytics',
  uri: 'mongodb://localhost:27027/analytics'
}];
```

Promises:

```
mongoHelper.connectAll(configs).then(() => {
    ...
});
```

Generators:

```
yield mongoHelper.connectAll(configs);
```


###mongoHelper.disconnect(name)

Promises:

```
mongoHelper.connect(config).then(() => {
  return mongoHelper.disconnect(config.name).then(() => {
    ...
  });
});
```

Generators:

```
yield mongoHelper.connect(config);
yield mongoHelper.disconnect(config.name);
```


###mongoHelper.disconnectAll()

Promises:

```
mongoHelper.connectAll(configs).then(() => {
  mongoHelper.disconnectAll().then(() => {
    ...
  });
});
```

Generators:

```
yield mongoHelper.connectAll(configs);
yield mongoHelper.disconnectAll();
```

###mongoHelper.getConnection(name)

Returns a connection Promise.

Promises:

```
mongoHelper.connect(config);
mongoHelper.getConnection(config.name).then(db => {
  ...
});
```

Generators:

```
mongoHelper.connect(config);
const db = yield mongoHelper.getConnection(config.name);
```


###mongoHelper.getDatabase(name)

Returns a database pointer.

Promises:

```
mongoHelper.connect(config).then(db => {
  const _db = mongoHelper.getDatabase(config.name);
});
```

Generators:

```
yield mongoHelper.connect(config);
const db = mongoHelper.getDatabase(config.name);
```
