/* global describe, before, beforeEach, after, it, context */

const server = require('../server');
const config = require('config');
const fs = require('fs-extra');
// Add chai
// const chai = require('chai');
// const expect = chai.expect;
// const should = chai.should();
const should = require('should');
const Readable = require('stream').Readable;
// Add request and set encoding to null
const request = require("request").defaults({
  encoding: null
});
// Constants
const fixturesRoot = __dirname + '/fixtures';
const host = 'http://127.0.0.1:3333';

// Make sure that run in test env
process.env.NODE_ENV.should.equal('test');

describe("Server", () => {
  // Run server before start tests
  before(done => {
    server.listen(3333, done);
  });
  //Stop server after tests
  after(done => {
    server.close(done);
  });

  beforeEach(() => {
    fs.emptyDirSync(config.get('filesRoot'));
  });

  describe("Get file", () => {
    context("when exist", () => {
      beforeEach(() => {
        fs.copySync(`${fixturesRoot}/small.jpg`, config.get('filesRoot') + '/small.jpg');
      });

      it("returns 200 and the file", done => {
        let fixtureContent = fs.readFileSync(`${fixturesRoot}/small.jpg`);

        request.get(`${host}/small.jpg`, (err, res, body) => {
          if (err) return done(err);

          body.equals(fixtureContent).should.be.true();
          done();
        });
      });
    });

    context("otherwise", () => {
      it("returns 404", done => {

        request.get(`${host}/small.jpg`, (error, response) => {
          if (error) return done(error);
          response.statusCode.should.be.equal(404);
          done();
        });
      });
    });
  });

  describe('Get nested path', ()=> {
    it("return 400", done => {
      request.get(`${host}/nested/path`, (err, res) => {
        if (err) return done(err);

        res.statusCode.should.be.equal(400);
        done();
      });
    });
  });

  describe("POST file", () => {
    context("if exists", () => {
      beforeEach(() => {
        fs.copySync(`${fixturesRoot}/small.jpg`, config.get('filesRoot') + '/small.jpg');
      });
      context("sent small file", () => {
        it("return 409 and not modified", done => {
          let mtime = fs.statSync(config.get('filesRoot') + '/small.jpg').mtime;

          let req = request.post(`${host}/small.jpg`, (err, res) => {
            if (err) return done(err);

            let newMtime = fs.statSync(config.get('filesRoot') + '/small.jpg').mtime;

            mtime.should.eql(newMtime);
            res.statusCode.should.be.equal(409);
            done();
          });

          fs.createReadStream(`${fixturesRoot}/small.jpg`).pipe(req);
        });
      })
      context("send zero file", () => {
        it ("return 409", done => {
          let req = request.post(`${host}/small.jpg`, (err, response) => {
              if (err) return done(err);

              response.statusCode.should.be.equal(409);
              done();
            });

            // emulate zero-file
            let stream = new Readable();

            stream.pipe(req);
            stream.push(null);
        });
      });
    });

    context("sent too big file", () => {
      it("return 413", done => {
        let req = request.post(`${host}/big.jpg`, (err, res) => {
          if (err) {
            if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
              return done();
            } else {
              return done(err);
            }
          }
          res.statusCode.should.be.equal(413);

          fs.existsSync(config.get('filesRoot') + '/big.jpg').should.be.false();
          done();
        });

        fs.createReadStream(`${fixturesRoot}/big.jpg`).pipe(req);
      });
    });

    context("otherwise with zero file size", () => {

      it('returns 200 & file is uploaded', done => {
        let req = request.post(`${host}/small.jpg`, err => {
          if (err) return done(err);

          fs.statSync(config.get('filesRoot') + '/small.jpg').size.should.equal(0);

          done();
        });

        let stream = new Readable();

        stream.pipe(req);
        stream.push(null);

      });

    });

    context("otherwise", () => {

      it("returns 200 & file is uploaded", done => {
        let req = request.post(`${host}/small.jpg`, err => {
          if (err) return done(err);
          fs.readFileSync(config.get('filesRoot') + '/small.jpg').equals(
            fs.readFileSync(`${fixturesRoot}/small.jpg`)
          ).should.be.true();

          done();
        });

        fs.createReadStream(`${fixturesRoot}/small.jpg`).pipe(req);
      });
    });
  });

  describe("DELETE file", () => {
    context("not exist", () => {
      it("return 404", done => {
        request.delete(`${host}/small.jpg`, (err, res) => {
          if (err) return done(err);

          res.statusCode.should.be.equal(404);
          done();
        });
      });
    });

    context("otherwise", () => {
      beforeEach(() => {
        fs.copySync(`${fixturesRoot}/small.jpg`, config.get('filesRoot') + '/small.jpg');
      });

      it ("return 200", done => {
        request.delete(`${host}/small.jpg`, (err, res) => {
          if (err) return done(err);

          res.statusCode.should.be.equal(200);
          fs.existsSync(config.get('filesRoot') + '/small.jpg').should.be.false();
          done();
        });
      });
    });
  });
});
