import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** P2: the child every screen is showing. Remembered on this device. */
const KEY = 'school-parent-child';

const childSlice = createSlice({
  name: 'child',
  initialState: { selectedId: localStorage.getItem(KEY) as string | null },
  reducers: {
    childSelected(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
      localStorage.setItem(KEY, action.payload);
    },
  },
});

export const { childSelected } = childSlice.actions;
export default childSlice.reducer;
