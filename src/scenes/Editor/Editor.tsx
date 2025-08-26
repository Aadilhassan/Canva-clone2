import { useEffect, useMemo } from 'react'
import useAppContext from '@/hooks/useAppContext'
import { useParams } from 'react-router'
import { getElements } from '@store/slices/elements/actions'
import { getFonts } from '@store/slices/fonts/actions'
import { useAppDispatch } from '@store/store'
import Navbar from './components/Navbar'
import Panels from './components/Panels'
import Toolbox from './components/Toolbox'
import Footer from './components/Footer'
import api from '@services/api'
import { DesignEditor, useEditor } from 'design-editor-kit'

function App({ location }) {
  const { setCurrentTemplate } = useAppContext()
  const editor = useEditor()
  const { id } = useParams<{ id: string }>()
  const dispath = useAppDispatch()

  useEffect(() => {
    dispath(getElements())
    dispath(getFonts())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const editorConfig = useMemo(() => ({ clipToFrame: true, scrollLimit: 0 }), [])

  useEffect(() => {
    if (id && editor && location) {
      const locationTemplate = location?.state?.template
      if (locationTemplate) {
        setCurrentTemplate(locationTemplate)
        handleLoadTemplate(locationTemplate)
      } else {
        api.getCreationById(id).then(data => {
          if (data && data.object !== 'error') {
            setCurrentTemplate(data)
            handleLoadTemplate(data)
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editor, location])
  
  // Auto-save feature with debounced saves
  // Let the package handle autosave and change/save callbacks

  const handleLoadTemplate = async template => {
    const fonts = []
    template.objects.forEach(object => {
      if (object.type === 'StaticText' || object.type === 'DynamicText') {
        fonts.push({
          name: object.metadata.fontFamily,
          url: object.metadata.fontURL,
          options: { style: 'normal', weight: 400 },
        })
      }
    })

    const filteredFonts = fonts.filter(f => !!f.url)
    if (filteredFonts.length > 0) {
      await loadFonts(filteredFonts)
    }

    editor.importFromJSON(template)
  }

  const loadFonts = fonts => {
    const promisesList = fonts.map(font => {
      // @ts-ignore
      return new FontFace(font.name, `url(${font.url})`, font.options).load().catch(err => err)
    })
    return new Promise((resolve, reject) => {
      Promise.all(promisesList)
        .then(res => {
          res.forEach(uniqueFont => {
            // @ts-ignore
            if (uniqueFont && uniqueFont.family) {
              // @ts-ignore
              document.fonts.add(uniqueFont)
              resolve(true)
            }
          })
        })
        .catch(err => reject(err))
    })
  }
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#F9F9F9',
        fontFamily: 'Poppins',
      }}
    >
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Panels />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <Toolbox />
          <div style={{ flex: 1, display: 'flex', padding: '1px' }}>
            <DesignEditor
              config={editorConfig}
              initialTemplate={location?.state?.template}
              enableAutosave
              autosaveKey={id ? `design_${id}` : 'canva_clone_autosave'}
              onChange={() => {/* host can plug in if needed */}}
              onSave={() => {/* host can plug in if needed */}}
              onLoadError={(e) => { console.error('Template load error', e) }}
            />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default App
