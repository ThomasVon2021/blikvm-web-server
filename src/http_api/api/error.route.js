function apiFunc(req, res, next) {
  try {
    throw new Error('Something went wrong');
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
