/**
 * Module dependencies
 */
var redis = require("redis")
  , url = require("url");

module.exports = function(redisUrl, redisOptions){
  var options = url.parse(redisUrl);

  var client = redis.createClient(options.port, options.hostname, redisOptions);

  client.auth(options.password);
  
  /**
   * @param {String} name
   * @param {Array|Boolean} variants
   * @param {Function} done
   */
  return function(name, variants, done){

    client.hgetall(name, function(err, obj) {
      // TODO Are we going to get an error if it's not found?
      if(err) return done(err);

      if(obj) {
        done(null, obj.config);
      }
      else {
        client.hmset(name, {variants: variants, config: []}, function(err) {
          done(err, false);
        });
      }
    });
    
  };
};
