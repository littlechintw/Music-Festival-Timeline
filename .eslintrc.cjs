module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // 純風格類規則交給 Prettier，避免噪音
    'vue/multi-word-component-names': 'off',
    'vue/no-mutating-props': 'warn',
    'vue/max-attributes-per-line': 'off',
    'vue/html-self-closing': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/html-indent': 'off',
    'vue/attributes-order': 'off',
    // md-icon 是 @material/web 的 custom element，用 v-html 塞入 build-time 產生的 SVG（見 src/utils/icons.js），
    // 不是一般 Vue 元件，ESLint 靜態分析看不出 vite isCustomElement 設定，所以要手動允許。
    'vue/no-v-text-v-html-on-component': ['error', { allow: ['md-icon'] }],
    // 抓「模板裡用了元件但忘記 import」這種錯（MD3 遷移途中很容易漏），
    // md-* 是 custom element 不需要 import；router-link/router-view 是 vue-router 全域註冊的。
    'vue/no-undef-components': ['error', { ignorePatterns: ['^md-', '^router-'] }],
    // 這條規則抓的是 Vue 2 舊語法「slot="x"」（該用 <template #x> 取代）。
    // 我們用 slot="x" 是給 @material/web 的 custom element 做原生 DOM slot 投影，
    // 跟 Vue 元件的插槽系統無關，不是同一件事。
    'vue/no-deprecated-slot-attribute': 'off',
  },
  ignorePatterns: ['dist', 'node_modules', 'public', '.github'],
};
