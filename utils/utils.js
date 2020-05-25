const fetch = require('node-fetch');
const convert = require('xml-js');
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const timeout = require('await-timeout');

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
