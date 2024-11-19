import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  email: string;
  userId: string;
  avatarId: string | null;
  name: string;
  bio: string;
  followed: number;
  follower: number;
  location: string | null;
  website: string | null;
  postsCount: number;
}

const initialState: UserState = {
  email: '',
  userId: '',
  avatarId: null,
  name: '',
  bio: '',
  followed: 0,
  follower: 0,
  location: null,
  website: null,
  postsCount: 0,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state: UserState, action: PayloadAction<UserState>) {
      return { ...state, ...action.payload };
    },
    clearUser(state: UserState) {
      return initialState;
    },
    updateUser(state: UserState, action: PayloadAction<Partial<UserState>>) {
      return { ...state, ...action.payload };
    },
  },
});

export const { setUser, clearUser, updateUser } = userSlice.actions;
export default userSlice.reducer;