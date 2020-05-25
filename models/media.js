const mongoose = require('mongoose');

var mediaSchema = new mongoose.Schema({
    title: {
      type: String,
    },
    sinopsis: {
      type: String,
    },
    thumbnail: {
      type: String,
    },
    ratingAvergae: {
      type: String,
    },
    ratingCount: {
      type: String,
    },
    viewCount: {
      type: Number,
    },
    type: {
      type: String,
    },
    duration: {
      type: String,
    },
    studio: {
      type: String,
    },
    reviewList: [
      {
        body: String,
        author: String,
        evaluation: String
      }
    ]
  }
);

mongoose.model('Media', mediaSchema);
