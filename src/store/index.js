import Vue from 'vue';
import Vuex from 'vuex';

import cacheModule from './modules/cache';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    cache: cacheModule
  },
  strict: process.env.NODE_ENV !== 'production'
});