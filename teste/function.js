module.exports = { pick };

function pick(i, min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}