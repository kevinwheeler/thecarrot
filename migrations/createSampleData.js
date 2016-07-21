/*

Before running this script you will need to

npm install selenium-webdriver

Also, as indicated by the selenium-webdriver README on github, you will need to install the chrome web driver onto your system. If running on OSX you can use

brew install chromedriver


This script will download NUM_ARTICLES_TO_CREATE images from http://dummyimage.com and assumes they will be .png images. Hopefully
dummyimage.com won't end up changing this.

*/
const http = require('http');
const fs = require('fs');

const download = function(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  const request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

const NUM_ARTICLES_TO_CREATE = 50;
const IMAGE_DIR = __dirname + '/images/';

for (var i=1; i <= NUM_ARTICLES_TO_CREATE; i++) {
  download(`http://dummyimage.com/1200x630/000/fff&text=${i}`, __dirname + '/images/' + i + '.png', function(err) {
    if (err !== undefined) {
      throw `error downloading image ${i}`;
    }
  });
}





const webdriver = require('selenium-webdriver');
require('dotenv').config({path: __dirname + '/../.env'});
console.log('session secret = ' + process.env.BYPASS_RECAPTCHA_SECRET);

By = webdriver.By;
let driver = new webdriver.Builder()
  .forBrowser('chrome')
  .build();

for (var i=1; i <= NUM_ARTICLES_TO_CREATE; i++) {
  //driver.get('https://www.createaheadline.com/upload');
  driver.get('http://localhost:5000/upload');
  driver.findElement(By.id('kmw-picture-input')).sendKeys(IMAGE_DIR + i + '.png');
  driver.findElement(By.id('kmw-headline-input')).sendKeys("headline " + i);
  driver.findElement(By.id('kmw-subline-input')).sendKeys("subline " + i);
  const script = `
  
    var kmwRecaptcha = document.getElementById("kmw-bypass-recaptcha-secret");
    kmwRecaptcha.value= "${process.env.BYPASS_RECAPTCHA_SECRET}";
    jQuery('.kmw-upload-view').on("doneUploading", function(){
      document.getElementById('kmw-article-upload-form').submit();
    });
    return null;
  `
  driver.executeScript(script).then(function(returnValue) {
  });
  driver.wait(function () {
      return driver.isElementPresent(By.className("rwc-article-view"));
    }, 10*1000
  );
}

driver.quit();
