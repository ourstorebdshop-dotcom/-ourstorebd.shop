import { createSlice } from '@reduxjs/toolkit';

export const defaultWishlist = ['prod_1', 'prod_3'];

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        items: defaultWishlist,
    },
    reducers: {
        hydrateWishlist: (state, action) => {
            if (Array.isArray(action.payload)) {
                state.items = action.payload;
            }
        },
        toggleWishlist: (state, action) => {
            const productId = action.payload;
            const index = state.items.indexOf(productId);
            if (index === -1) {
                state.items.push(productId);
            } else {
                state.items.splice(index, 1);
            }
        },
        addToWishlist: (state, action) => {
            const productId = action.payload;
            if (!state.items.includes(productId)) {
                state.items.push(productId);
            }
        },
        removeFromWishlist: (state, action) => {
            const productId = action.payload;
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
