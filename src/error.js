// levels: 'warning, error'
class BrunoError extends Error {
  constructor(message, level) {
    super(message);
    this.name = 'BrunoError';
    this.level = level || 'error';
  }
}

const parseError = (error, defaultErrorMsg = 'An error occurred') => {
  if (error instanceof BrunoError) {
    return error.message;
  }

  return error.message ? error.message : defaultErrorMsg;
};



module.exports = BrunoError, { parseError };