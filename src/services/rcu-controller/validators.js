// Helper functions for validation
const validators = {
  range: (value, min, max, name) => {
    if (value < min || value > max) {
      throw new Error(`${name} must be between ${min} and ${max}`);
    }
  },
  group: (group) => validators.range(group, 1, 255, "Group number"),
  value: (value) => validators.range(value, 0, 255, "Value"),
  outputIndex: (index) => validators.range(index, 0, 255, "Output index"),
  sceneIndex: (index) => validators.range(index, 0, 99, "Scene index"),
  scheduleIndex: (index) => validators.range(index, 0, 31, "Schedule index"),
  multiSceneIndex: (index) =>
    validators.range(index, 0, 39, "Multi-scene index"),
  sequenceIndex: (index) =>
    validators.range(index, 0, 19, "Sequence index"),
  sequenceAddress: (address) =>
    validators.range(address, 1, 255, "Sequence address"),
  curtainIndex: (index) => validators.range(index, 0, 31, "Curtain index"),
  knxAddress: (address) => validators.range(address, 0, 511, "KNX address"),
  hour: (hour) => validators.range(hour, 0, 23, "Hour"),
  minute: (minute) => validators.range(minute, 0, 59, "Minute"),
  second: (second) => validators.range(second, 0, 59, "Second"),
  year: (year) => validators.range(year, 0, 99, "Year"),
  month: (month) => validators.range(month, 1, 12, "Month"),
  day: (day) => validators.range(day, 1, 31, "Day"),
  dayOfWeek: (day) => validators.range(day, 0, 6, "Day of week"),
};

export { validators };
