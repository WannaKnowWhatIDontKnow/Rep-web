// src/utils/logger.js

const logger = {
  info: (...args) => {
    console.log('%c[INFO]', 'color: blue; font-weight: bold;', ...args);
  },
  warn: (...args) => {
    console.warn('%c[WARN]', 'color: orange; font-weight: bold;', ...args);
  },
  error: (message, errorObject) => {
    console.error('%c[ERROR]', 'color: red; font-weight: bold;', message);
    if (errorObject) {
      console.error(errorObject);
    }
  },
};

export default logger;
