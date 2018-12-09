const utils = {
  pluralize(count, singular, plural = `${singular}s`) {
    return `${count} ${count === 1 ? singular : plural}`;
  },

  getLimit(limit, length) {
    if (limit) {
      return limit; // explicit limit
    }
    if (length < 16) {
      // tolerate 13..15
      return length;
    }
    return 12; // default to 12 (soft)
  },

  clamp(value, min, max) {
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  },

  groupsOf(arr, count) {
    const result = [];
    for (let i = 0; i < arr.length; i += count) {
      result.push(arr.slice(i, i + count));
    }
    return result;
  },
};

module.exports = utils;
