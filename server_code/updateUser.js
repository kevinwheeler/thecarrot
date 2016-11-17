const _ = require('lodash');
const logError = require('./utils').logError;
const request = require('request');

let userColl;
function getUserColl(db) {
  const prom = new Promise(function(resolve,reject) {
    db.collection('user', {}, (err, coll) => {
      if (err !== null) {
        reject(err);
      } else {
        userColl = coll;
        resolve();
      }
    });
  })
  return prom;
}

const getError = function(error, response, body) {
  if (error !== null) {
    return error;
  } else if (response.statusCode !== 200) {
    const body = JSON.parse(body);
    // error code 190 seems to be the error for us not having access due to an expired access token /
    // when a user deauthorizes our app / the user logged out.
    // https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling
    if (body && body.error) {
      return body.error;
    } else {
      return "kmw: unknown error";
    }
  } else {
    return null;
  }
};

// TODO handle paged responses from facebook.
const getMiddlewareFunction = function(db) {
  return function(req, res, next) {
    if (req.user) {
      const pageDataToStore = [];

      const getPageData = new Promise(function(resolve, reject) {
        request(`https://graph.facebook.com/v2.7/me/accounts?access_token=${req.user.fbAccessToken}`, function (error, response, body) {
          const err = getError(error, response, body);
          if (err !== null) {
            reject(err);
          } else {
            // The pages that the user is an admin of.
            const pages = JSON.parse(body).data;

            _.remove(pages, function(acct) {
              // Right now pages contains both pages and applications. Remove applications.
              return acct.category === 'Application';
            });
            resolve(pages);
          }
        })
      });

      // Adds data (corresponding to the pages that the user is an admin of) to pageDataToStore.
      // Each element added to pageDataToStore is an an object with two attributes: name, link.
      // Name is the name of the page. Link is the URL of the page.
      const getPages = function() {
        return getPageData.then(function addPageURL(pages) { // for each page, add an extra attribute, pageURL
          const promises = [];
          _.forEach(pages, function(page) {
            const prom = new Promise(function(resolve, reject) {
              request(`https://graph.facebook.com/v2.7/${page.id}?access_token=${req.user.fbAccessToken}&fields=link`, function (error, response, body) {
                const err = getError(error, response, body);
                if (err !== null) {
                  reject(err);
                } else {
                  const pageInfo = JSON.parse(body);
                  const pageItemToStore = {};
                  pageItemToStore.link = pageInfo.link;
                  pageItemToStore.name = page.name;
                  pageDataToStore.push(pageItemToStore);
                  resolve();
                }
              })
            });
            promises.push(prom);
          });
          return Promise.all(promises);
        })
      }

      // Adds data (corresponding to the user's profile page) to pageDataToStore.
      // The element added to pageDataToStore is an an object with two attributes: name, link.
      // Name is the name of the page. Link is the URL of the page.
      function addProfilePage() {
        const prom = new Promise(function(resolve, reject) {
          request(`https://graph.facebook.com/v2.7/me?access_token=${req.user.fbAccessToken}&fields=link`, function (error, response, body) {
            const err = getError(error, response, body);
            if (err !== null) {
              reject(err);
            } else {
              const userInfo = JSON.parse(body);
              const pageItemToStore = {};
              pageItemToStore.link = userInfo.link;
              pageItemToStore.name = req.user.displayName;
              pageDataToStore.push(pageItemToStore);
              resolve();
            }
          })
        });
        return prom;
      }

      // Adds the page data in pageDataToStore to the user record in the database.
      function updateUserInDatabase() {
        return getUserColl(db).then(function() {
          return userColl.updateOne(
            {
              fbId: req.user.fbId
            },
            {
              $set: {pages: pageDataToStore},
            }
          );
        })

      }

      Promise.all([getPages(), addProfilePage()]).then(function() {
        return updateUserInDatabase(db);
      }).then(function() {
        next();
      }).catch(function(err) {
        if (err.code === 190) {
          // Invalid access token. Force the user to re log in so we can get a new acess token.
          req.logout();
          next();
        } else {
          logError(err);
          next(err);
        }
      });

    } else {
      next();
    }
  }
}


module.exports = getMiddlewareFunction;

