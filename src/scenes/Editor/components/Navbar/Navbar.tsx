import { styled, ThemeProvider, DarkTheme } from 'baseui'
import { Button, KIND } from 'baseui/button'
import { Input } from 'baseui/input'
import Icons from '../Icons'
import { useEditor } from '@nkyo/scenify-sdk'
import { useEffect, useState } from 'react'
import useAppContext from '@/hooks/useAppContext'
import Resize from './components/Resize'
import PreviewTemplate from './components/PreviewTemplate'

import History from './components/History'
const Container = styled('div', props => ({
  height: '70px',
  background: props.$theme.colors.background,
  display: 'flex',
  padding: '0 0.5rem',
  justifyContent: 'space-between',
  alignItems: 'center',
}))

function NavbarEditor() {
  const editor = useEditor()
  const { currentTemplate } = useAppContext()
  const [name, setName] = useState('Untitled design')

  const handleDownload = async () => {
    if (editor) {
      const exportedTemplate = editor.exportToJSON()
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportedTemplate, null, 2))
      const downloadAnchorNode = document.createElement('a')
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", `${name}.json`)
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()
    }
  }

  const handleExport = async () => {
    if (editor) {
      // Export to PNG/JPG - this would be handled by the editor
      console.log('Export functionality - to be implemented')
    }
  }

  useEffect(() => {
    if (currentTemplate) {
      setName(currentTemplate.name)
    }
  }, [currentTemplate])

  return (
    <ThemeProvider theme={DarkTheme}>
      <Container>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Resize />
          <History />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ width: '320px' }}>
            <Input
              value={name}
              onChange={(e: any) => setName(e.target.value)}
              overrides={{
                Root: {
                  style: {
                    borderTopStyle: 'none',
                    borderBottomStyle: 'none',
                    borderRightStyle: 'none',
                    borderLeftStyle: 'none',
                    backgroundColor: 'rgba(255,255,255,0)',
                  },
                },
                InputContainer: {
                  style: {
                    backgroundColor: 'rgba(255,255,255,0)',
                  },
                },
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Button onClick={handleDownload} kind={KIND.tertiary}>
            Download JSON
          </Button>
          <Button onClick={handleExport} kind={KIND.secondary}>
            Export
          </Button>
          <PreviewTemplate />
        </div>
      </Container>
    </ThemeProvider>
  )
}

export default NavbarEditor
