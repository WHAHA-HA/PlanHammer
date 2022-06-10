var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = Models.User;
var shouldPay = Middlewares.secure.shouldPay;

// Passport init
passport.serializeUser(function(user, done) {
  if (user) {
    done(null, user);
  }
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({
    'username': username
  }, function(err, user) {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false, {
        message: 'Unknown user ' + username
      });
    }
    user.checkAllowed(function(err, allowed) {
      if (err) return done(err);
      if (!allowed) {
        return done(null, false, {
          message: 'Please confirm your email address.'
        });
      } else {
        user.comparePassword(password, function(err, isMatch) {
          if (err) return done(err);
          if (isMatch) {
            User.update({ _id: user._id }, { $inc: { login_count: 1 } }).exec();
            return done(null, user);
          } else {
            return done(null, false, {
              message: 'Invalid password'
            });
          }
        });
      }
    })
  });
}));


passport.use(new GoogleStrategy(config.get('google'),
  function(req, accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.findOne({ 'social.google.id': profile.id }, function(err, user) {
        if (err) return done(err);
        if (user) return done(null, user);
        
        var username = profile.id
        var email = profile.emails[0].value
        var password = profile.id + new Date().getTime();
        var referral = req.query.state;

        var user = new User({
          'username': username,
          'email': email,
          'password': password,
          'name.first': profile.name.givenName,
          'name.last': profile.name.familyName,
          'social.google.id': profile.id,
          'confirmation.status': true
        });

        User.findOne({email: profile.emails[0].value}, function(err, userDoc) {
          if (userDoc) {
            User.update({email: profile.emails[0].value}, {'social.google.id': profile.id}, function(err, updated) {
              (err)
                ? done(err)
                : done(null, user);
            });
          } else {
            user.save(function(error) {
              if (error) return done(error);

              if (referral) {
                User.findOne({ _id: referral }, function (err, refUser) {
                  if (refUser) {
                    user.set('_referral', refUser._id);
                    user.set('plan', 'invited');
                    user.save(function (error) {});

                    refUser.freeMonth();
                  }
                });
              } else {
                user.set('free_period_start', new Date());
                user.save(function (error) {});
              }

              Helpers.project.example(user).then(function () {
                done(null, user);
              });
            });
          }
        });
      });
    });
  }
));


// passport init for express
app.use(passport.initialize());
app.use(passport.session());


app.get('/auth/google', function (req, res) {
  var referral = req.query.referral;
  var options = {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  };

  if (referral) options.state = referral;

  passport.authenticate('google', options)(req, res);
});

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '#/signin' }),
  shouldPay,
  function(req, res) {
    res.redirect('/');
});
