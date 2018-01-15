const express = require('express');
const router = express.Router();
const passport = require('passport');
const formatError = require('../../helpers/errors.js').formatError;

const mongoose = require('mongoose');
const ChatChannel = mongoose.model('ChatChannel');

/*
    api routes

    authenticate via basic auth against /api/authenticate and receive a JWT

    afterwards, call endpoints with JWT in Header ("Authorization" : "Bearer <token>")
    Also see supplied postman collection in /stuff/ for how to construct the Authorization Header
*/

/* POST create new to channel. */
router.post('/', passport.authenticate('jwt', { session: false }), function(req, res, next) {
  ChatChannel.createChatChannel(req.body, req.user, (err, chatChannel) => {
    if (err) res.status(500).json({code: 500, status: 'error', errors: [{err}]});
    else res.status(201).json({code: 201, status: 'success', data: {chatChannel: chatChannel}});
  });
});

/* GET chatChannels for current user. */
router.get('/:parentNeighbourhood/:context', passport.authenticate('jwt', { session: false }), function(req, res, next) {
    // console.log(req.body);
    ChatChannel.getChatChannels(req.params, (err, chatChannels) => {
      if (err) res.status(500).json({code: 500, status: 'error', errors: [{err}]});
      else res.status(200).json({code: 200, status: 'success', data: {chatChannels: chatChannels}});
    });
});


module.exports = router;