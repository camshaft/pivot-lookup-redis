/**
 * Module dependencies
 */
var redis = require("redis")
  , debug = require("debug")("pivot:lookup:redis")
  , url = require("url");

/**
 * Setup a redis lookup
 *
 * @param {String} app
 * @param {String|RedisClient} client
 * @param {String} prefix
 * @return {Function}
 */
module.exports = function(app, client, prefix) {
  // Default to localhost
  client = client || "redis://localhost:6379";

  // They've passed us a redis url
  if (typeof client === "string") client = createClient(client);

  // Default key names
  app = app || "app";
  prefix = prefix || "pivot";

  // Register the application with redis
  client.sadd(join(prefix,"applications"), app);
  
  /**
   * Lookup a feature's config
   *
   * @param {String} feature
   * @param {Array} variants
   * @param {Function} done
   */
  return function lookup(feature, variants, done){
    debug("Looking up '"+feature+"'","with variants",variants);

    // Create the key based off of the names
    var key = join(
      prefix,
      app,
      feature.replace(/ /g, '-') // Just in case the pass some spaces
    );

    // TODO subscribe instead of reading every time

    client.hgetall(key, function(err, config) {
      if (err) return done(err);

      // We've got a config object
      if (config) {
        // Normalize the config from redis
        Object.keys(config).forEach(function(prop) {
          config[prop] = JSON.parse(config[prop]);
        });

        // TODO check if the variants have been changed
        return done(null, config);
      }

      // Create a multi operation
      var newFeature = client.multi();

      // Setup the config
      config = {
        enabled: false, // Disabled by default
        deprecated: false, // Set to true when experiment is over
        control: JSON.stringify(variants[0]), // Default to the first variant in the list
        target: JSON.stringify(variants[variants.length-1]) // Default to the last
      };

      // Setup the groups
      var groups = variants.map(function(variant) {
        return {
          users: [], // List of users in the variant
          weight: 1, // Default to 1 - can really be anything >= 0
          value: variant
        };
      });
      config.variants = JSON.stringify(groups);

      // Store the config
      newFeature.hmset(key, config);

      // Let subscribers know there's a new feature
      newFeature.publish(key, "new feature");

      // Add it to the list of app features
      newFeature.sadd(join(prefix,app,"features"), feature);

      // Exec the multi
      newFeature.exec(function(err) {
        done(err, {
          enabled: false,
          deprecated: false,
          control: variants[0],
          target: variants[variants.length-1],
          variants: groups
        });
      });
    });
    
  };
};

function join() {
  return Array.prototype.join.call(arguments, ":");
};

/**
 * Create a redis client from a url
 *
 * @api private
 */
function createClient(redisUrl) {
  var options = url.parse(redisUrl)
    , client = redis.createClient(options.port, options.hostname);

  // Authorize the connection
  if (options.auth) client.auth(options.auth.split(":")[1]);

  // Exit gracefully
  function close() {
    client.end();
  };
  process.once("SIGTERM", close);
  process.once("SIGINT", close);

  return client
};