const mongoose = require('mongoose');
const puppeteer = require('puppeteer');
const timeout = require('await-timeout');
const mongodb = require('./utils/mongodb');
const utils = require('./utils/utils');

async function getReview (moviePlexInfo) {
  const searchTerm = moviePlexInfo.titleSort;
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setDefaultNavigationTimeout(0);

  await page.goto('https://www.filmaffinity.com/es/main.html', { waitUntil: 'networkidle2' });

  await page.waitFor('#top-search-input');
  await page.$eval('#top-search-input', (el, searchTerm) => el.value = searchTerm, searchTerm);
  await page.click('input[type="submit"]');

  const url = undefined;

  if (page.url().search('search') === -1) {
    console.log('__Encontrado a la primera__');
    await getMovieReviewFromDetail(browser, page, url, moviePlexInfo);
  } else if (page.url().search('advsearch') !== -1) {
    console.log('__Pelicula no encontrada__');
    await getMovieReviewFromAdvancedSearch(browser, page, moviePlexInfo);
  } else {
    console.log('__Encontrado en busqueda avanzada__');
    await getMovieReviewFromSearch(browser, page, moviePlexInfo);
  }
}

async function getMovieReviewFromDetail(browser, page, url, moviePlexInfo) {
  if (typeof url !== 'undefined') {
    await page.goto(url, { waitUntil: 'networkidle2' });
  }

  await timeout.set(3000);

  const review = await utils.evaluateFilmaffinityPage(page, moviePlexInfo);

  mongodb.insert(review);

  await browser.close();
}

async function getMovieReviewFromSearch(browser, page, moviePlexInfo) {
  await page.waitForSelector('.se-it');

  const searchPage = await page.evaluate(() => {
    const searchSeList = document.querySelector('.z-search > .se-it .mc-poster > a[href]').outerHTML.split('"')[3].toString();
    return searchSeList;
  });

  console.log(searchPage);

  await getMovieReviewFromDetail(browser, page, searchPage, moviePlexInfo);
}

async function getMovieReviewFromAdvancedSearch(browser, page) {
  await browser.close();
  console.log({});
}

async function createReview(type) {
  const mediaListJSON = await utils.convertXMLtoJSON(type);

  for (let i = 1; i < mediaListJSON.elements[0].elements.length; i++) {
    const plexInfo = await utils.createMediaPlexInfo(mediaListJSON, i);
    await getReview(plexInfo);
  }
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
  await createReview(TYPE);

  mongoose.connection.close();
}
