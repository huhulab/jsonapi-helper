if (typeof exports === 'object') {
  if (!global.Promise) {
    require('es6-promise').polyfill();
  }

  var popsicle = require('popsicle');
  var prefix   = require('popsicle-prefix');
  var expect   = require('chai').expect;
}
else {
  window.ES6Promise.polyfill();
}

var JSONAPIHelper = require('../index.js');

var REMOTE_URL = 'http://localhost:4567';

describe('popsicle', function () {
  it('should have some globals', function () {
    expect(popsicle).to.be.a('function');
    expect(prefix).to.be.a('function');
  });

  describe('test HTTP methods', function () {
    it('should get collection', function () {
      return popsicle('/posts').use(prefix(REMOTE_URL))
        .then(function (res) {
          expect(res.status).to.equal(200);
          expect(res.info()).to.be.false;
          expect(res.ok()).to.be.true;
          expect(res.clientError()).to.be.false;
          expect(res.serverError()).to.be.false;
        });
    });

    it('should get item', function () {
      return popsicle('/posts/100').use(prefix(REMOTE_URL))
        .then(function (res) {
          expect(res.status).to.equal(200);
          expect(res.info()).to.be.false;
          expect(res.ok()).to.be.true;
          expect(res.clientError()).to.be.false;
          expect(res.serverError()).to.be.false;
        });
    });

    it('should work with nested request', function () {
      return popsicle('/posts/100').use(prefix(REMOTE_URL))
        .then(function (res) {
          expect(res.status).to.equal(200);
          expect(res.info()).to.be.false;
          expect(res.ok()).to.be.true;
          expect(res.clientError()).to.be.false;
          expect(res.serverError()).to.be.false;

          // another request inside a Promise, Yay!
          return popsicle('/comments').use(prefix(REMOTE_URL))
            .then(function (res) {
              expect(res.status).to.equal(200);
              expect(res.info()).to.be.false;
              expect(res.ok()).to.be.true;
              expect(res.clientError()).to.be.false;
              expect(res.serverError()).to.be.false;
            });
        });
    });
  });
});

describe('jsonapi-helper utils: this._getMainKey', function () {
  it('should return correct mainKey for \'posts\'', function () {
    return popsicle('/posts').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper._getMainKey()).to.be.equal('posts');
      });
  });

  it('should return correct mainKey for \'comments\'', function () {
    return popsicle('/comments').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper._getMainKey()).to.be.equal('comments');
      });
  });
});

describe('jsonapi-helper utils: this._getLinksKeys', function () {
  it('should return correct linksKey for \'posts\'', function () {
    return popsicle('/posts').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper._getLinksKeys()).to.be.eql(['author', 'comments']);
      });
  });

  it('should return correct linksKey for \'comments\'', function () {
    return popsicle('/comments').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper._getLinksKeys()).to.be.eql([]);
      });
  });
});

describe('jsonapi-helper utils: this._getMetaForLinksKey', function () {
  it('should return correct meta into for', function () {
    return popsicle('/posts').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        var metas = {
          comments: {
            type: 'comments',
            href: '/comments/{posts.comments}',
            linksKey: 'posts.comments'
          },
          author: {
            type: 'people',
            href: '/people/{posts.author}',
            linksKey: 'posts.author'
          }
        };
        expect(jsonapiHelper._getMetaForLinksKey('comments'))
          .to.be.eql(metas.comments);
        expect(jsonapiHelper._getMetaForLinksKey('author'))
          .to.be.eql(metas.author);
      });
  });
});

describe('jsonapi-helper utils: this._getLinkedDataByIds', function () {
  it('should return `undefined` when there is no `linked` field', function () {
    return popsicle('/comments').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper._getLinkedDataByIds('comments', 3))
          .to.be.equal(undefined);
      });
  });

  it('should return `undefined` when search with invalid parameters',
     function () {
       return popsicle('/posts').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
           expect(jsonapiHelper._getLinkedDataByIds('comments', 3))
             .to.be.equal(undefined);
         });
     });

  it('should return when find collection by a single id but not found',
     function () {
       return popsicle('/posts').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
           expect(jsonapiHelper._getLinkedDataByIds('comments', 'not-exist'))
             .to.be.eql({});
         });
     });

  it('should return an object when find collection by a single id',
     function () {
       return popsicle('/posts').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
           expect(jsonapiHelper._getLinkedDataByIds('comments', '3')).to.be.eql(
             {
               id: '3',
               body: 'Comment 3'
             }
           );
         });
     });

  it('should return an array when find collection by a collection of ids',
     function () {
       return popsicle('/posts').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
           expect(jsonapiHelper._getLinkedDataByIds('comments',
                                                    ['2', '3', '5', '70']))
             .to.be.eql(
               [                     // '70' is not in this collection.
                 {
                   id: '2',
                   body: 'Comment 2'
                  },
                 {
                   id: '3',
                   body: 'Comment 3'
                 },
                 {
                   id: '5',
                   body: 'Comment 5'
                 }
               ]
             );
         });
     });
});

