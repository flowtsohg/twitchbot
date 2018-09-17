module.exports = function formatDate(format, d) {
  let years = d.getUTCFullYear() - 1970;
  let months = d.getUTCMonth();
  let days = d.getUTCDate();
  let hours = d.getUTCHours();
  let minutes = d.getUTCMinutes();
  let seconds = d.getUTCSeconds();
  let milliseconds = d.getUTCMilliseconds();

  return format.replace(/\{yy\}/g, years).replace(/\{mm\}/g, months).replace(/\{dd\}/g, days).replace(/\{hh\}/g, hours).replace(/\{mi\}/g, minutes).replace(/\{ss\}/g, seconds).replace(/\{ms\}/g, milliseconds);
};
