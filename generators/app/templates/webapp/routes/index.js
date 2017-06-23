const express = require('express');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'City Power & Light',
    home: true,
    user: req.user,
  });
});

module.exports = router;
