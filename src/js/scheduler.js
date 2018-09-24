/* global dayjs */

const scheduler = {
  rangeRand(min, max) {
    return min + Math.floor((max - min + 1) * Math.random()); // eslint-disable-line
  },

  doubler(lastTime) {
    const daysSinceLast = dayjs().diff(dayjs(lastTime), "days");
    return daysSinceLast * 2;
  },

  daysRange(days, variance = Math.ceil(days / 6)) {
    return [days - variance, days + variance];
  },

  daysPreview(lastTime, variance) {
    const days = this.doubler(lastTime);
    return this.daysRange(days, variance);
  },

  daysUntilNext(success, lastTime, variance) {
    if (!success) {
      return 0;
    }
    return Math.max(1, this.rangeRand(...this.daysPreview(lastTime, variance)));
  },
};

module.exports = scheduler;
