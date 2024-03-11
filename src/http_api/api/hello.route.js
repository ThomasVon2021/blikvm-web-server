function apiFunc (req, res, next) {
  try {
    res.json({ msg: 'hello world' });
  } catch (err) {
    next(err);
  }
}

export default apiFunc;
