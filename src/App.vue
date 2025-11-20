<template>
  <div>
    <nav class="w-full bg-gray-900 text-white px-4 py-2 flex gap-4 items-center">
      <router-link to="/" class="font-bold hover:underline">音樂祭列表</router-link>
      <router-link to="/plan" class="hover:underline">我的行程</router-link>
      <router-link to="/settings" class="hover:underline">設定</router-link>
  <router-link to="/editor" class="hover:underline">新增音樂祭</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
// App root
</script>

<style>
body { background: var(--theme-bg, #fff); }
</style>
