import { useCallback, useState, useEffect } from 'react'
import { Scrollbars } from 'react-custom-scrollbars'
import { Input } from 'baseui/input'
import Icons from '@components/icons'
import { useEditor } from '@nkyo/scenify-sdk'
import api from '@/services/api'

interface Image {
  id: string
  url: string
  preview?: string
}

function Images() {
  const [search, setSearch] = useState('')
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(false)

  const editor = useEditor()

  useEffect(() => {
    loadImages()
  }, [])

  const loadImages = async () => {
    setLoading(true)
    try {
      const data = await api.getImages()
      setImages(data)
    } catch (error) {
      console.error('Failed to load images:', error)
    } finally {
      setLoading(false)
    }
  }

  const addDynamicImage = useCallback(() => {
    if (editor) {
      const objectOptions = {
        width: 100,
        height: 100,
        backgroundColor: '#bdc3c7',
        type: 'DynamicImage',

        metadata: {
          keyValues: [{ key: '{{image}}', value: '' }],
        },
      }
      editor.add(objectOptions)
    }
  }, [editor])

  const addImageToCanvas = (imageUrl: string) => {
    if (editor) {
      const options = {
        type: 'StaticImage',
        metadata: { src: imageUrl },
      }
      editor.add(options)
    }
  }

  const filteredImages = images.filter((image: any) =>
    search ? image.alt?.toLowerCase().includes(search.toLowerCase()) || 
             image.tags?.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
      <div style={{ padding: '2rem 2rem' }}>
        <Input
          startEnhancer={() => <Icons.Search size={18} />}
          value={search}
          onChange={e => setSearch((e.target as any).value)}
          placeholder="Search images"
          clearOnEscape
        />
      </div>
      <div style={{ flex: 1 }}>
        <Scrollbars>
          <div style={{ display: 'grid', gap: '0.5rem', padding: '0 2rem 2rem' }}>
            <div
              style={{
                display: 'flex',
                paddingLeft: '1rem',
                fontSize: '1rem',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.045)',
                cursor: 'pointer',
                height: '50px',
              }}
              onClick={addDynamicImage}
            >
              Add dynamic image
            </div>
            
            {loading && (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                Loading images...
              </div>
            )}
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: '0.5rem',
              marginTop: '1rem' 
            }}>
              {filteredImages.map((image: any) => (
                <div
                  key={image.id}
                  style={{
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #e1e1e1',
                  }}
                  onClick={() => addImageToCanvas(image.url || image.src)}
                >
                  <img
                    src={image.preview || image.url || image.src}
                    alt={image.alt || 'Image'}
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Scrollbars>
      </div>
    </div>
  )
}

export default Images
