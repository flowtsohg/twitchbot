module.exports = function formatDate(format, d) {
    let years = d.getUTCFullYear() - 1970,
        months = d.getUTCMonth(),
        days = d.getUTCDate(),
        hours = d.getUTCHours(),
        minutes = d.getUTCMinutes(),
        seconds = d.getUTCSeconds(),
        milliseconds = d.getUTCMilliseconds();

    return format.replace(/\{yy\}/g, years).replace(/\{mm\}/g, months).replace(/\{dd\}/g, days).replace(/\{hh\}/g, hours).replace(/\{mi\}/g, minutes).replace(/\{ss\}/g, seconds).replace(/\{ms\}/g, milliseconds);
};
