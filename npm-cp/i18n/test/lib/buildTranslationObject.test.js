const expect = require('chai').expect;

const i18n = require('../../lib/i18n');

describe('i18n', () => {
  describe('#buildTranslationObject', () => {
    before(function* before() {
      yield i18n.engine.init();

      i18n.engine.addTranslations('fr', {
        hello: 'Monde',
        'hello-john': 'Bonjour {{john}}',
        dogs: '{{count}} chien',
        dogs_plural: '{{count}} chiens'
      });
      i18n.engine.addTranslations('en', {
        hello: 'World',
        'hello-john': 'Hello {{john}}',
        dogs: '{{count}} dog',
        dogs_plural: '{{count}} dogs'
      });
    });
    it('builds valid translation object with simple key', function* it() {
      const obj = i18n.buildTranslationObject('hello');

      const fr = yield i18n.translate(obj, 'fr-FR');
      expect(fr).to.be.equal('Monde');

      const en = yield i18n.translate(obj, 'en-GB');
      expect(en).to.be.equal('World');
    });
    it('builds valid translation object with placeholders', function* it() {
      const obj = i18n.buildTranslationObject('hello-john', { john: 'John' });

      const fr = yield i18n.translate(obj, 'fr-FR');
      expect(fr).to.be.equal('Bonjour John');

      const en = yield i18n.translate(obj, 'en-GB');
      expect(en).to.be.equal('Hello John');
    });
    it('builds valid translation object with fallback', function* it() {
      const obj = i18n.buildTranslationObject('goodbye-john', { john: 'John' },
        { fallback: 'Good bye {{john}}' });

      const fr = yield i18n.translate(obj, 'fr-FR');
      expect(fr).to.be.equal('Good bye John');

      const en = yield i18n.translate(obj, 'en-GB');
      expect(en).to.be.equal('Good bye John');
    });
    it('builds valid translation object with quantity', function* it() {
      let obj = i18n.buildTranslationObject('dogs', {}, { quantity: 1 });

      let fr = yield i18n.translate(obj, 'fr-FR');
      expect(fr).to.be.equal('1 chien');

      let en = yield i18n.translate(obj, 'en-GB');
      expect(en).to.be.equal('1 dog');

      obj = i18n.buildTranslationObject('dogs', {}, { quantity: 2 });

      fr = yield i18n.translate(obj, 'fr-FR');
      expect(fr).to.be.equal('2 chiens');

      en = yield i18n.translate(obj, 'en-GB');
      expect(en).to.be.equal('2 dogs');
    });
    it('builds valid translation object with format (price)', function* it() {
      const obj = i18n.buildTranslationObject('{{price, currency}}', {
        price: { value: 12, currency: 'EUR' }
      });

      const fr = yield i18n.translate(obj, 'fr-FR');
      // eslint-disable-next-line no-irregular-whitespace
      expect(fr).to.be.equal('12,00 €'); // <- ' ' charCode === 160 (not 32)

      const en = yield i18n.translate(obj, 'en-GB');
      expect(en).to.be.equal('€12.00');
    });
    it('builds valid translation object with format (date)', function* it() {
      const obj = i18n.buildTranslationObject('{{date, date}}', {
        date: {
          value: '2016-10-29T23:05:06Z',
          timezone: 'Europe/Paris'
        }
      });

      const fr = yield i18n.translate(obj, 'fr-FR');
      expect(fr).to.be.equal('30 octobre 2016');

      const en = yield i18n.translate(obj, 'en-GB');
      expect(en).to.be.equal('30 October 2016');
    });
  });
});
