const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

// Define authentication options
const authConfig = {
  // Required
  // identityMetadata: `https://login.microsoftonline.com/${process.env.aadTenantId}/v2.0/.well-known/openid-configuration`,
  identityMetadata: `https://login.microsoftonline.com/${process.env.aadTenantId}/.well-known/openid-configuration`,
  //
  // or you can use the common endpoint
  // 'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration'
  // To use the common endpoint, you have to either turn `validateIssuer` off,
  // or provide the `issuer` value.

  // Required, the client ID of your app in AAD
  clientID: process.env.aadClientId,

  // Required, must be 'code', 'code id_token', 'id_token code' or 'id_token'
  // If you want to get access_token, you must use 'code', 'code id_token' or 'id_token code'
  responseType: 'code id_token',

  // Required
  responseMode: 'form_post',

  // Required, the reply URL registered in AAD for your app
  redirectUrl: process.env.aadRedirectUrl,

  // Required if we use http for redirectUrl
  allowHttpForRedirectUrl: true,

  // Required if `responseType` is 'code', 'id_token code' or 'code id_token'.
  // If app key contains '\', replace it with '\\'.
  clientSecret: process.env.aadClientSecret,

  // Required to set to false if you don't want to validate issuer
  validateIssuer: false,

  // Required if you want to provide the issuer(s) you want to validate
  // instead of using the issuer from metadata
  // issuer could be a string or an array of strings of the following form: 'https://sts.windows.net/<tenant_guid>/v2.0'
  issuer: null,

  // Required to set to true if the `verify` function has 'req' as the first parameter
  passReqToCallback: false,

  // Recommended to set to true. By default we save state in express session,
  // if this option is set to true, then we encrypt state and save it in cookie instead.
  // This option together with { session: false } allows your app
  // to be completely express session free.
  useCookieInsteadOfSession: false,

  // Required if `useCookieInsteadOfSession` is set to true.
  // You can provide multiple set of key/iv pairs for key
  // rollover purpose. We always use the first set of key/iv pair to encrypt cookie,
  // but we will try every set of key/iv pair to decrypt cookie. Key can be any string of length 32,
  // and iv can be any string of length 12.
  cookieEncryptionKeys: [
    { key: '12345678901234567890123456789012', iv: '123456789012' },
    { key: 'abcdefghijklmnopqrstuvwxyzabcdef', iv: 'abcdefghijkl' },
  ],

  // The additional scopes we want besides 'openid'.
  // 'profile' scope is required, the rest scopes are optional.
  // (1) if you want to receive refresh_token, use 'offline_access' scope
  // (2) if you want to get access_token for graph api, use the graph api url like 'https://graph.microsoft.com/mail.read'
  scope: null,

  // Optional, 'error', 'warn' or 'info'
  loggingLevel: 'info',

  // Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
  nonceLifetime: null,

  // Optional. The max amount of nonce saved in session or cookie, the default value is 10.
  nonceMaxAmount: 5,

  // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
  clockSkew: null,
};

// Array to hold logged in users
const users = [];

const findByOid = (oid, fn) => {
  for (let i = 0, len = users.length; i < len; i += 1) {
    const user = users[i];
    console.info('User: ', user);
    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

module.exports.setup = (app) => {
  //   Passport session setup.

  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.
  passport.serializeUser((user, done) => {
    done(null, user.oid);
  });

  passport.deserializeUser((oid, done) => {
    findByOid(oid, (err, user) => {
      done(err, user);
    });
  });

  //  Use the OIDCStrategy within Passport.
  //
  //   Strategies in passport require a `validate` function, which accept
  //   credentials (in this case, an OpenID identifier), and invoke a callback
  //   with a user object.
  passport.use(new OIDCStrategy(authConfig,
    (iss, sub, profile, accessToken, refreshToken, done) => {
      if (!profile.oid) {
        return done(new Error('No oid found'), null);
      }

      // Store token in profile
      const fullProfile = profile;
      fullProfile.token = accessToken;

      // asynchronous verification, for effect...
      process.nextTick(() => {
        findByOid(fullProfile.oid, (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            // "Auto-registration"
            users.push(fullProfile);
            return done(null, fullProfile);
          }
          return done(null, user);
        });
      });
      return new Error('Failed to parse user');
    },
  ));

  // Routes
  app.get('/', (req, res) => {
    res.render('index', { user: req.user });
  });

  app.get('/login',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login', resourceURL: 'https://graph.microsoft.com' }),
    (req, res) => {
      console.log('Login was called in the Sample');
      res.redirect('/');
    });

  //   Our POST routes

  //   POST /auth/openid
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  The first step in OpenID authentication will involve redirecting
  //   the user to their OpenID provider.  After authenticating, the OpenID
  //   provider will redirect the user back to this application at
  //   /auth/openid/return
  app.post('/auth/openid',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    (req, res) => {
      console.log('Authentication was called');
      res.redirect('/');
    });

  // GET /auth/openid/return
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.get('/auth/openid/return',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    });

  // POST /auth/openid/return
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  app.post('/auth/openid/return',
    passport.authenticate('azuread-openidconnect', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    });

  app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });
};

//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
module.exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
  return new Error('Error with ensureAuthenticated');
};
