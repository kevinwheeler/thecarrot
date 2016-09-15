import $script from 'scriptjs';

const elementsToRenderOnLoad = [];
let grecaptchaLoaded = false;

const renderElementOnLoad = function(el, callback) {
  elementsToRenderOnLoad.push([el, callback]);
}

window.onRecaptchaLoaded = function() {
  grecaptchaLoaded = true;
  for (let i=0; i < elementsToRenderOnLoad.length; i++) {
    const pair = elementsToRenderOnLoad[i];
    const el = pair[0];
    const callback = pair[1];
    const config = {
      'sitekey': '6LeFjiETAAAAAMLWg5ccuWZCgavMCitFq-C4RpYh'//TODO move this to an environment variable.
    };
    if (callback !== undefined) {
      config.callback = callback;
    }
    window.grecaptcha.render(el, config);
  }
};

const recaptchaURL = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
// run recaptcha script
$script(recaptchaURL);

export {
  grecaptchaLoaded,
  renderElementOnLoad,
}

