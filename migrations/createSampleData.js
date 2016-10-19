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

//const download = function(url, dest, cb) {
//  const file = fs.createWriteStream(dest);
//  const request = http.get(url, function(response) {
//    response.pipe(file);
//    file.on('finish', function() {
//      file.close(cb);  // close() is async, call cb after close completes.
//    });
//  }).on('error', function(err) { // Handle errors
//    fs.unlink(dest); // Delete the file async. (But we don't check the result)
//    if (cb) cb(err.message);
//  });
//};

const NUM_ARTICLES_TO_CREATE = 22;
const IMAGE_DIR = __dirname + '/images/';

//for (let i=1; i <= NUM_ARTICLES_TO_CREATE; i++) {
//  download(`http://dummyimage.com/1200x630/000/fff&text=${i}`, __dirname + '/images/' + i + '.png', function(err) {
//    if (err !== undefined) {
//      throw `error downloading image ${i}`;
//    }
//  });
//}


const logError = function(err) {
  console.error(err.stack || err);
  console.trace("Caught from:");
}



const webdriver = require('selenium-webdriver');
require('dotenv').config({path: __dirname + '/../.env'});

By = webdriver.By;
until = webdriver.until;
const driver = new webdriver.Builder()
  .forBrowser('chrome')
  .build();
  
//const uploadUrl = 'https://www.nothingbutheadlines.lol/upload';
//const uploadUrl = 'http://localhost:5000/upload';

const uploadUrl = 'http://localhost:5000/admin/upload';
driver.get('http://localhost:5000/login');
driver.wait(function () {
    return driver.isElementPresent(By.id("js-app"));
    //return driver.findElement(By.id('kmw-picture-input')).isDisplayed();
  }, 30*1000
);

console.log("using " + uploadUrl + " as the upload url.");

for (let i=1; i <= NUM_ARTICLES_TO_CREATE; i++) {
  let headline;
  if (i === 1) {
    headline = "<script>alert('sup');</script>"
  } else {
    headline = "headline " + i;
  }
  driver.get(uploadUrl);
  driver.findElement(By.id('kmw-choose-upload')).click();
  driver.wait(function () {
      return driver.findElement(By.id('kmw-picture-input')).isDisplayed();
    }, 10*1000
  );
  driver.findElement(By.id('kmw-picture-input')).sendKeys(IMAGE_DIR + i + '.png');
  driver.findElement(By.id('kmw-headline-tab')).click();
  driver.wait(function () {
      return driver.findElement(By.id('kmw-headline-input')).isDisplayed();
    }, 10*1000
  );
  driver.findElement(By.id('kmw-headline-input')).sendKeys(headline);
  driver.findElement(By.id('kmw-subline-tab')).click();
  driver.wait(function () {
      return driver.findElement(By.id('kmw-subline-input')).isDisplayed();
    }, 10*1000
  );
  driver.findElement(By.id('kmw-subline-input')).sendKeys("subline " + i);
  driver.findElement(By.id('kmw-category-tab')).click();
  driver.wait(function () {
      return driver.findElement(By.id('kmw-category-select')).isDisplayed();
    }, 10*1000
  );
  const selectList = driver.findElement(By.id('kmw-category-select'));
  const optionsPromise = selectList.findElements(By.css('option'));
  optionsPromise.then(function(options) {
      // skip the first option because it isn't selectable.
      // select between other options in round robin fashion.
      const index = (i % (options.length - 1)) + 1;
      console.log("index = " + index);
      const elToSelect = options[index];
      elToSelect.click();
    }, function(err) {
      logError(err);
      process.exit(1);
    }
  ).then(function() {
      driver.findElement(By.id('kmw-terms-tab')).click();
      driver.wait(function () {
          //var elementPresent = until.elementLocated(By.id("kmw-agree"));
          return driver.findElement(By.id('kmw-agree')).isDisplayed();
          //console.log("is element present? = ");
          //console.log(elementPresent);
          //return elementPresent;
        }, 10*1000
      );
      driver.findElement(By.id('kmw-agree')).click();
      const script = `
      
        var kmwRecaptcha = document.getElementById("kmw-bypass-recaptcha-secret");
        kmwRecaptcha.value= "${process.env.BYPASS_RECAPTCHA_SECRET}";
        var $recaptcha = jQuery(kmwRecaptcha);
        $recaptcha.trigger('kmwChange');
        setInterval(function() {
            if ($('#kmw-done-uploading').length !== 0) {
              document.getElementById('kmw-article-upload-form').submit();
            }
          }, 1000
        );
        return null;
      `
      driver.executeScript(script).then(function(returnValue) {
      });
    }, function(err){
    logError(err);
    process.exit(1);
    }
  ).then(function(){}, function(err) {
    logError(err);
    process.exit(1);
  });
  driver.wait(function () {
      return driver.isElementPresent(By.className("kmw-article-view"));
    }, 10*1000
  );
}


driver.quit();
