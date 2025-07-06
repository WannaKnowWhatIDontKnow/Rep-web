const logger = {
  info: (...args: any[]): void => {
    console.log('%c[INFO]', 'color: blue; font-weight: bold;', ...args);
  },
  warn: (...args: any[]): void => {
    console.warn('%c[WARN]', 'color: orange; font-weight: bold;', ...args);
  },
  error: (message: string, errorObject?: any): void => {
    console.error('%c[ERROR]', 'color: red; font-weight: bold;', message);
    if (errorObject) {
      console.error(errorObject);
    }
  },
};

export default logger;
