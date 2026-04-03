export const EMPTY_ITEMS = {
  lighting: [],
  aircon: [],
  unit: [],
  curtain: [],
  knx: [],
  dmx: [],
  room: [],
  scene: [],
  schedule: [],
  multi_scenes: [],
  sequences: [],
};

export const createItemsStateSlice = (set) => ({
  projectItems: { ...EMPTY_ITEMS },
  airconCards: [],
  tabLoading: {},
  error: null,

  reset: () =>
    set({
      projectItems: { ...EMPTY_ITEMS },
      airconCards: [],
      tabLoading: {},
      error: null,
    }),
});
