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
    const el = elementsToParseOnLoad[i];
    window.FB.XFBML.parse(el);
  }
};

(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

const parseFbElement =  function(el) {
  if (facebookInitialized) {
    window.FB.XFBML.parse(el);
  } else {
    elementsToParseOnLoad.push(el);
  }
}

export {
  parseFbElement
};
