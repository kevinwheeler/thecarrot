const getSlug = require('speakingurl');

let getExtension = function(filename) {
  // http://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

let filenameWithoutExtension = function(filename) {
  let extension = getExtension(filename);
  if (extension !== "") {
    return filename.slice(0, -(extension.length + 1));
  } else {
    return filename
  }
}

let getFilenameSlug = function(id, filename) {
  const filenameMinusExtension = filenameWithoutExtension(filename);
  const extension = getExtension(filename);
  let slug = getSlug(filenameMinusExtension, {
    truncate: 100 // Truncate to a max length of 100 characters while only breaking on word boundaries.
  });
  if (extension !== "") {
    slug += '.';
  }
  slug += extension;

  if (slug !== '') {
    slug = id + '-' + slug;
  } else {
    slug = id;
  }
  return slug;
}

let getURLSlug = function(id, headline) {
  let slug = getSlug(headline, {
    truncate: 100 // Truncate to a max length of 100 characters while only breaking on word boundaries.
  });
  if (slug !== "") {
    slug = id + '-' + slug;
  } else { // This else statement should never get reached honestly.
    slug = id;
  }
  return slug;
}


module.exports = {
  getURLSlug: getURLSlug,
  getFilenameSlug: getFilenameSlug
};
