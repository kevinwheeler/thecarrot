let facebookInitialized = false;
const elementsToParseOnLoad= [];

window.fbAsyncInit = function() {
  FB.init({
    appId      : window.kmw.fbAppId,
    xfbml      : false,
    version    : 'v2.7'
  });

  facebookInitialized = true;
  for (let i=0; i < elementsToParseOnLoad.length; i++) {
    const pair = elementsToParseOnLoad[i];
    const el = pair[0];
    const cb = pair[1];
    window.FB.XFBML.parse(el, cb);
  }
};

(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

const parseFbElement =  function(el, cb) {
  if (facebookInitialized) {
    window.FB.XFBML.parse(el, cb);
  } else {
    elementsToParseOnLoad.push([el, cb]);
  }
}

export {
  parseFbElement
};
