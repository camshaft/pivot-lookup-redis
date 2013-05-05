/**
 * Module dependencies
 */
var redis = require("redis")
  , debug = require("debug")("pivot:lookup:redis")
  , url = require("url");

/**
 * Setup a redis lookup
 *
 * @param {String|RedisClient} client
 * @param {String} app
 * @return {Function}
 */
module.exports = function(client, app) {
  // Default to localhost
  client = client || "redis://localhost:6379";

  // They've passed us a redis url
  if (typeof client === "string") {
    var options = url.parse(client);

    client = redis.createClient(options.port, options.hostname);

    // Authorize the connection
    if (options.auth) client.auth(options.auth.split(":")[1]);
  };

  // Default app name
  app = app || "app";
  
  /**
   * @param {String} name
   * @param {Array|Boolean} variants
   * @param {Function} done
   */
  return function lookup(name, variants, done){

    debug("Looking up '"+name+"'","with variants",variants);

    // TODO subscribe instead of reading every time
    client.get("pivot:"+app+":"+name, function(err, config) {
      if (err) return done(err);

      // We've got a config object
      // TODO check if the variants have been changed
      if (config) return done(null, JSON.parse(config));

      // Setup the feature config
      var config = {
        enabled: false, // Disabled by default
        deprecated: false, // Set to true when experiment is over
        'default': variants[0] // Default to the first variant in the list
      };

      // Setup the variants
      config.variants = variants.map(function(variant) {
        return {
          users: [], // List of users in the variant
          weight: 1,
          value: variant
        };
      });

      // Store the config
      // TODO maybe store this in a more 'redis' way
      client.set("pivot:"+app+":"+name, JSON.stringify(config), function(err) {
        done(err, config);
      });
    });
    
  };
};
