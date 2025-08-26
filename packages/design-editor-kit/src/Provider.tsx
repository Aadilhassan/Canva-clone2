import { FC, ReactNode } from 'react'
// Use CommonJS requires to stay compatible with older bundlers (CRA v4) that struggle with ESM named exports from CJS packages
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Client: Styletron } = require('styletron-engine-atomic')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Provider: StyletronProvider } = require('styletron-react')
// Use require form to improve compatibility with bundlers that struggle with mixed CJS/ESM named exports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BaseUI: any = require('baseui')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { EditorProvider } = require('@nkyo/scenify-sdk')

const engine = new Styletron()

export interface EditorKitProviderProps {
  children: ReactNode
}

export const EditorKitProvider: FC<EditorKitProviderProps> = ({ children }) => {
  return (
    <StyletronProvider value={engine}>
      <EditorProvider>
        <BaseUI.BaseProvider theme={BaseUI.LightTheme}>{children}</BaseUI.BaseProvider>
      </EditorProvider>
    </StyletronProvider>
  )
}

export default EditorKitProvider
