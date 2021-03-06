'use strict';
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var expect = require('expectations');
var Promise = require('bluebird');

describe('fetch-retry', function() {

  var fetchRetry;
  var fetch;

  var deferred1;
  var deferred2;
  var deferred3;
  var deferred4;

  var thenCallback;
  var catchCallback;

  var _setTimeout;

  beforeEach(function() {
    _setTimeout = setTimeout;

    setTimeout = function(callback) {
      callback();
    };
    setTimeout = sinon.spy(setTimeout);
  });

  afterEach(function() {
    setTimeout = _setTimeout;
  });

  beforeEach(function() {
    deferred1 = defer();
    deferred2 = defer();
    deferred3 = defer();
    deferred4 = defer();

    fetch = sinon.stub();
    fetch.onCall(0).returns(deferred1.promise);
    fetch.onCall(1).returns(deferred2.promise);
    fetch.onCall(2).returns(deferred3.promise);
    fetch.onCall(3).returns(deferred4.promise);

    var stubs = {
      'isomorphic-fetch': fetch
    };

    fetchRetry = proxyquire('./', stubs);
  });


  describe('#url', function() {

    var expectedUrl = 'http://some-url.com';

    beforeEach(function() {
      fetchRetry(expectedUrl);
    });

    it('passes #url to fetch', function() {
      expect(fetch.getCall(0).args[0]).toBe(expectedUrl);
    });

  });

  describe('#options', function() {

    var expectedOptions = {
      retries: 3,
      whatever: 'something'
    };

    beforeEach(function() {
      fetchRetry('http://someUrl', expectedOptions);
    });

    it('passes #url to fetch', function() {
      expect(fetch.getCall(0).args[1]).toBe(expectedOptions);
    });

  });

  describe('when #options.retries=3 (default)', function() {

    beforeEach(function() {
      thenCallback = sinon.spy();
      catchCallback = sinon.spy();

      fetchRetry('http://someurl')
        .then(thenCallback)
        .catch(catchCallback);
    });

    describe('when first call is a success', function() {

      beforeEach(function() {
        deferred1.resolve();
      });

      describe('when resolved', function() {

        it('invokes the then callback', function() {
          expect(thenCallback.called).toBe(true);
        });

        it('calls fetch once', function() {
          expect(fetch.callCount).toBe(1);
        });

      });

    });

    describe('when first call is a failure', function() {

      beforeEach(function() {
        deferred1.reject();
      });

      describe('when second call is a succcess', function() {

        beforeEach(function() {
          deferred2.resolve();
        });

        describe('when resolved', function() {

          it('invokes the then callback', function() {
            expect(thenCallback.called).toBe(true);
          });

          it('calls fetch twice', function() {
            expect(fetch.callCount).toBe(2);
          });

        });

      });

      describe('when second call is a failure', function() {

        beforeEach(function() {
          deferred2.reject();
        });

        describe('when third call is a success', function() {

          beforeEach(function() {
            deferred3.resolve();
          });

          describe('when resolved', function() {

            it('invokes the then callback', function() {
              expect(thenCallback.called).toBe(true);
            });

            it('calls fetch three times', function() {
              expect(fetch.callCount).toBe(3);
            });

          });

        });

        describe('when third call is a failure', function() {

          beforeEach(function() {
            deferred3.reject();
          });

          describe('when fourth call is a success', function() {

            beforeEach(function() {
              deferred4.resolve();
            });

            describe('when resolved', function() {

              it('invokes the then callback', function() {
                expect(thenCallback.called).toBe(true);
              });

              it('calls fetch four times', function() {
                expect(fetch.callCount).toBe(4);
              });

            });

          });

          describe('when fourth call is a failure', function() {

            beforeEach(function() {
              deferred4.reject();
            });

            describe('when rejected', function() {

              it('invokes the catch callback', function() {
                expect(catchCallback.called).toBe(true);
              });

              it('does not call fetch again', function() {
                expect(fetch.callCount).toBe(4);
              });

            });

          });

        });

      });

    });

  });

  describe('when #options.retries=1', function() {

    beforeEach(function() {
      thenCallback = sinon.spy();
      catchCallback = sinon.spy();

      fetchRetry('http://someurl', { retries: 1 })
        .then(thenCallback)
        .catch(catchCallback);
    });

    describe('when first call is a success', function() {

      beforeEach(function() {
        deferred1.resolve();
      });

      describe('when resolved', function() {

        it('invokes the then callback', function() {
          expect(thenCallback.called).toBe(true);
        });

        it('calls fetch once', function() {
          expect(fetch.callCount).toBe(1);
        });

      });

    });

    describe('when first call is a failure', function() {

      beforeEach(function() {
        deferred1.reject();
      });

      describe('when second call is a succcess', function() {

        beforeEach(function() {
          deferred2.resolve();
        });

        describe('when resolved', function() {

          it('invokes the then callback', function() {
            expect(thenCallback.called).toBe(true);
          });

          it('calls fetch twice', function() {
            expect(fetch.callCount).toBe(2);
          });

        });

      });

      describe('when second call is a failure', function() {

        beforeEach(function() {
          deferred2.reject();
        });

        describe('when rejected', function() {

          it('invokes the catch callback', function() {
            expect(catchCallback.called).toBe(true);
          });

          it('does not call fetch again', function() {
            expect(fetch.callCount).toBe(2);
          });

        });

      });

    });

  });

});

function defer() {
  var resolve, reject;
  var promise = new Promise(function() {
    resolve = arguments[0];
    reject = arguments[1];
  });
  return {
    resolve: resolve,
    reject: reject,
    promise: promise
  };
}
