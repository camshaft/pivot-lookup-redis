module.exports = function() {
  return function(feature, settings, user, done){
    // For this we're just going to assign the default variant to everyone
    done(null, settings.default);
  };
};
