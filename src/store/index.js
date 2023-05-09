import { createStore } from 'vuex'
export default createStore({
    state: {
        model: null,
        modelProgress: 0
    },
    mutations: {
        setModel(state, payload) {
            state.model = payload
        },
        updateModelProgress(state, progress) {
            state.modelProgress = progress
        }
    },
    actions: {
    },
    modules: {
    }
})
