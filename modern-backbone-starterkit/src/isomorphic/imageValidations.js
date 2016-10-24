// returns an empty array or an array of validation errors.
function validate(width, height, size) {
  const validationErrors = [];

  if (typeof(width) === "number") {
    if (width < 200) {
      validationErrors.push("Images must be at least 200px wide.");
    }
  } else {
    validationErrors.push("Unable to obtain image width.");
  }

  if (typeof(height) === "number") {
    if (height < 200) {
      validationErrors.push("Images must be at least 200px tall.");
    }
  } else {
    validationErrors.push("Unable to obtain image height.");
  }

  const eightMegabytes = 8 * 1000 * 1000;

  if (typeof(size) !== "number") {
    validationErrors.push("Unable to obtain image size.");
  } else {
    if (size >= eightMegabytes) {
      validationErrors.push("Images must be smaller than 8 MB in size.");
    }
  }

  return validationErrors;
}

module.exports = validate;
