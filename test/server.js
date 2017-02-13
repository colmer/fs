const server = require('../server');
const request = require('request');
const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
let app;

describe("server tests", () => {

  before(done => {
    app = server.listen(3333, done);
  });

  after(done => {
    app.close(done);
  });

  describe("GET method tests", () => {
    it("return 200 and html when request home page", done => {
      request('http://localhost:3333', (error, response, body) => {
        if (error) return done(error);

        response.statusCode.should.equal(200);
        response.headers['content-type'].should.equal('text/html');

        done();
      });
    });
  });

});
