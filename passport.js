const passport = require('passport');
const local = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { UserModel } = require('./app');

passport.use(
  new local(function (username, password, done) {
    UserModel.findOne({ username: username }, function (err, user) {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Incorrect Username !' });

      //  bcrypt for comparision
      bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) return done(err);
        if (!isMatch) return done(null, false, { message: 'Incorrect Password !' });
        return done(null, user);
      });
    });
  })
);

module.exports = passport;
