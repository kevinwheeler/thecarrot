import $script from 'scriptjs';

const elementsToRenderOnLoad = [];
let grecaptchaLoaded = false;

const renderElementOnLoad = function(el, successCallback, onRenderedCallback) {
  elementsToRenderOnLoad.push([el, successCallback, onRenderedCallback]);
}

const renderElementAsync = function(el, successCallback, onRenderedCallback) {
  if (grecaptchaLoaded) {
    renderElement(el, successCallback, onRenderedCallback)
  } else {
    renderElementOnLoad(el, successCallback, onRenderedCallback);
  }
}

const renderElement = function(el, successCallback, onRenderedCallback) {
  const config = {
    'sitekey': '6LeFjiETAAAAAMLWg5ccuWZCgavMCitFq-C4RpYh'//TODO move this to an environment variable.
  };
  if (successCallback !== undefined) {
    config.callback = successCallback;
  }
  window.grecaptcha.render(el, config);
  if (onRenderedCallback !== undefined) {
    onRenderedCallback();
  }
}

window.onRecaptchaLoaded = function() {
  grecaptchaLoaded = true;
  for (let i=0; i < elementsToRenderOnLoad.length; i++) {
    const triple = elementsToRenderOnLoad[i];
    const el = triple[0];
    const successCallback = triple[1];
    const onRenderedCallback = triple[2];
    renderElement(el, successCallback, onRenderedCallback);
  }
};

const recaptchaURL = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoaded&render=explicit';
// run recaptcha script
$script(recaptchaURL);

export {
  renderElementAsync
}

