import { UDP_PORT, PROTOCOL } from "./constants.js";
import { convertCanIdToInt } from "./utils.js";
import { sendCommand } from "./command-sender.js";

// Setup Input Configuration function
async function setupInputConfig(unitIp, canId, inputConfig) {
  const idAddress = convertCanIdToInt(canId);

  // Build data array according to SETUP_INPUT command structure
  const data = [];

  // Convert all input values to integers to ensure proper data types
  const inputNumber = parseInt(inputConfig.inputNumber) || 0;
  const inputType = parseInt(inputConfig.inputType) || 0;
  const ramp = parseInt(inputConfig.ramp) ?? 0;
  const preset = parseInt(inputConfig.preset) ?? 255;
  const ledStatus = parseInt(inputConfig.ledStatus) || 0;
  const autoMode = inputConfig.autoMode ? 1 : 0; // Boolean conversion

  // Byte 0 - Input number (0-based)
  data.push(inputNumber);

  // Byte 1 - Input type
  data.push(inputType);

  // Byte 2 - Ramp
  data.push(ramp);

  // Byte 3 - Preset
  data.push(preset);

  // Byte 4 - LED Status (calculated from display mode and flags)
  data.push(ledStatus);

  // Byte 5 - Auto Mode
  data.push(autoMode);

  // Bytes 6-33 - Auto Time (28 bytes, not supported, default 0)
  for (let i = 0; i < 28; i++) {
    data.push(0);
  }

  // Bytes 34-35 - Delay Off (2 bytes, little endian)
  const delayOff = parseInt(inputConfig.delayOff) || 0;
  data.push(delayOff & 0xff);
  data.push((delayOff >> 8) & 0xff);

  // Bytes 36-37 - Delay On (2 bytes, not supported, default 0)
  data.push(0);
  data.push(0);

  // Byte 38 - Number of groups
  const groups = inputConfig.groups || [];
  const isKeyCard = inputConfig.inputType === 4;
  const groupCount = isKeyCard ? 20 : groups.length;
  data.push(groupCount);

  // Group data (2 bytes per group: Group ID + Preset brightness)
  if (isKeyCard) {
    // Key Card always has 20 groups
    for (let i = 0; i < 20; i++) {
      if (i < groups.length && groups[i]) {
        data.push(parseInt(groups[i].groupId) || 0);
        data.push(parseInt(groups[i].presetBrightness) || 0);
      } else {
        data.push(0); // Group ID 0 = unused
        data.push(0); // Preset brightness
      }
    }
  } else {
    // Regular input with actual group count
    for (let i = 0; i < groups.length; i++) {
      data.push(parseInt(groups[i].groupId) || 0);
      data.push(parseInt(groups[i].presetBrightness) || 0);
    }
  }

  // console.log(`Setting up input ${inputConfig.inputNumber} config:`, {
  //   inputType: inputConfig.inputType,
  //   ramp: inputConfig.ramp,
  //   preset: inputConfig.preset,
  //   ledStatus: inputConfig.ledStatus,
  //   autoMode: inputConfig.autoMode,
  //   delayOff: inputConfig.delayOff,
  //   groupCount: groupCount,
  //   actualGroups: groups.length,
  //   isKeyCard: isKeyCard,
  //   dataLength: data.length,
  // });

  try {
    const response = await sendCommand(
      unitIp,
      UDP_PORT,
      idAddress,
      PROTOCOL.LIGHTING.CMD1,
      PROTOCOL.LIGHTING.CMD2.SETUP_INPUT,
      data,
      false
    );

    console.log(
      `Input ${inputConfig.inputNumber} configuration sent successfully`
    );
    return response;
  } catch (error) {
    console.error(
      `Failed to setup input ${inputConfig.inputNumber} config:`,
      error
    );
    throw error;
  }
}

export { setupInputConfig };
