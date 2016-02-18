import Backbone from 'backbone';

export default Backbone.Model.extend({
  defaults: {
    "numWordsOrLetters":  200,
    "wordsOrLetters":     "words",
    "fromText":    "lorem ipsum",
    "generatedText": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui"
  },
  validate: function(attrs, options) {
    console.log("in validate");
    let num = parseInt(attrs.numWordsOrLetters);
    console.log("num = " + num);
    if (!num) {
      return "Please input a valid number";
    }
    let max = 100000
    if (num > 10000) {
      return "Please input a number less than " + max;
    }
    if (num < 0) {
      return "Please input a positive number";
    }
    // don't bother validating the other attrs, we'll do it server side.
    // If the other attrs are invalid, the user did it on purpose, because as of right now
    // the other attrs are select boxes. The user couldn't have typed in anything invalid.
  }
});
