/* global moment */

(function (exports) {
  'use strict';

  var Scheduler = {};

  Scheduler.rangeRand = function (min, max) {
    return min + Math.floor((max - min + 1) * Math.random());
  };

  Scheduler.doubler = function (lastTime) {
    var daysSinceLast = Math.floor(moment().diff(moment(lastTime), 'days', true));
    return daysSinceLast * 2;
  };

  Scheduler.daysRange = function (days, variance) {
    if (variance === undefined) {
      variance = Math.ceil(days / 6);
    }
    return [days - variance, days + variance];
  };

  Scheduler.daysPreview = function (lastTime, variance) {
    var days = this.doubler(lastTime);
    return this.daysRange(days, variance);
  };

  Scheduler.daysUntilNext = function (success, lastTime, variance) {
    if (!success) {
      return 0;
    }
    return Math.max(1, this.rangeRand.apply(null, this.daysPreview(lastTime, variance)));
  };

  exports.Scheduler = Scheduler;
}(typeof module === "undefined" ? this : module.exports));
