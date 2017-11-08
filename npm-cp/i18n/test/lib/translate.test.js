const expect = require('chai').expect;

// eslint-disable-next-line  import/no-extraneous-dependencies
const ObjectId = require('objectid');
const moment = require('moment-timezone');

const i18n = require('../../lib/i18n');

describe('i18n', () => {
  describe('#translate', () => {
    const translations = {
      ar: {
        'plural-dog': '{{count}} dogs',
        'plural-dog_0': 'no dog',
        'plural-dog_1': 'one dog called {{dog}}',
        'plural-dog_2': 'two dogs',
        'plural-dog_3': 'few dogs',
        'plural-dog_4': 'many dogs',
        'plural-dog_5': 'a horde of {{count}} dogs'
      },
      en: {
        escapable: 'Hello <strong>World</strong>',
        'hello-john': 'Hello {{john}}',
        howdy: 'Howdy',
        'plural-dog': 'one dog called {{dog}}',
        'plural-dog_plural': '{{count}} dogs',
        hello: {
          world: 'Hello world'
        }
      }
    };

    before(function* before() {
      yield i18n.engine.init();

      i18n.engine.logger = {
        error: () => null
      };

      i18n.engine.addTranslations('ar', translations.ar);
      i18n.engine.addTranslations('en', translations.en);
    });

    it('translates a simple label', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'howdy'
        }
      });
      expect(translation).to.equal('Howdy');
    });

    it('translates a nested label', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'hello.world'
        }
      });
      expect(translation).to.equal('Hello world');
    });

    it('translates a label with placeholder', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'hello-john',
          placeholders: {
            john: 'John'
          }
        }
      });
      expect(translation).to.equal('Hello John');
    });

    it('uses translation fallback if key not found', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'good-bye-john',
          placeholders: {
            john: 'John'
          },
          fallback: 'Good bye {{john}}'
        }
      });
      expect(translation).to.equal('Good bye John');
    });

    it('translates a label with singular form', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'plural-dog',
          quantity: 1,
          placeholders: {
            dog: 'Rantanplan'
          }
        }
      });
      expect(translation).to.equal('one dog called Rantanplan');
    });

    it('translates a label with plural form', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'plural-dog',
          quantity: 3
        }
      }, 'ar');
      expect(translation).to.equal('few dogs');
    });

    it('translates a nested object', function* it() {
      const translation = yield i18n.translate({
        nested: {
          object: {
            '@translate': {
              key: 'howdy'
            }
          }
        }
      });
      expect(translation).to.deep.equal({
        nested: {
          object: 'Howdy'
        }
      });
    });

    it('translates in array', function* it() {
      const translation = yield i18n.translate([
        {
          '@translate': {
            key: 'howdy'
          }
        },
        {
          '@translate': {
            key: 'hello-john',
            placeholders: {
              john: 'John'
            }
          }
        }
      ]);
      expect(translation).to.deep.equal([
        'Howdy',
        'Hello John'
      ]);
    });

    it('translates in nested array', function* it() {
      const translation = yield i18n.translate({
        array: [
          {
            '@translate': {
              key: 'howdy'
            }
          },
          {
            '@translate': {
              key: 'hello-john',
              placeholders: {
                john: 'John'
              }
            }
          }
        ]
      });
      expect(translation).to.deep.equal({
        array: [
          'Howdy',
          'Hello John'
        ]
      });
    });

    it('translates an instance with toJSON method available', function* it() {
      /**
       * Testing class definition
       * @returns {void}
       */
      function People() {
        this.name = 'John';

        this.toJSON = function toJSON() {
          return {
            salutation: {
              '@translate': {
                key: 'hello-john',
                placeholders: {
                  john: this.name
                }
              }
            }
          };
        };
      }

      const john = new People();
      const translation = yield i18n.translate(john);
      expect(translation).to.deep.equal({
        salutation: 'Hello John'
      });
    });

    describe('date', () => {
      it('formats date in en-GB correctly', function* it() {
        const date = moment.tz('2016-02-03 04:05:06', 'Europe/Paris');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Today is {{date, date}}',
            placeholders: {
              date: {
                value: date
              }
            }
          }
        }, 'en-GB');
        expect(translation).to.equal('Today is 3 February 2016');
      });
    });

    describe('datetime', () => {
      it('formats datetime in fr-FR correctly', function* it() {
        const date = moment.tz('2016-02-03 04:05:06', 'Europe/Paris');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Nous sommes exactement le {{date, datetime}}',
            placeholders: {
              date: {
                value: date
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Nous sommes exactement le mercredi 3 février 2016 04:05');
      });

      it('formats datetime with correct timezone applied', function* it() {
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Nous sommes exactement le {{date, datetime}}',
            placeholders: {
              date: {
                value: '2016-02-03T03:05:06Z',
                timezone: 'Europe/Paris'
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Nous sommes exactement le mercredi 3 février 2016 04:05');
      });

      it('formats datetime with correct timezone applied from engine', function* it() {
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Nous sommes exactement le {{date, datetime}}',
            placeholders: {
              date: {
                value: '2016-02-03T03:05:06Z'
              }
            }
          }
        }, 'fr-FR', 'Europe/Paris');
        expect(translation).to.equal('Nous sommes exactement le mercredi 3 février 2016 04:05');
      });

      it('supports daily saving time', function* it() {
        const translationA = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Nous sommes exactement le {{date, datetime}}',
            placeholders: {
              date: {
                value: '2016-10-29T23:05:06Z',
                timezone: 'Europe/Paris'
              }
            }
          }
        }, 'fr-FR');
        expect(translationA).to.equal('Nous sommes exactement le dimanche 30 octobre 2016 01:05');

        const translationB = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Nous sommes exactement le {{date, datetime}}',
            placeholders: {
              date: {
                value: '2016-10-30T00:05:06Z',
                timezone: 'Europe/Paris'
              }
            }
          }
        }, 'fr-FR');
        expect(translationB).to.equal('Nous sommes exactement le dimanche 30 octobre 2016 02:05');

        const translationC = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Nous sommes exactement le {{date, datetime}}',
            placeholders: {
              date: {
                value: '2016-10-30T02:05:06Z',
                timezone: 'Europe/Paris'
              }
            }
          }
        }, 'fr-FR');
        expect(translationC).to.equal('Nous sommes exactement le dimanche 30 octobre 2016 03:05');
      });
    });

    describe('time', () => {
      it('formats time in es-ES correctly', function* it() {
        const date = moment.tz('2016-02-03 04:05:06', 'Europe/Paris');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Son las {{date, time}}',
            placeholders: {
              date: {
                value: date
              }
            }
          }
        }, 'es-ES');
        expect(translation).to.equal('Son las 4:05');
      });
    });

    describe('duration', () => {
      it('should format duration correctly in english', function* it() {
        const duration = moment.duration(1, 'hour').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'In {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration
              }
            }
          }
        }, 'en-US');
        expect(translation).to.equal('In 1 hour');
      });

      it('should format durations correctly in french', function* it() {
        const duration = moment.duration(1, 'hour').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 1 heure');
      });

      it('should format duration correctly with the best precision', function* it() {
        const duration = moment.duration(1, 'day').add(2, 'hours').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 1 jour, 2 heures');
      });

      it('should format duration correctly with a small precision', function* it() {
        const duration = moment.duration(1, 'day').add(2, 'hours').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration,
                precision: 1
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 1 jour');
      });

      it('should format duration correctly with a big precision', function* it() {
        const duration = moment.duration(1, 'day').add(2, 'hours').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration,
                precision: 10
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 1 jour, 2 heures');
      });

      it('should format duration correctly with the given unit', function* it() {
        const duration = moment.duration(1, 'day').add(2, 'hours').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration,
                units: ['minutes']
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 1560 minutes');
      });

      it('should format duration correctly with the given units', function* it() {
        const duration = moment.duration(2, 'hours').add(5, 'seconds').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration,
                units: ['minutes', 'seconds']
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 120 minutes, 5 secondes');
      });

      it('should format duration correctly and ignore an invalid units parameter', function* it() {
        const duration = moment.duration(2, 'hours').add(5, 'seconds').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration,
                units: []
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 2 heures, 5 secondes');
      });

      it('should format duration correctly with rounding not activated', function* it() {
        const duration = moment.duration(30, 'days').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration,
                units: ['month']
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 0,9856262833675564 mois');
      });

      it('should format duration correctly with rounding activated', function* it() {
        const duration = moment.duration(30, 'days').as('milliseconds');
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-duration',
            fallback: 'Dans {{duration, duration}}',
            placeholders: {
              duration: {
                value: duration,
                units: ['month'],
                round: true
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Dans 1 mois');
      });
    });

    describe('currency', () => {
      it('formats prices correctly without precision', function* it() {
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-price',
            fallback: 'Le prix est de {{amount, currency}}',
            placeholders: {
              amount: {
                value: 12.34,
                currency: 'EUR'
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Le prix est de 12,34 €');
      });

      it('formats prices correctly with precision', function* it() {
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-date',
            fallback: 'Le prix est de {{amount, currency}}',
            placeholders: {
              amount: {
                value: 12.34,
                currency: 'EUR',
                precision: 0
              }
            }
          }
        }, 'fr-FR');
        expect(translation).to.equal('Le prix est de 12 €');
      });
    });

    it('does nothing with wrong format definition', function* it() {
      const translation = yield i18n.translate({
        '@translate': {
          key: 'format-date',
          fallback: 'Il est {{date, monformat}}',
          placeholders: {
            date: '2016-02-03 04:05:06'
          }
        }
      }, 'fr-FR');
      expect(translation).to.equal('Il est 2016-02-03 04:05:06');
    });

    it('does not translate invalid @translate object with additional property', function* it() {
      const invalid = {
        '@translate': {
          key: 'howdy'
        },
        wrong: 'key'
      };
      const translation = yield i18n.translate(invalid);
      expect(translation).to.deep.eql(invalid);
    });

    it('does not translate invalid @translate object with invalid format', function* it() {
      const invalid = {
        '@translate': {
          key: 'howdy',
          quantity: 'my quantity'
        }
      };
      const translation = yield i18n.translate(invalid);
      expect(translation).to.deep.eql(invalid);
    });

    it('keeps a string safe', function* it() {
      const translation = yield i18n.translate('Hello');
      expect(translation).to.equal('Hello');
    });

    it('keeps null safe', function* it() {
      const translation = yield i18n.translate(null);
      expect(translation).to.equal(null);
    });

    it('keeps undefined safe', function* it() {
      const translation = yield i18n.translate(undefined);
      expect(translation).to.equal(undefined);
    });

    it('keeps a number safe', function* it() {
      const translation = yield i18n.translate(123);
      expect(translation).to.equal(123);
    });

    it('keeps a boolean safe', function* it() {
      const translation = yield i18n.translate(true);
      expect(translation).to.equal(true);
    });

    it('keeps an ObjectId safe', function* it() {
      const objectId = new ObjectId();
      const translation = yield i18n.translate(objectId);
      expect(translation).to.equal(`${objectId}`);
    });

    it('does not escape translations by default', function* it() {
      const escapable = {
        '@translate': {
          key: 'nested-escapable',
          fallback: '$t(escapable)'
        }
      };
      const translation = yield i18n.translate(escapable);
      expect(translation).to.be.equal('Hello <strong>World</strong>');
    });

    it('translates a complex object successfully', function* it() {
      /**
       * Testing class definition
       * @returns {void}
       */
      function Class() {
        this.test = 1;

        this.toJSON = function toJSON() {
          return {
            test: this.test
          };
        };
      }

      const example = {
        nested: {
          someKey: {
            '@translate': {
              key: 'hello-john',
              placeholders: { john: 'Nested' }
            }
          }
        },
        array: [{
          '@translate': {
            key: 'hello-john',
            placeholders: { john: 'Array' }
          }
        }],
        null: null,
        undefined,
        date: new Date(),
        class: new Class(),
        object: {
          a: {
            b: 1
          }
        },
        firstKey: {
          '@translate': {
            key: 'howdy'
          }
        },
        plural: {
          '@translate': {
            key: 'plural-dog',
            quantity: 1,
            placeholders: {
              dog: 'Rantanplan'
            }
          }
        }
      };

      const translated = yield i18n.translate(example);

      expect(translated).to.deep.equal({
        nested: {
          someKey: 'Hello Nested'
        },
        array: ['Hello Array'],
        null: null,
        undefined,
        date: example.date.toJSON(),
        class: {
          test: 1
        },
        object: {
          a: {
            b: 1
          }
        },
        firstKey: 'Howdy',
        plural: 'one dog called Rantanplan'
      });
    });

    describe('handling errors', () => {
      const logger = {
        error: () => null,
        clone: () => logger
      };

      before(() => {
        i18n.engine.logger = logger;
      });
      after(() => {
        i18n.engine.logger = console;
      });

      it('handles error successsfully in formatter', function* it() {
        const translation = yield i18n.translate({
          '@translate': {
            key: 'format-price',
            fallback: 'Le prix est de {{amount, currency}}',
            placeholders: {
              amount: {
                value: 12.34,
                currency: undefined
              }
            }
          }
        }, 'fr-FR');

        expect(translation).to.be.an('object');
        expect(translation).to.have.property('error');
        expect(translation.error).to.be.instanceof(Error);
        expect(translation.error).to.have
          .property('message', 'Currency code is required when style is currency');
      });
    });
  });
});
