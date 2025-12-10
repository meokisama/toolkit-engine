// Helper function to get output type for a given index based on unit spec
export function getOutputTypeForIndex(index, outputSpec) {
  let currentIndex = 0;

  // Follow the order: relay → dimmer → ao → ac (as defined in constants.js)

  // Check relay outputs first
  if (index < currentIndex + outputSpec.relay) {
    return "relay";
  }
  currentIndex += outputSpec.relay;

  // Check dimmer outputs
  if (index < currentIndex + outputSpec.dimmer) {
    return "dimmer";
  }
  currentIndex += outputSpec.dimmer;

  // Check analog outputs
  if (index < currentIndex + outputSpec.ao) {
    return "ao";
  }
  currentIndex += outputSpec.ao;

  // Check AC outputs
  if (index < currentIndex + outputSpec.ac) {
    return "ac";
  }

  // Default to relay if index is out of range
  return "relay";
}

// Helper function to get output type name for display
export function getOutputTypeName(type) {
  switch (type) {
    case "relay":
      return "Relay";
    case "dimmer":
      return "Dimmer";
    case "ao":
      return "Analog";
    case "ac":
      return "Aircon";
    default:
      return "Output";
  }
}

// Helper function to get the index within the output type
export function getOutputTypeIndex(globalIndex, outputType, outputSpec) {
  let currentIndex = 0;
  let typeIndex = 1;

  // Calculate the index within the specific output type
  if (outputType === "relay") {
    typeIndex = globalIndex + 1;
  } else if (outputType === "dimmer") {
    currentIndex += outputSpec.relay;
    typeIndex = globalIndex - currentIndex + 1;
  } else if (outputType === "ao") {
    currentIndex += outputSpec.relay + outputSpec.dimmer;
    typeIndex = globalIndex - currentIndex + 1;
  } else if (outputType === "ac") {
    currentIndex += outputSpec.relay + outputSpec.dimmer + outputSpec.ao;
    typeIndex = globalIndex - currentIndex + 1;
  }

  return typeIndex;
}
