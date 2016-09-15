const categories = require('./categories');

let exportVal = {
  validateCategory: function(category) {
    if (typeof(category) !== "string") {
      return "Category isn't a string.";
    }

    let categoryFound = false;
    for (let i=0; i < categories.length; i++) {
      if (category === categories[i].otherSlug) {
        categoryFound = true;
        break;
      }
    }

    if (!categoryFound) {
      return "Category invalid."
    }
  },

  validateHeadline: function(headline) {
    if (typeof(headline) !== "string") {
      return "Headline isn't a string."; 
    }
    if (headline.length >= 100) {
      return "Headline too long. Should be less than 100 characters.";
    }
    if (headline.length == 0) {
      return "Headline is empty.";
    }
  },
  
  validateSubline: function(subline) {
    if (typeof(subline) !== "string") {
      return "Subline isn't a string."; 
    }
    if (subline.length >= 300) {
      return "Subline too long. Should be less than 300 characters.";
    }
  },

  validateEverything(headline, subline, category) {
    const validationErrors = [];
    const headlineError = exportVal.validateHeadline(headline);
    const sublineError = exportVal.validateSubline(subline);
    const categoryError = exportVal.validateCategory(category);
    if (headlineError) {
      validationErrors.push(headlineError); 
    }
    if (sublineError) {
      validationErrors.push(sublineError); 
    }
    if (categoryError) {
      validationErrors.push(categoryError);
    }
    if (validationErrors.length) {
      return validationErrors;
    }
  }
};

module.exports = exportVal;
