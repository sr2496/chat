import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import './echo'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import './fontawesome'
import '../node_modules/vue3-emoji-picker/dist/style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.component('font-awesome-icon', FontAwesomeIcon).mount('#app')
