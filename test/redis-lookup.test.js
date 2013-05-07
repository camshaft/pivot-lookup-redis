var should = require("should")
  , pivot = require("pivot")
  , assign = require("./fixtures/assign")
  , lookup = require("..");

describe("Pivot", function() {

  var experiments;

  beforeEach(function() {
    experiments = pivot();
    experiments.lookup(lookup());
    experiments.assign(assign());
  });

  it("should setup a feature", function(done) {
    experiments
      .feature("testing123")
      .variants(["test1","test2","test3"])
      .create(function(err) {
        if(err) return done(err);

        experiments.variant("testing123", {}, function(err, variant) {
          if(err) return done(err);

          should.exist(variant);

          // Our fixture returns the first thing in the array
          variant.should.eql("test1");

          done();
        });
      });

  });

  it("should setup an AB feature", function(done) {
    experiments
      .feature("myFeature")
      .create(function(err) {
        if(err) return done(err);

        experiments.variant("myFeature", {}, function(err, variant) {
          if(err) return done(err);

          should.exist(variant);

          // Our fixture returns the first thing in the array
          variant.should.eql(false);

          done();
        });
      });
  });

});
