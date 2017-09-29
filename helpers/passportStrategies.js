const passport = require('passport');
const Strategy = require('passport-http').BasicStrategy;

const bcrypt = require('bcrypt');

function genHashedPassword (clearPassword) {
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(clearPassword, salt);
  return hash;
}

const mongoose = require('mongoose');
const User = mongoose.model('User');

const comparePassword = function (clearPassword, user) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(clearPassword, user.password, function(err, res) {
      if (err) console.log(err);
      // console.log('auth result:' + res);
      resolve(res);
    });
  });
};

passport.use(new Strategy(
  function(username, password, cb) {
    User.findOne({"username" : username}, function(err, user) {


      if (err) { return cb(err); }
      if (!user) { return cb('user not found.', false); }
      comparePassword(password, user).then(res => {
        // console.log(`passport: ${username}, ${password}, ${res}`);
        if (res === false) {
          console.log(`user ${user.username}: wrong password.`);
          return cb({type: 'auth', status: 401, message: 'wrong password.'}, false);
        } else {
          if (user.disabled) { // marked as disabled
            console.log(`user ${user.username} is marked as disabled.`);
            return cb({type: 'auth', status: 403, message: 'user is marked as disabled.'}, false);
          } else { // may proceed
            return cb(null, user);
          }
        }
      });
    });
  }));

  const JwtStrategy = require('passport-jwt').Strategy,
  ExtractJwt = require('passport-jwt').ExtractJwt;

  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = process.env.JWT_SECRET || 'shhhhh';
  // opts.issuer = 'auth.konfettiapp.de';
  // opts.audience = 'konfettiapp.de';
  opts.ignoreExpiration = false;
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    User.findOne({id: jwt_payload.sub}, function(err, user) {
      if (err) {
        return done(err, false);
      }
      if (user) {
        if (!user.disabled) {
          return done(null, user);
        } else {
          console.log(`user ${user.username} is marked as disabled.`);
          return done({type: 'auth', status: 403, message: 'user is marked as disabled.'}, false);
        }
      } else {
        return done({type: 'auth', message: 'user is unknown.'}, false);
        // or you could create a new account (TODO)
      }
    });
  }));
