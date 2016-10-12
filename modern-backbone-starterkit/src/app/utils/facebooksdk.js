const parseFbElement =  function(el, cb) {
  if (window.kmw.facebookInitialized) {
    window.FB.XFBML.parse(el, cb);
  } else {
    window.kmw.fbElementsToParseOnLoad.push([el, cb]);
  }
}

export {
  parseFbElement
};