describe('jsonapi-helper initialize', function () {
  it('should initialize for collection', function () {
    return popsicle('/posts').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper._mainKey).to.be.equal('posts');
        expect(jsonapiHelper._mainObject).to.be.equal(res.body.posts);
        expect(jsonapiHelper._type).to.be.equal('collection');
        expect(jsonapiHelper._links)
          .to.be.equal(jsonapiHelper._jsonapiObject.links);
        expect(jsonapiHelper._linked)
          .to.be.equal(jsonapiHelper._jsonapiObject.linked);
        expect(jsonapiHelper._linksKeys).to.be.eql(['author', 'comments']);
      });
  });

  it('should initialize for item', function () {
    return popsicle('/posts/100').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper._mainKey).to.be.equal('posts');
        expect(jsonapiHelper._mainObject).to.be.equal(res.body.posts);
        expect(jsonapiHelper._type).to.be.equal('item');
        expect(jsonapiHelper._links)
          .to.be.equal(jsonapiHelper._jsonapiObject.links);
        expect(jsonapiHelper._linked)
          .to.be.equal(jsonapiHelper._jsonapiObject.linked);
        expect(jsonapiHelper._linksKeys).to.be.eql(['author', 'comments']);
      });
  });
});

describe('jsonapi-helper expand', function () {
  it('should expand properly with empty collection', function () {
    return popsicle('/empty').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper.expand()).to.be.eql({data: []});
      });
  });

  it('should expand properly with empty item', function () {
    return popsicle('/empty/100').use(prefix(REMOTE_URL))
      .then(function (res) {
        var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
        expect(jsonapiHelper.expand()).to.be.eql({});
      });
  });

  it('should expand properly for collections with `links` and `linked` format',
     function () {
       return popsicle('/posts').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);

           var expand = jsonapiHelper.expand();
           jsonapiHelper.expand();

           expect(expand).to.have.property('data');

           // Yay! Idempotent `expand`
           expect(jsonapiHelper.expand()).to.be.eql(expand);

           expect(jsonapiHelper.expand()).to.have.property('data');
           expect(jsonapiHelper.expand().data).to.be.an('array');
           expect(jsonapiHelper.expand().data[0])
             .to.have.property('author');
           expect(jsonapiHelper.expand().data[0])
             .to.have.property('comments');
           expect(jsonapiHelper.expand()).to.not.have.property('links');
           expect(jsonapiHelper.expand()).to.not.have.property('linked');
           expect(jsonapiHelper.expand()).to.have.property('meta');
         });
     });

  it('should expand for collections without `links` and `linked` format',
     function () {
       return popsicle('/comments').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
           expect(jsonapiHelper.expand().data)
             .to.be.eql(jsonapiHelper._jsonapiObject.comments);
           expect(jsonapiHelper.expand()).to.have.property('data');
           expect(jsonapiHelper.expand()).to.not.have.property('links');
           expect(jsonapiHelper.expand()).to.not.have.property('linked');
           expect(jsonapiHelper.expand()).to.have.property('meta');
         });
     });

  it('should expand properly for items with `links` and `linked` format',
     function () {
       return popsicle('/posts/100').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
           expect(jsonapiHelper.expand()).to.be.an('object');
           expect(jsonapiHelper.expand()).to.not.have.property('posts');
           expect(jsonapiHelper.expand()).to.have.property('author');
           expect(jsonapiHelper.expand()).to.have.property('comments');
           expect(jsonapiHelper.expand()).to.not.have.property('links');
           expect(jsonapiHelper.expand()).to.not.have.property('linked');
           expect(jsonapiHelper.expand()).to.not.have.property('meta');
         });
     });

  it('should expand properly for items without `links` and `linked` format',
     function () {
       return popsicle('/comments/100').use(prefix(REMOTE_URL))
         .then(function (res) {
           var jsonapiHelper = new JSONAPIHelper(res.body, REMOTE_URL);
           expect(jsonapiHelper.expand()).to.be.an('object');
           expect(jsonapiHelper.expand()).to.not.have.property('comments');
           expect(jsonapiHelper.expand()).to.not.have.property('links');
           expect(jsonapiHelper.expand()).to.not.have.property('linked');
           expect(jsonapiHelper.expand()).to.not.have.property('meta');
         });
     });
});
