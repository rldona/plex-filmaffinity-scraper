const fetch = require('node-fetch');
const convert = require('xml-js');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

exports.writeXMLtoJSON = async (type, url) => {
  let dataAsJson = {};

  return fetch(url)
  .then(response => response.text()).then(xml => {
    dataAsJson = JSON.parse(convert.xml2json(xml));
  }).then(() => {
    let data = JSON.stringify(dataAsJson);
    fs.writeFileSync(`plex-${type}-list.json`, data);
    console.log('JSON created !!');
  });
};

exports.convertXMLtoJSON = async (type) => {
  const mediaList = await readFileAsync(`plex-${type}-list.json`);
  return JSON.parse(mediaList.toString('utf8'));
};

exports.createMediaPlexInfo = async (list, index) => {
  return {
    title: list.elements[0].elements[index].attributes.title || list.elements[0].elements[index].attributes.originalTitle,
    originalTitle: list.elements[0].elements[index].attributes.originalTitle || list.elements[0].elements[index].attributes.title,
    titleSort: list.elements[0].elements[index].attributes.titleSort || list.elements[0].elements[index].attributes.title,
    viewCount: parseInt(list.elements[0].elements[index].attributes.viewCount) || 0,
    type: list.elements[0].elements[index].attributes.type || 'movie',
    summary: list.elements[0].elements[index].attributes.summary || '',
    duration: list.elements[0].elements[index].attributes.duration || 0,
    studio: list.elements[0].elements[index].attributes.studio || '',
  }
};

exports.evaluateFilmaffinityPage = async (page, media) => {
  const mediaReview = await page.evaluate(() => {
    const movieTitle = document.querySelector('h1 span') ? document.querySelector('h1 span').textContent : '';
    const reviewDescription = document.querySelector('[itemprop="description"]') ? document.querySelector('[itemprop="description"]').textContent : '';
    const reviewImage = document.querySelector('[itemprop="image"]') ? document.querySelector('[itemprop="image"]').outerHTML.split(' ')[4].replace('src="', '').replace('"', '') : '';
    const ratingAvergae = document.querySelector('#movie-rat-avg') ? document.querySelector('#movie-rat-avg').textContent.split('').filter(word => word !== ' ' && word !== '\n' && word !== ',').toString() : '0';
    const ratingCount = document.querySelector('#movie-count-rat > span') ? document.querySelector('#movie-count-rat > span').textContent : '0';

    const professionalReviewList = document.querySelectorAll('#pro-reviews li') || [];

    let reviewList = [];

    professionalReviewList.forEach(review => {
      let reviewBody = review.querySelector('[itemprop="reviewBody"]');
      let reviewAuthor = review.querySelector('.pro-crit-med');
      let reviewEvaluation = review.querySelector('.pro-crit-med > i');

      if (reviewBody && reviewAuthor) {
        reviewList.push({
          body: reviewBody.textContent,
          author: reviewAuthor.textContent,
          evaluation: reviewEvaluation.outerHTML.split(' ')[5].replace('"', '')
        });
      }
    });

    return {
      title: movieTitle,
      sinopsis: reviewDescription,
      thumbnail: reviewImage,
      ratingAvergae: ratingAvergae,
      ratingCount: ratingCount,
      reviewList
    }
  });

  mediaReview.title = media.title;
  mediaReview.originalTitle = media.originalTitle;
  mediaReview.titleSort = media.titleSort;
  mediaReview.viewCount = media.viewCount;
  mediaReview.type = media.type;
  mediaReview.summary = media.summary;
  mediaReview.duration = media.duration;
  mediaReview.studio = media.studio;

  console.log(mediaReview);

  return mediaReview;
}