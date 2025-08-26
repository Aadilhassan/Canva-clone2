# design-editor-kit

Reusable React package that wraps `@nkyo/scenify-sdk` with a simple Provider and an Editor component featuring optional autosave.

## Install

This package is designed to be used via workspaces during development. Once published:

- peer deps: react, react-dom, @nkyo/scenify-sdk, baseui, styletron-engine-atomic, styletron-react

## Usage

```tsx
import { EditorKitProvider, DesignEditor } from 'design-editor-kit'

export default function App() {
  return (
    <EditorKitProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <DesignEditor config={{ clipToFrame: true, scrollLimit: 0 }} />
      </div>
    </EditorKitProvider>
  )
}
```

You can pass an initial template, autosave options, and lifecycle callbacks:

```tsx
<DesignEditor
  initialTemplate={templateJson}
  enableAutosave
  autosaveKey="my_key"
  onChange={(t) => console.log('changed', t)}
  onSave={(t) => console.log('autosaved', t)}
  onLoadError={(err) => console.error('load failed', err)}
/>
```

## Exports

- EditorKitProvider
- DesignEditor
- useEditor (re-exported from scenify)

## Props (DesignEditor)

- config: EditorConfig (defaults clipToFrame true, scrollLimit 0)
- initialTemplate: template JSON to import on mount
- enableAutosave: boolean (default true)
- autosaveKey: localStorage key (default design_editor_autosave)
- onChange(template): debounced callback (~300ms) when history changes
- onSave(template): every 30s autosave callback
- onLoadError(error): called if initial template import fails
