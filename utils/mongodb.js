const mongoose = require('mongoose');
require('../models/media');
const Media = mongoose.model('Media');

exports.connect = async (collection) => {
  return mongoose.connect(`mongodb+srv://rldona:rld198200@plex-fake-qdjua.mongodb.net/${collection}`, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (!err) {
      console.log('Successfully established connection with MongoDB')
    } else {
      console.log('Failed to establish connection with MongoDB with Error: '+ err)
    }
  });
};

exports.insert = async (obj) => {
  var media = new Media({
    title: obj.title,
    sinopsis: obj.sinopsis,
    thumbnail: obj.thumbnail,
    ratingAvergae: obj.ratingAvergae,
    ratingCount: obj.ratingCount,
    reviewList: obj.reviewList,
    originalTitle: obj.originalTitle,
    titleSort: obj.titleSort,
    viewCount: obj.viewCount,
    type: obj.type,
    summary: obj.summary,
    duration: obj.duration,
    studio: obj.studio
  });

  media.save(err => {
    if (!err) {
      console.log(`Added to MongoDB: ${obj.title}`);
    } else {
      console.log('Error during record insertion : ' + err);
    }
  });
}

exports.resetCollection = async () => {
  Media.collection.drop();
};