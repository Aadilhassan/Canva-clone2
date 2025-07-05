import { Button, KIND } from 'baseui/button'
import { Modal, ModalBody, SIZE } from 'baseui/modal'
import { useEffect, useState } from 'react'
import { ThemeProvider, LightTheme } from 'baseui'
import { flatten, uniq } from 'lodash'
import { useEditor } from '@nkyo/scenify-sdk'
import { FormControl } from 'baseui/form-control'
import { Input } from 'baseui/input'

function PreviewTemplate() {
  const [isOpen, setIsOpen] = useState(false)
  const editor = useEditor()
  const [options, setOptions] = useState<any>({})
  const [previewImage, setPreviewImage] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen && editor) {
      // Use editor.exportToJSON() instead of canvas.toJSON()
      const template = editor.exportToJSON();
      
      // Store a copy of the template state for restoration
      if (template && template.objects) {
        try {
          localStorage.setItem('canva_clone_temp_state', JSON.stringify(template));
        } catch (err) {
          console.error('Failed to save template state:', err);
        }
      }
      
      const keys = template.objects.map(object => {
        return object.metadata && object.metadata.keys ? object.metadata.keys : []
      })

      const params: Record<string, string> = {}
      const uniqElements = uniq(flatten(keys))
      uniqElements.forEach(key => {
        params[key] = ''
      })

      setOptions(params)
      if (uniqElements.length === 0) {
        handleBuildImage()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editor])
  
  // Separate useEffect for state restoration to avoid race conditions
  useEffect(() => {
    if (!isOpen && editor) {
      // Only attempt restoration when closing the modal
      try {
        const savedState = localStorage.getItem('canva_clone_temp_state');
        if (savedState) {
          const template = JSON.parse(savedState);
          // Use requestAnimationFrame for better timing
          requestAnimationFrame(() => {
            try {
              editor.importFromJSON(template);
            } catch (err) {
              console.error('Error importing template:', err);
            }
          });
        }
      } catch (err) {
        console.error('Failed to restore canvas state:', err);
      }
    }
  }, [isOpen, editor]);

  const handleBuildImage = async () => {
    if (!editor) return;
    
    try {
      setIsProcessing(true);
      // @ts-ignore
      const image = await editor.toPNG(options);
      setPreviewImage(image);
    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setIsProcessing(false);
    }
  }

  const close = () => {
    setIsOpen(false);
    setPreviewImage(null);
    setOptions({});
    
    // No need to save here as we've already saved in the useEffect
    // Set a small delay before allowing new interactions to prevent race conditions
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 300);
  }

  const handleDownloadImage = () => {
    if (editor) {
      if (previewImage) {
        const a = document.createElement('a')
        a.href = previewImage
        a.download = 'drawing.png'
        a.click()
      }
    }
  }

  // Function to recover canvas state in case of problems
  const handleRecoverCanvas = () => {
    if (!editor) return;
    
    try {
      setIsProcessing(true);
      const savedState = localStorage.getItem('canva_clone_temp_state') || 
                          localStorage.getItem('canva_clone_autosave');
                          
      if (savedState) {
        const template = JSON.parse(savedState);
        editor.importFromJSON(template);
        alert('Canvas state has been recovered!');
      } else {
        alert('No saved state found to recover.');
      }
    } catch (err) {
      console.error('Recovery failed:', err);
      alert('Failed to recover canvas state.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button 
          kind={KIND.primary} 
          onClick={() => setIsOpen(true)}
          disabled={isProcessing}>
          Preview
        </Button>
        
        {/* Emergency recovery button */}
        <Button 
          kind={KIND.tertiary} 
          onClick={handleRecoverCanvas}
          disabled={isProcessing}
          overrides={{
            BaseButton: {
              style: {
                fontSize: '0.8rem',
              },
            },
          }}>
          Recover Canvas
        </Button>
      </div>
      
      <ThemeProvider theme={LightTheme}>
        <Modal
          unstable_ModalBackdropScroll={true}
          overrides={{
            Dialog: {
              style: {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                backgroundColor: '#F9F9F9',
              },
            },
          }}
          onClose={close}
          isOpen={isOpen}
          size={SIZE.auto}
        >
          <ModalBody>
            <div>
              {previewImage ? (
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '1rem', flex: 1, width: '100%' }}>
                    Preview Image
                  </div>
                  <img style={{ maxWidth: '1200px' }} src={previewImage} alt="preview" />
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => handleDownloadImage()} disabled={isProcessing}>
                      Download image
                    </Button>
                    <Button 
                      onClick={close} 
                      kind={KIND.secondary} 
                      disabled={isProcessing}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 500, fontSize: '1.2rem', paddingBottom: '1rem' }}>Params</div>
                  {Object.keys(options).map(option => {
                    return (
                      <FormControl key={option} label={option}>
                        <Input
                          key={option}
                          value={options[option]}
                          onChange={(e: any) => setOptions({ ...options, [option]: e.target.value })}
                          disabled={isProcessing}
                        />
                      </FormControl>
                    )
                  })}
                  <Button 
                    onClick={() => handleBuildImage()} 
                    disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Build Image'}
                  </Button>
                </div>
              )}
            </div>
          </ModalBody>
        </Modal>
      </ThemeProvider>
    </>
  )
}

export default PreviewTemplate
