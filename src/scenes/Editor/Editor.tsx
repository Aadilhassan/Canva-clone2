import { useEffect } from 'react'
import useAppContext from '@/hooks/useAppContext'
import Editor, { useEditor } from '@nkyo/scenify-sdk'
import { useParams } from 'react-router'
import { getElements } from '@store/slices/elements/actions'
import { getFonts } from '@store/slices/fonts/actions'
import { useAppDispatch } from '@store/store'
import Navbar from './components/Navbar'
import Panels from './components/Panels'
import Toolbox from './components/Toolbox'
import Footer from './components/Footer'
import api from '@services/api'

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
  const editorConfig = {
    clipToFrame: true,
    scrollLimit: 0,
  }

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
  useEffect(() => {
    if (!editor) return;
    
    let autoSaveTimeout: number | null = null;
    let debounceTimeout: number | null = null;
    
    // Auto-save every 30 seconds but only if changes were made
    const startAutoSaveInterval = () => {
      autoSaveTimeout = window.setTimeout(() => {
        try {
          const template = editor.exportToJSON();
          if (template && template.objects) {
            localStorage.setItem('canva_clone_autosave', JSON.stringify(template));
            console.log('Auto-saved canvas state');
          }
          startAutoSaveInterval(); // Restart the timer
        } catch (err) {
          console.error('Auto-save failed:', err);
          startAutoSaveInterval(); // Try again next interval
        }
      }, 30000) as unknown as number;
    };
    
    // Start the interval
    startAutoSaveInterval();
    
    // Debounced save on history changes (300ms delay)
    const handleStateChange = () => {
      if (debounceTimeout) window.clearTimeout(debounceTimeout);
      
      debounceTimeout = window.setTimeout(() => {
        try {
          const template = editor.exportToJSON();
          if (template && template.objects) {
            localStorage.setItem('canva_clone_autosave', JSON.stringify(template));
          }
        } catch (err) {
          console.error('Debounced save failed:', err);
        }
      }, 300) as unknown as number;
    };
    
    // Attach event handler
    editor.on('history:changed', handleStateChange);
    
    // Check for autosaved state on load - but only if we don't have an ID or template
    if (!id && !location?.state?.template) {
      try {
        const autosavedState = localStorage.getItem('canva_clone_autosave');
        if (autosavedState) {
          const template = JSON.parse(autosavedState);
          // Let the editor initialize first
          requestAnimationFrame(() => {
            try {
              editor.importFromJSON(template);
              console.log('Restored from auto-save');
            } catch (e) {
              console.error('Failed to restore auto-saved state:', e);
            }
          });
        }
      } catch (err) {
        console.error('Error checking auto-save:', err);
      }
    }
    
    // Cleanup
    return () => {
      if (autoSaveTimeout) window.clearTimeout(autoSaveTimeout);
      if (debounceTimeout) window.clearTimeout(debounceTimeout);
      editor.off('history:changed', handleStateChange);
    };
  }, [editor, id, location]);

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
            <Editor config={editorConfig} />
          </div>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default App
