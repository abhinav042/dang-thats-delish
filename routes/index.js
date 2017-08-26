const express = require('express');
const router = express.Router();
const storeController = require("../controllers/storeController");
// Do work here
router.get('/', (req, res) => {
  res.send('Hey! It works!');
});

router.get('/', storeController.homePage);

module.exports = router;
