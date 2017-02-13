const server = require('../server');
const request = require('request');
const config = require('config');
const chai = require('chai');
const fs = require('fs');
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

    it("return 404 when request empty file", done => {
      request('http://localhost:3333/undefined', (error, response, body) => {
        if (error) return done(error);

        response.statusCode.should.equal(404);

        done();
      });
    });
  });

  describe("POST method tests", () => {
    it("return 200 and html when request home page", done => {
      // NOTE: Advanced use-case, for normal use see 'formData' usage above
      var r = request.post('http://localhost:3333', function optionalCallback(err, httpResponse, body) {
        done();
      })
      var form = r.form();
      form.append('custom_file', fs.createReadStream(config.get('testFilesRoot') + '/aisrplane.jpg'), {filename: 'aisrplane.jpg'});
    });
  });

});
