// Load environment variables
require('dotenv').config();

// Modules
const express = require('express');
const expressHelper = require('./utilities/express');
const errorHelper = require('./utilities/errors');
const authHelper = require('./utilities/auth');

// Create Express Application
const app = express();

// Configure Express
expressHelper.setup(app);

// Configure Authentication
authHelper.setup(app);

// Configure Routes
app.use('/', require('./routes/index'));
app.use('/profile', require('./routes/profile'));

// Configure Errors
errorHelper.setup(app);

// Start Server
app.set('port', process.env.PORT || 3000);
const server = app.listen(app.get('port'), () => {
  console.log(`Express server listening on port ${server.address().port}`);
});
