const { Router } = require('express');
const router = new Router();
const User = require('./model');
const bcrypt = require('bcrypt');
router.post('/signup', (req, res, next) => {
  console.log('got a request on /signup');
  if (!req.body.email || !req.body.password) {
    res.status(400).send({
      message: 'Please supply a valid email and password'
    });
  }
  const user = {
    name: req.body.name,

    email: req.body.email,

    password: bcrypt.hashSync(req.body.password, 10)
  };

  User.create(user)
    .then(user => {
      res.status(201).send('user created');
    })
    .catch(next);
});
module.exports = router;
