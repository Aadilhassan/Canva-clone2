import { FC, useEffect } from 'react'
import Editor, { useEditor } from '@nkyo/scenify-sdk'

// Minimal config shape expected by scenify Editor
export type EditorConfig = {
  clipToFrame: boolean
  scrollLimit: number
}

export interface DesignEditorProps {
  config?: EditorConfig
  initialTemplate?: any
  enableAutosave?: boolean
  autosaveKey?: string
  onChange?: (template: any) => void
  onSave?: (template: any) => void
  onLoadError?: (error: unknown) => void
}

export const DesignEditor: FC<DesignEditorProps> = ({
  config,
  initialTemplate,
  enableAutosave = true,
  autosaveKey = 'design_editor_autosave',
  onChange,
  onSave,
  onLoadError,
}) => {
  const editor = useEditor()

  useEffect(() => {
    if (!editor) return

    if (initialTemplate) {
      try {
        editor.importFromJSON(initialTemplate)
      } catch (e) {
        console.error('Failed to load initial template', e)
        // Notify host app
        try { onLoadError && onLoadError(e) } catch {}
      }
    }
  }, [editor, initialTemplate, onLoadError])

  useEffect(() => {
    if (!editor || !enableAutosave) return

    let autoSaveTimer: number | null = null
    let debounceTimer: number | null = null

    const startAuto = () => {
      autoSaveTimer = window.setTimeout(() => {
        try {
          const template = editor.exportToJSON()
          if (template) {
            localStorage.setItem(autosaveKey, JSON.stringify(template))
            // Host callback
            try { onSave && onSave(template) } catch {}
          }
        } catch (e) {
          console.error('Auto-save failed', e)
        }
        startAuto()
      }, 30000) as unknown as number
    }

    startAuto()

    const onChangeHandler = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        try {
          const template = editor.exportToJSON()
          if (template) {
            localStorage.setItem(autosaveKey, JSON.stringify(template))
            // Host callback on change
            try { onChange && onChange(template) } catch {}
          }
        } catch (e) {
          console.error('Debounced save failed', e)
        }
      }, 300) as unknown as number
    }

    editor.on('history:changed', onChangeHandler)

    return () => {
      if (autoSaveTimer) window.clearTimeout(autoSaveTimer)
      if (debounceTimer) window.clearTimeout(debounceTimer)
      editor.off('history:changed', onChangeHandler)
    }
  }, [editor, enableAutosave, autosaveKey, onChange, onSave])

  const editorConfig = config ?? { clipToFrame: true, scrollLimit: 0 }
  return <Editor config={editorConfig as any} />
}

export default DesignEditor
