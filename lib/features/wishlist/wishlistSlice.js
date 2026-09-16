import { createSlice } from '@reduxjs/toolkit';

export const defaultWishlist = [];

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: defaultWishlist,
    },
    reducers: {
        hydrateWishlist: (state, action) => {
            state.items = Array.isArray(action.payload) ? action.payload : [];
        },
        toggleWishlist: (state, action) => {
            const productId = action.payload;
            if (!productId) return;
            if (!Array.isArray(state.items)) state.items = [];
            const index = state.items.indexOf(productId);
            if (index === -1) {
                state.items.push(productId);
            } else {
                state.items.splice(index, 1);
            }
        },
        addToWishlist: (state, action) => {
            const productId = action.payload;
            if (!productId) return;
            if (!Array.isArray(state.items)) state.items = [];
            if (!state.items.includes(productId)) {
                state.items.push(productId);
            }
        },
        removeFromWishlist: (state, action) => {
            const productId = action.payload;
            if (!productId || !Array.isArray(state.items)) return;
            state.items = state.items.filter(id => id !== productId);
        },
        clearWishlist: (state) => {
            state.items = [];
        },
        setWishlist: (state, action) => {
            state.items = Array.isArray(action.payload) ? action.payload : [];
        }
    }
});

export const { toggleWishlist, addToWishlist, removeFromWishlist, clearWishlist, setWishlist, hydrateWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
