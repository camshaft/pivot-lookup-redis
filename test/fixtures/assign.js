module.exports = function() {
  return function(feature, user, done){
    // For this we're just going to assign the control variant to everyone
    done(null, feature.control);
  };
};
