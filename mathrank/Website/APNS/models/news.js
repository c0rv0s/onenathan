// models/news.js
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function () {
  'use strict';

  var NewsSchema = new Schema({
    {
      category: "messaging:offline_notification",
      message: string,           // User input message
      mentioned: [string, ]      // Mentioned User IDs
      channel: {
        channel_url: string,     // Messaging Channel URL
      },
      channel_type: string,      // messaging, group_messaging, chat
      sender: {
        id: string,              // Sender's unique ID
        name: string,            // Sender's nickanme
      },
      recipient: {
        id: string,              // Recipient's unique ID
        name: string,            // Recipeint's nickname
      },
    }
  });

  mongoose.model('News', NewsSchema, 'News');
};
