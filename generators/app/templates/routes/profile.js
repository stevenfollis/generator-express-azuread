const express = require('express');
const request = require('request-promise-native');
const authUtility = require('../utilities/auth');

const router = express.Router();

/* GET profile page. */
router.get('/', authUtility.ensureAuthenticated, async (req, res) => {
  // Create options object configuring the HTTP call
  const options = {
    url: 'https://graph.microsoft.com/v1.0/me',
    method: 'GET',
    json: true,
    headers: {
      authorization: `Bearer ${req.user.token}`,
    },
  };

  // Query the Graph using async/await syntax
  const attributes = await request(options);

  // Render page with attributes
  res.render('profile', {
    title: 'Profile',
    user: req.user,
    attributes,
  });
});

module.exports = router;
