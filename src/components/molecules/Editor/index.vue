<template>
  <editor-content class="editor" :editor="editor" />
</template>

<script setup lang="ts">
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import Highlight from '@tiptap/extension-highlight'
import Typography from '@tiptap/extension-typography'
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emits = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [StarterKit, Highlight, Typography],
  onUpdate: ({ editor }) => {
    emits('update:modelValue', editor.getHTML())
  }
})

watch(
  () => props.modelValue,
  (value, prevValue) => {
    const isSame = editor.value?.getHTML() === value
    if (isSame) {
      return
    }
    editor.value?.commands.setContent(value, false)
  }
)
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style lang="scss">
.editor {
  width: 100%;
  height: 100%;
  margin-bottom: 12px;
  min-height: 50px;
}
/* Basic editor styles */
.ProseMirror {
  width: 100%;
  height: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 2px;
  > * + * {
    margin-top: 0.75em;
  }

  ul,
  ol {
    padding: 0 1rem;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
  }

  code {
    background-color: rgba(#616161, 0.1);
    color: #616161;
  }

  pre {
    background: #0d0d0d;
    color: #fff;
    font-family: 'JetBrainsMono', monospace;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;

    code {
      color: inherit;
      padding: 0;
      background: none;
      font-size: 0.8rem;
    }
  }

  img {
    max-width: 100%;
    height: auto;
  }

  hr {
    margin: 1rem 0;
  }

  blockquote {
    padding-left: 1rem;
    border-left: 2px solid rgba(#0d0d0d, 0.1);
  }
}
</style>
