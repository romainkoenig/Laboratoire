# i18n library

[![CircleCI](https://circleci.com/gh/transcovo/i18n.svg?style=shield)](https://circleci.com/gh/transcovo/i18n) [![Test Coverage](https://codeclimate.com/repos/57bca05c25343d3857000992/badges/3064b12fcce8b93b0a88/coverage.svg)](https://codeclimate.com/repos/57bca05c25343d3857000992/coverage)

Wrapper over [i18n-node](https://github.com/mashpie/i18n-node) module. _Read its doc first !_

This module aims to translate a full object easily with the following strict format:

```json
{
  "type": "object",
  "required": ["@translate"],
  "properties": {
    "@translate": {
      "type": "object",
      "required": ["key"],
      "properties": {
        "key": {
          "type": "string",
          "description": "Template key to translate"
        },
        "quantity": {
          "type": "number",
          "description": "Plural form quantity"
        },
        "placeholders": {
          "type": "object",
          "description": "Template placeholders"
        },
        "fallback": {
          "type": "string",
          "description": "Fallback template to be used if the key is not found"
        }
      }
    }
  },
  "additionalProperties": false
}


```

and returns the corresponding translation in the given language or apply the fallback.

## Configure the translation engine

See: [i18n-node](https://github.com/mashpie/i18n-node) and [Engine#init](./Engine.html#init)

```js
const i18n = require('@chauffeur-prive/i18n');

// Configure the i18n translation module:
i18n.engine.init({
  locale: 'fr'

  // Any other supported i18n
  // configuration parameter
});
```

## Examples

### Initialization

The translations object is containing the available translations in all supported
languages. A language is identified by its __ISOxxx__ code:

- en-US for the US English,
- fr-FR for the french in France,
- fr-BE for the french in Belgium.

```js
const translations = {
  'en-US': {
    'hello-john': 'Hello {{john}}',
    howdy: 'Howdy',
    'plural-dog': 'one dog called {{dog}}',
    'plural-dog_plural': '{{count}} dogs',
    hello: {
      world: 'Hello world'
    }
  },
  'fr-FR': {
    'hello-john': 'Bonjour {{john}}',
    howdy: 'Hey',
    'plural-dog': 'un chien appelé {{dog}}',
    'plural-dog_plural': '{{count}} chiens',
    hello: {
      world: 'Bonjour le monde'
    }
  }
};

yield i18n.engine.init();

i18n.engine.addTranslations('fr-FR', translations['fr-FR']);
i18n.engine.addTranslations('en-US', translations['en-US']);
```

In the following, we may use the `fallback` property of the `@translate` object
to demonstrate how to format the template.

### Basic use

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'howdy',
  }
}, 'fr-FR');
// > Hey
```

### Placeholders

Placeholders are always defined as an `object` with clearly identified keys.

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'hello-john',
    placeholders: {
      john: 'John'
    }
  }
}, 'fr-FR');
// > Bonjour John
```

### Plurals

Plurals form is activated with the translation property `quantity`.

Please read the [i18next documentation](http://i18next.com/translate/pluralSimple/) for the templates definition.

```js
const singular = yield i18n.translate({
  '@translate': {
    key: 'plural-dog',
    quantity: 1
  }
}, 'en-US');
// > 1 dog

const plural = yield i18n.translate({
  '@translate': {
    key: 'plural-dog',
    quantity: 3
  }
}, 'en-US');
// > 3 dogs
```

### Fallbacks

The fallback is applied if no translation template is found neither in the requested
language and the fallback language.

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'hello-alice',
    fallback: 'Salut {{alice}}'
    placeholders: {
      alice: 'Alice'
    }
  }
}, 'fr-FR');
// > Salut Alice
```

### Formats

#### `date`

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'date-of-today',
    fallback: 'We are the {{date, date}}'
    placeholders: {
      date: {
        value: new Date()
      }
    }
  }
}, 'en-US');
// > We are the 3 February 2016
```

#### `time`

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'current-time',
    fallback: 'It is {{date, time}}'
    placeholders: {
      date: {
        value: new Date()
      }
    }
  }
}, 'en-US');
// > It is 4:05 PM
```

#### `datetime`

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'current-datetime',
    fallback: 'We are exactly the {{date, datetime}}'
    placeholders: {
      date: {
        value: new Date()
      }
    }
  }
}, 'en-US');
// > It is 3 February 2016 4:05 PM
```

#### Timezones

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'current-datetime',
    fallback: 'The date in London is {{date, datetime}}'
    placeholders: {
      date: {
        value: moment('2016-02-03T04:05:06Z'),
        timezone: 'Europe/Paris'
      }
    }
  }
}, 'en-US');
// > The date in London is 3 February 2016 5:05 PM
```

#### `duration`

```js
const translation1 = yield i18n.translate({
  '@translate': {
    key: 'duration-example',
    fallback: 'In {{duration, duration}}'
    placeholders: {
      duration: {
        value: 3900000 // 1h05 in milliseconds
      }
    }
  }
}, 'en-US');
// > In 1 hour, 5 minutes

const translation2 = yield i18n.translate({
  '@translate': {
    key: 'duration-example',
    fallback: 'In {{duration, duration}}'
    placeholders: {
      duration: {
        value: 3900000, // 1h05 in milliseconds
        precision: 1
      }
    }
  }
}, 'en-US');
// > In 1 hour

const translation3 = yield i18n.translate({
  '@translate': {
    key: 'duration-example',
    fallback: 'In {{duration, duration}}'
    placeholders: {
      duration: {
        value: 3900000, // 1h05 in milliseconds
        units: ['minutes']
      }
    }
  }
}, 'en-US');
// > In 65 minutes
```

Note: The package used to perform the translation ([humanize-duration](https://github.com/EvanHahn/HumanizeDuration.js)) does not handle the region part in the locale, but only the language.

#### `currency`

```js
const translation = yield i18n.translate({
  '@translate': {
    key: 'currency-example',
    fallback: 'The price is {{price, currency}}'
    placeholders: {
      price: {
        value: 12.34,
        currency: 'EUR'
      }
    }
  }
}, 'en-US');
// > The price is €12.34
```

## Helper

The helper function helps you generating the strict `@translate` object.

```js
i18n.buildTranslationObject('hello');
i18n._('hello');
i18n._('hello-name', { name: 'John' });
i18n._('hello-france', {}, { fallback: 'Hello France' });
i18n._('dogs', { name: 'Rantanplan' }, { quantity: 1 });
```
