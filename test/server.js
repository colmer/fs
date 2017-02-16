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
const rp = require("request-promise").defaults({
  resolveWithFullResponse: true,
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

      it("returns 200 and the file", async () => {
        let fixtureContent = fs.readFileSync(`${fixturesRoot}/small.jpg`);

        let response = await rp(`${host}/small.jpg`)
          .catch(e => e);

        response.statusCode.should.be.equal(200);
        response.body.equals(fixtureContent).should.be.true();
      });
    });

    context("otherwise", () => {
      it("returns 404", async () => {

        let response = await rp(`${host}/small.jpg`)
          .catch(e => e);

        response.statusCode.should.be.equal(404);
      });
    });
  });

  describe('Get nested path', () => {
    it("return 400", async () => {
      let response = await rp(`${host}/nested/path`)
        .catch(e => e);

      response.statusCode.should.be.equal(400);
    });
  });

  describe("POST file", () => {
    context("if exists", () => {
      beforeEach(() => {
        fs.copySync(`${fixturesRoot}/small.jpg`, config.get('filesRoot') + '/small.jpg');
      });

      context("sent small file", () => {
        it("return 409 and not modified", async () => {
          let mtime = fs.statSync(config.get('filesRoot') + '/small.jpg').mtime;
          let file = fs.readFileSync(`${fixturesRoot}/small.jpg`);

          let request = await rp.post({
            uri: `${host}/small.jpg`,
            body: file
          })
          .catch(e => e);

          let newMtime = fs.statSync(config.get('filesRoot') + '/small.jpg').mtime;

          mtime.should.eql(newMtime);
          request.statusCode.should.be.equal(409);
        });
      })
      context("send zero file", () => {
        it("return 409", async () => {
          let request = await rp.post({
            uri:`${host}/small.jpg`,
            body: '',
            resolveWithFullResponse: true,
          })
            .catch(e => e);

          request.statusCode.should.be.equal(409);
        });
      });
    });

    context("sent too big file", () => {
      it("return 413", async () => {
        let bigFile = fs.readFileSync(`${fixturesRoot}/big.jpg`);
        let request = await rp.post({
          uri: `${host}/big.jpg`,
          body: bigFile,
        })
        .catch((e) => e);

        if (request.cause.errno !== 'ECONNRESET' && request.cause.errno !== 'EPIPE') {
          throw new Error('It\'s hell');
        }

        fs.existsSync(config.get('filesRoot') + '/big.jpg').should.be.false();
      });
    });

    context("otherwise with zero file size", () => {

      it('returns 200 & file is uploaded', async () => {
        let request = await rp.post({
          uri:`${host}/small.jpg`,
          body: '',
          resolveWithFullResponse: true,
        })
          .catch(e => e);

        fs.statSync(config.get('filesRoot') + '/small.jpg').size.should.equal(0);
        request.statusCode.should.be.equal(200);

      });

    });

    context("otherwise", () => {

      it("returns 200 & file is uploaded", async () => {
        let file = fs.readFileSync(`${fixturesRoot}/small.jpg`);

        let request = await rp.post({
          uri: `${host}/small.jpg`,
          body: file
        })
        .catch(e => e);

        fs.readFileSync(config.get('filesRoot') + '/small.jpg').equals(
          fs.readFileSync(`${fixturesRoot}/small.jpg`)
        ).should.be.true();

        request.statusCode.should.be.equal(200);
      });
    });
  });

  describe("DELETE file", () => {
    context("not exist", () => {
      it("return 404", async () => {
        let request = await rp.delete(`${host}/small.jpg`)
          .catch(e => e);

        request.statusCode.should.be.equal(404);
      });
    });

    context("otherwise", () => {
      beforeEach(() => {
        fs.copySync(`${fixturesRoot}/small.jpg`, config.get('filesRoot') + '/small.jpg');
      });

      it ("return 200", async () => {

        let request = await rp.delete(`${host}/small.jpg`)
          .catch(e => e);

        request.statusCode.should.be.equal(200);
        fs.existsSync(config.get('filesRoot') + '/small.jpg').should.be.false();
      });
    });
  });
});
