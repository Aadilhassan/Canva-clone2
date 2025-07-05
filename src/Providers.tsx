import { FC } from 'react'
import { Client as Styletron } from 'styletron-engine-atomic'
import { Provider as StyletronProvider } from 'styletron-react'
import { PersistGate } from 'redux-persist/integration/react'
import { LightTheme, BaseProvider } from 'baseui'
import { EditorProvider } from '@nkyo/scenify-sdk'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import store, { persistor } from '@store/store'
import { Provider } from 'react-redux'

const engine = new Styletron()

const Providers: FC = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <StyletronProvider value={engine}>
          <EditorProvider>
            <BaseProvider theme={LightTheme}>
              <AuthProvider>
                <AppProvider>{children}</AppProvider>
              </AuthProvider>
            </BaseProvider>
          </EditorProvider>
        </StyletronProvider>
      </PersistGate>
    </Provider>
  )
}

export default Providers
