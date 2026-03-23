export const UNIT_TYPES = [
  {
    name: "Room Logic Controller",
    barcode: "8930000000019",
    inputs: 48,
    groupedInputs: true,
    outputs: { relay: 32, dimmer: 6, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "Bedside-17T",
    barcode: "8930000000200",
    inputs: 17,
    outputs: { relay: 0, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "Bedside-12T",
    barcode: "8930000100214",
    inputs: 12,
    outputs: { relay: 0, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "BSP_R14_OL",
    barcode: "8930000100221",
    inputs: 14,
    outputs: { relay: 0, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "RLC-I16",
    barcode: "8930000000026",
    inputs: 60,
    outputs: { relay: 32, dimmer: 6, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RLC-I20",
    barcode: "8930000000033",
    inputs: 60,
    outputs: { relay: 32, dimmer: 6, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-32AO",
    barcode: "8930000200013",
    inputs: 60,
    outputs: { relay: 0, dimmer: 6, ao: 32, ac: 10 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "RCU-8RL-24AO",
    barcode: "8930000200020",
    inputs: 60,
    outputs: { relay: 8, dimmer: 0, ao: 24, ac: 10 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "RCU-16RL-16AO",
    barcode: "8930000200037",
    inputs: 60,
    outputs: { relay: 16, dimmer: 0, ao: 16, ac: 10 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "RCU-24RL-8AO",
    barcode: "8930000200044",
    inputs: 60,
    outputs: { relay: 24, dimmer: 0, ao: 8, ac: 10 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "RCU-11IN-4RL",
    barcode: "8930000210005",
    inputs: 11,
    outputs: { relay: 4, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-21IN-10RL",
    barcode: "8930000210012",
    inputs: 21,
    outputs: { relay: 10, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-30IN-10RL",
    barcode: "8930000210036",
    inputs: 30,
    groupedInputs: true,
    outputs: { relay: 10, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-48IN-16RL",
    barcode: "8930000210043",
    inputs: 48,
    groupedInputs: true,
    outputs: { relay: 16, dimmer: 0, ao: 4, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-48IN-16RL-4AO",
    barcode: "8930000210050",
    inputs: 48,
    groupedInputs: true,
    outputs: { relay: 16, dimmer: 0, ao: 4, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-48IN-16RL-4AI",
    barcode: "8930000210067",
    inputs: 48,
    groupedInputs: true,
    outputs: { relay: 16, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-48IN-16RL-K",
    barcode: "8930000210074",
    inputs: 48,
    groupedInputs: true,
    outputs: { relay: 16, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-48IN-16RL-DL",
    barcode: "8930000210081",
    inputs: 48,
    groupedInputs: true,
    outputs: { relay: 16, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-21IN-8RL",
    barcode: "8930000210111",
    inputs: 21,
    outputs: { relay: 8, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-21IN-8RL-4AO",
    barcode: "8930000210128",
    inputs: 21,
    outputs: { relay: 8, dimmer: 0, ao: 4, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-21IN-8RL-4AI",
    barcode: "8930000210135",
    inputs: 21,
    outputs: { relay: 8, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-21IN-8RL-K",
    barcode: "8930000210142",
    inputs: 21,
    outputs: { relay: 8, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "RCU-21IN-10RL-T",
    barcode: "8930000210159",
    inputs: 21,
    outputs: { relay: 10, dimmer: 0, ao: 0, ac: 10 },
    inputFunctions: {
      0: "KEY_CARD_INPUT",
      3: "BELL_INPUT",
      6: "DND_INPUT",
      7: "MUR_INPUT",
      default: "ALL",
    },
  },
  {
    name: "GNT-EXT-6RL",
    barcode: "8930000200051",
    inputs: 0,
    outputs: { relay: 6, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: {},
  },
  {
    name: "GNT-EXT-8RL",
    barcode: "8930000200068",
    inputs: 0,
    outputs: { relay: 8, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: {},
  },
  {
    name: "GNT-EXT-10AO",
    barcode: "8930000200075",
    inputs: 0,
    outputs: { relay: 0, dimmer: 0, ao: 10, ac: 0 },
    inputFunctions: {},
  },
  {
    name: "GNT-EXT-28AO",
    barcode: "8930000200082",
    inputs: 0,
    outputs: { relay: 0, dimmer: 0, ao: 28, ac: 0 },
    inputFunctions: {},
  },
  {
    name: "GNT-EXT-12RL",
    barcode: "8930000200105",
    inputs: 0,
    outputs: { relay: 12, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: {},
  },
  {
    name: "GNT-EXT-20RL",
    barcode: "8930000200112",
    inputs: 0,
    outputs: { relay: 20, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: {},
  },
  {
    name: "GNT-EXT-12RL-12AO",
    barcode: "8930000200099",
    inputs: 0,
    outputs: { relay: 12, dimmer: 0, ao: 12, ac: 0 },
    inputFunctions: {},
  },
  {
    name: "GNT-EXT-24IN",
    barcode: "8930000220011",
    inputs: 24,
    outputs: { relay: 0, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "GNT-EXT-48IN",
    barcode: "8930000220028",
    inputs: 48,
    outputs: { relay: 0, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: { default: "ALL" },
  },
  {
    name: "GNT-ETH2KDL",
    barcode: "8930000230003",
    inputs: 0,
    outputs: { relay: 0, dimmer: 0, ao: 0, ac: 0 },
    inputFunctions: {},
  },
];

export const UNIT_MODES = ["Slave", "Master", "Stand-Alone"];

export const UDP_CONFIG = {
  UDP_PORT: 1234,
  LOCAL_UDP_PORT: 5678,
  BROADCAST_IP: "255.255.255.255",
  RECEIVE_TIMEOUT: 3000,
  SCAN_TIMEOUT: 5000,
  MAX_RETRY: 3,
};

export const UNIT = {
  TYPES: UNIT_TYPES,
  MODES: UNIT_MODES,
  UDP_CONFIG,
};

export const getUnitIOSpec = (unitName) => {
  const unit = UNIT_TYPES.find((u) => u.name === unitName);
  return unit
    ? {
        inputs: unit.inputs,
        outputs: unit.outputs,
        totalOutputs: unit.outputs.relay + unit.outputs.dimmer + unit.outputs.ao + unit.outputs.ac,
      }
    : null;
};

export const getUnitByBarcode = (barcode) => {
  return UNIT_TYPES.find((u) => u.barcode === barcode);
};

export const getOutputTypes = (unitName) => {
  const spec = getUnitIOSpec(unitName);
  if (!spec) return [];

  const types = [];
  if (spec.outputs.relay > 0) types.push({ type: "relay", count: spec.outputs.relay });
  if (spec.outputs.dimmer > 0) types.push({ type: "dimmer", count: spec.outputs.dimmer });
  if (spec.outputs.ao > 0) types.push({ type: "ao", count: spec.outputs.ao });
  if (spec.outputs.ac > 0) types.push({ type: "ac", count: spec.outputs.ac });

  return types;
};
