import $script from 'scriptjs';

const elementsToRenderOnLoad = [];
let grecaptchaLoaded = false;

const renderElementOnLoad = function(el) {
  elementsToRenderOnLoad.push(el);
}

window.onRecaptchaLoaded = function() {
  grecaptchaLoaded = true;
  for (let i=0; i < elementsToRenderOnLoad.length; i++) {
    let el = elementsToRenderOnLoad[i];
    window.grecaptcha.render(el, {
      'sitekey': '6LeFjiETAAAAAMLWg5ccuWZCgavMCitFq-C4RpYh'//TODO move this to an environment variable.
    });
  }
};

const recaptchaURL = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
// run recaptcha script
$script(recaptchaURL);

export {
  grecaptchaLoaded,
  renderElementOnLoad,
}

