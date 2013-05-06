module.exports = function() {
  return function(feature, settings, user, done){
    // For this we're just going to assign the control variant to everyone
    done(null, settings.control);
  };
};
