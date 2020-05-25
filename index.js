const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const timeout = require('await-timeout');
const mongodb = require('./utils/mongodb');
const utils = require('./utils/utils');

async function getReview (term) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const searchTerm = term;

  page.setDefaultNavigationTimeout(0);

  await page.goto('https://www.filmaffinity.com/es/main.html', { waitUntil: 'networkidle2' });

  await page.waitFor('#top-search-input');
  await page.$eval('#top-search-input', (el, searchTerm) => el.value = searchTerm, searchTerm);
  await page.click('input[type="submit"]');

  if (page.url().search('search.php') !== -1) {
    console.log('\n__Busqueda avanzada__\n');

    await page.waitForSelector('.se-it');

    const searchPage = await page.evaluate(() => {
      return document.querySelector('.z-search > .se-it .mc-poster > a[href]').outerHTML.split('"')[3].toString();
    });

    await page.goto(searchPage, { waitUntil: 'networkidle2' });
  } else {
    console.log('\n__Busqueda normal__\n');
  }

  await page.waitFor('#mt-content-cell');

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

  mongodb.insert(mediaReview);
}

exports.init = async () => {
  const TYPE = 'movies';

  let plexURL;

  if (TYPE === 'movies') {
    plexURL = 'https://195-154-178-71.5379a3cd27464d31a0ece20f8b61959b.plex.direct:32400/library/sections/9/all?type=1&sort=originallyAvailableAt%3Adesc&includeCollections=1&includeAdvanced=1&includeMeta=1&X-Plex-Container-Start=0&X-Plex-Container-Size=4500&X-Plex-Product=Plex%20Web&X-Plex-Version=4.33.1&X-Plex-Client-Identifier=bub8wo7yvridyyyu9buwda45&X-Plex-Platform=Chrome&X-Plex-Platform-Version=81.0&X-Plex-Sync-Version=2&X-Plex-Features=external-media%2Cindirect-media&X-Plex-Model=hosted&X-Plex-Device=OSX&X-Plex-Device-Name=Chrome&X-Plex-Device-Screen-Resolution=1577x1306%2C2560x1440&X-Plex-Token=N_-kqDozYX12pJienh9r&X-Plex-Language=es&X-Plex-Text-Format=plain&X-Plex-Provider-Version=1.3&X-Plex-Drm=widevine';
  } else {
    plexURL = 'https://195-154-185-117.00871756c6a94fe78e029a04e31d5790.plex.direct:32400/library/sections/1/all?type=2&sort=originallyAvailableAt%3Adesc&includeCollections=1&includeAdvanced=1&includeMeta=1&X-Plex-Container-Start=0&X-Plex-Container-Size=3&X-Plex-Product=Plex%20Web&X-Plex-Version=4.34.2&X-Plex-Client-Identifier=bub8wo7yvridyyyu9buwda45&X-Plex-Platform=Chrome&X-Plex-Platform-Version=81.0&X-Plex-Sync-Version=2&X-Plex-Features=external-media%2Cindirect-media&X-Plex-Model=hosted&X-Plex-Device=OSX&X-Plex-Device-Name=Chrome&X-Plex-Device-Screen-Resolution=1544x1306%2C2560x1440&X-Plex-Token=J52uXgUGzsyz8JCDByVC&X-Plex-Language=es&X-Plex-Text-Format=plain&X-Plex-Provider-Version=1.3&X-Plex-Drm=widevine';
  }

  mongodb.resetCollection();

  await utils.writeXMLtoJSON(TYPE, plexURL);
  await mongodb.connect(TYPE);

  const mediaList = await utils.convertXMLtoJSON(TYPE);

  for (let i = 1; i < mediaList.elements[0].elements.length; i++) {
    const term = mediaList.elements[0].elements[i].attributes.titleSort || mediaList.elements[0].elements[i].attributes.originalTitle || mediaList.elements[0].elements[i].attributes.title;
    await getReview(term);
  }

  mongoose.connection.close();
}
