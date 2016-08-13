let exportVal = {
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

  validateEverything(headline, subline) {
    let validationErrors = [];
    let headlineError = exportVal.validateHeadline(headline);
    let sublineError = exportVal.validateSubline(subline);
    if (headlineError) {
      validationErrors.push(headlineError); 
    }
    if (sublineError) {
      validationErrors.push(sublineError); 
    }
    if (validationErrors.length) {
      return validationErrors;
    }
  }
};

module.exports = exportVal;
