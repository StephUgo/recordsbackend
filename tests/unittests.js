process.env.NODE_ENV = 'test'
var app = require('../app');
var request = require('supertest');
var expect = require('chai').expect;

describe('Our server', function() {

  // Called once before any of the tests in this block begin.
  before(function(done) {
    app.listen(function(err) {
      if (err) { 
        return done(err); }
      done();
    });
  });

  it('Backend should return a JSON object with title set to "System infos"', function(done) {
    request(app)
      .get('/infos')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, function(err, res) {
        if (err) { return done(err); }
        
        var callStatus = res.body.title === 'System infos';
        expect(callStatus).to.equal(true);
        // Done
        done();
      });
  });

});
