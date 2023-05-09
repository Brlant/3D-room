import { createRouter, createWebHashHistory,createWebHistory } from 'vue-router'
import index from '../views/office.vue'

const routes = [
    {
        path: '/',
        name: 'index',
        component: index
    }
]
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})
export default router
