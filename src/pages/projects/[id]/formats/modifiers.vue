<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('formats.modifiers_title', 'Custom modifiers') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('formats.modifiers_subtitle', 'Add custom') }} <code
            class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">@.modifier:key</code>
          {{ t('formats.modifiers_subtitle2', 'modifiers.') }}
        </p>
      </div>
      <u-button
          icon="i-heroicons-plus"
          @click="openCreate"
      >
        {{ t('formats.add_modifier', 'Add a modifier') }}
      </u-button>
    </div>

    <div
        class="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex gap-2">
      <u-icon
          class="shrink-0 mt-0.5"
          name="i-heroicons-information-circle"
      />
      <div>
        {{
          t('formats.modifiers_info', 'Define JS functions that receive a string and return a modified string. Example:')
        }} <code class="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 px-1 rounded">snakeCase</code> →
        {{ t('formats.modifiers_info2', 'use') }} <code
          class="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 px-1 rounded">@.snakeCase:common.title</code>
        {{ t('formats.modifiers_info3', 'in your translations.') }}
        <nuxt-link
            class="underline ml-1"
            target="_blank"
            to="https://vue-i18n.intlify.dev/guide/essentials/syntax.html#custom-modifiers"
        >
          {{ t('formats.documentation', 'Documentation') }} ↗
        </nuxt-link>
      </div>
    </div>

    <!-- Built-in modifiers reminder -->
    <u-card>
      <template #header>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {{ t('formats.builtin_modifiers', 'Built-in modifiers') }}
        </p>
      </template>
      <div class="grid grid-cols-3 gap-2">
        <div
            v-for="mod in BUILTIN_MODIFIERS"
            :key="mod.name"
            class="bg-gray-50 dark:bg-gray-800 rounded p-2"
        >
          <code class="text-xs font-mono text-violet-600 dark:text-violet-400 font-semibold">@.{{ mod.name }}:</code>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ mod.desc }}
          </p>
          <p class="text-xs font-mono text-gray-500 mt-1">
            {{ mod.example }}
          </p>
        </div>
      </div>
    </u-card>

    <!-- Empty -->
    <div
        v-if="!modifiers?.length"
        class="text-center py-12 text-gray-400"
    >
      <u-icon
          class="text-4xl mb-3"
          name="i-heroicons-code-bracket"
      />
      <p class="font-medium">
        {{ t('formats.no_modifier', 'No custom modifier') }}
      </p>
      <p class="text-sm mt-1">
        {{ t('formats.add_custom_modifiers', 'Add your own text transformations.') }}
      </p>
      <u-button
          class="mt-4"
          icon="i-heroicons-plus"
          @click="openCreate"
      >
        {{ t('formats.add_modifier', 'Add a modifier') }}
      </u-button>
    </div>

    <!-- List -->
    <div
        v-else
        class="space-y-3"
    >
      <u-card
          v-for="mod in modifiers"
          :key="mod.id"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-2">
              <code class="text-sm font-mono font-semibold text-violet-600 dark:text-violet-400">@.{{
                  mod.name
                }}:</code>
              <u-badge
                  color="violet"
                  size="xs"
                  variant="soft"
              >
                custom
              </u-badge>
            </div>
            <code
                class="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded block">{{
                mod.body
              }}</code>
            <!-- Live test -->
            <div class="mt-2 flex items-center gap-2">
              <u-input
                  v-model="testInputs[mod.id]"
                  :placeholder="t('formats.test_placeholder', 'Test with a text...')"
                  class="flex-1"
                  size="xs"
              />
              <code class="text-xs font-mono text-gray-500 dark:text-gray-400 shrink-0">→
                {{ testModifier(mod, testInputs[mod.id] || '') }}</code>
            </div>
          </div>
          <div class="flex gap-1 shrink-0">
            <u-button
                color="neutral"
                icon="i-heroicons-pencil"
                size="xs"
                variant="ghost"
                @click="openEdit(mod)"
            />
            <u-button
                color="error"
                icon="i-heroicons-trash"
                size="xs"
                variant="ghost"
                @click="remove(mod.id)"
            />
          </div>
        </div>
      </u-card>
    </div>

    <!-- Create/Edit modal -->
    <u-modal
        v-model:open="showModal"
        :title="editing ? t('formats.edit_modifier', 'Edit modifier') : t('formats.new_modifier', 'New modifier')"
    >
      <template #body>
        <div class="space-y-4">
          <u-form-field
              :hint="t('formats.modifier_name_hint', 'Used in @.name:key')"
              :label="t('formats.modifier_name', 'Name')"
              required
          >
            <u-input
                v-model="form.name"
                class="w-full"
                placeholder="snakeCase"
            />
          </u-form-field>

          <u-form-field
              :hint="t('formats.js_function_hint', 'Arrow function receiving str and returning string')"
              :label="t('formats.js_function', 'JavaScript function')"
              required
          >
            <u-textarea
                v-model="form.body"
                :rows="4"
                class="w-full font-mono text-sm"
                placeholder="(str) => str.split(' ').join('_')"
            />
          </u-form-field>

          <!-- Quick templates -->
          <div>
            <p class="text-xs text-gray-400 mb-2">
              {{ t('formats.quick_templates', 'Quick templates:') }}
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                  v-for="tpl in QUICK_TEMPLATES"
                  :key="tpl.name"
                  class="px-2 py-1 rounded text-xs border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 text-gray-600 dark:text-gray-400 transition-colors"
                  @click="applyTemplate(tpl)"
              >
                {{ tpl.name }}
              </button>
            </div>
          </div>

          <!-- Test -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
            <p class="text-xs text-gray-400">
              {{ t('formats.live_test', 'Live test:') }}
            </p>
            <div class="flex items-center gap-2">
              <u-input
                  v-model="liveTest"
                  class="flex-1"
                  placeholder="Hello World"
                  size="xs"
              />
              <u-icon
                  class="text-gray-400 shrink-0"
                  name="i-heroicons-arrow-right"
              />
              <code class="text-xs font-mono text-violet-600 dark:text-violet-400 shrink-0">{{ liveResult }}</code>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <u-button
              color="neutral"
              variant="ghost"
              @click="showModal = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
              :loading="saving"
              @click="save"
          >
            {{ editing ? t('formats.update', 'Update') : t('common.create', 'Create') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script lang="ts" setup>
  const { modifiers, createModifier, updateModifier, deleteModifier } = useFormats()
  const toast = useToast()
  const { t } = useT()

  const BUILTIN_MODIFIERS = [
    { name: 'lower', desc: t('formats.modifier_lower', 'Lowercase'), example: '"HELLO" → "hello"' },
    { name: 'upper', desc: t('formats.modifier_upper', 'UPPERCASE'), example: '"hello" → "HELLO"' },
    {
      name: 'capitalize',
      desc: t('formats.modifier_capitalize', '1st letter uppercase'),
      example: '"hello world" → "Hello world"'
    },
  ]

  const QUICK_TEMPLATES = [
    { name: 'snakeCase', body: '(str) => str.split(\' \').join(\'_\')' },
    {
      name: 'camelCase',
      body: '(str) => str.replace(/(?:^\\w|[A-Z]|\\b\\w|\\s+)/g, (m, i) => i === 0 ? m.toLowerCase() : m.toUpperCase()).replace(/\\s+/g, \'\')'
    },
    { name: 'kebabCase', body: '(str) => str.split(\' \').join(\'-\').toLowerCase()' },
    { name: 'titleCase', body: '(str) => str.replace(/\\b\\w/g, c => c.toUpperCase())' },
    { name: 'truncate', body: '(str) => str.length > 30 ? str.slice(0, 30) + \'…\' : str' },
  ]

  const testInputs = ref<Record<number, string>>({})
  const showModal = ref(false)
  const saving = ref(false)
  const editing = ref<any>(null)
  const form = ref({ name: '', body: '' })
  const liveTest = ref('Hello World')

  const liveResult = computed(() => {
    return testModifier({ body: form.value.body }, liveTest.value)
  })

  function testModifier (mod: { body: string }, input: string): string {
    if (!mod.body || !input) return ''
    try {

      const fn = new Function('str', `return (${mod.body})(str)`)
      return String(fn(input))
    } catch {
      return t('formats.error', '⚠ error')
    }
  }

  function applyTemplate (tpl: { name: string; body: string }) {
    form.value.name = form.value.name || tpl.name
    form.value.body = tpl.body
  }

  function openCreate () {
    editing.value = null
    form.value = { name: '', body: '' }
    showModal.value = true
  }

  function openEdit (mod: any) {
    editing.value = mod
    form.value = { name: mod.name, body: mod.body }
    showModal.value = true
  }

  async function save () {
    if (!form.value.name || !form.value.body) return
    saving.value = true
    try {
      if (editing.value) {
        await updateModifier(editing.value.id, form.value.name, form.value.body)
        toast.add({ title: t('formats.modifier_updated', 'Modifier updated'), color: 'success' })
      } else {
        await createModifier(form.value.name, form.value.body)
        toast.add({ title: t('formats.modifier_created', 'Modifier created'), color: 'success' })
      }
      showModal.value = false
    } catch (e: any) {
      toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
    } finally {
      saving.value = false
    }
  }

  async function remove (id: number) {
    await deleteModifier(id)
    toast.add({ title: t('formats.modifier_deleted', 'Modifier deleted'), color: 'success' })
  }
</script>
