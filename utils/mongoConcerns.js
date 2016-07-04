const JOURNAL_CONCERN_ENV = process.env.JOURNAL_CONCERN;
const WRITE_CONCERN_ENV = process.env.WRITE_CONCERN;

var JOURNAL_CONCERN;
var WRITE_CONCERN;


{ // setup journal concern
  if (JOURNAL_CONCERN_ENV === "FALSE") {
    JOURNAL_CONCERN = false;
  } else {
    if (JOURNAL_CONCERN_ENV !== "TRUE") {
      throw "JOURNAL_CONCERN environment variable isn't set";
    }
    JOURNAL_CONCERN = true;
  }
}

{ // setup write concern
  if (WRITE_CONCERN_ENV.length === 0) {
    throw "WRITE_CONCERN environment variable isn't set";
  }
  WRITE_CONCERN = parseInt(WRITE_CONCERN_ENV);
}

module.exports = {
  JOURNAL_CONCERN: JOURNAL_CONCERN,
  WRITE_CONCERN: WRITE_CONCERN
}
