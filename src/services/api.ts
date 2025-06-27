import { IElement, IFontFamily, IUpload } from '@/interfaces/editor'
import axios, { AxiosInstance } from 'axios'

type Template = any
class ApiService {
  base: AxiosInstance
  newBase: AxiosInstance
  constructor() {
    // Keep original base for existing functionality
    this.base = axios.create({
      baseURL: 'https://api.scenify.io',
      headers: {
        Authorization: 'Bearer 9xfZNknNmE4ALeYS6ZCWX8pb',
      },
    })
    
    // New base for the updated APIs
    this.newBase = axios.create({
      baseURL: 'https://canva-clone-ali.vercel.app/api',
    })
  }

  // UPLOADS
  getSignedURLForUpload(props: { name: string }): Promise<{ url: string }> {
    return new Promise((resolve, reject) => {
      this.base
        .post('/uploads', props)
        .then(({ data }) => {
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  updateUploadFile(props: { name: string }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.base
        .put('/uploads', props)
        .then(({ data }) => {
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  getUploads(): Promise<IUpload[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.base.get('/uploads')
        resolve(data.data)
      } catch (err) {
        reject(err)
      }
    })
  }

  deleteUpload(id: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await this.base.delete(`/uploads/${id}`)
        resolve(response)
      } catch (err) {
        reject(err)
      }
    })
  }

  // TEMPLATES

  createTemplate(props: Partial<Template>): Promise<Template> {
    return new Promise((resolve, reject) => {
      this.base
        .post('/templates', props)
        .then(({ data }) => {
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  downloadTemplate(props: Partial<Template>): Promise<{ source: string }> {
    return new Promise((resolve, reject) => {
      this.base
        .post('/templates/download', props)
        .then(({ data }) => {
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  getTemplates(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load templates from local JSON file
        const response = await fetch('/data/template.json')
        const { data } = await response.json()
        
        // Transform the data to match the expected structure
        const transformedTemplates = data.map(template => {
          const fabricData = JSON.parse(template.json)
          return {
            id: template.id || template.name, // Use id if available, fallback to name
            name: template.name,
            preview: template.thumbnailUrl,
            width: template.width,
            height: template.height,
            objects: fabricData.objects || [],
            background: fabricData.background || { type: 'color', value: '#ffffff' },
            frame: {
              width: template.width,
              height: template.height
            },
            // Include the original fabric data for importFromJSON
            version: fabricData.version,
            clipPath: fabricData.clipPath
          }
        })
        
        resolve(transformedTemplates)
      } catch (err) {
        reject(err)
      }
    })
  }

  getTemplateById(id: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.base.get(`/templates/${id}`)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }
  //CREATIONS

  createCreation(props: Partial<Template>): Promise<Template> {
    return new Promise((resolve, reject) => {
      this.base
        .post('/creations', props)
        .then(({ data }) => {
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  getCreations(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.base.get('/creations')
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }

  getCreationById(id: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.base.get(`/creations/${id}`)
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }
  updateCreation(id: string, props: Partial<Template>): Promise<Template> {
    return new Promise((resolve, reject) => {
      this.base
        .put(`/creations/${id}`, props)
        .then(({ data }) => {
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }

  // ELEMENTS
  getElements(): Promise<IElement[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.base.get('/elements')
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }
  updateTemplate(id: number, props: Partial<Template>): Promise<Template> {
    return new Promise((resolve, reject) => {
      this.base
        .put(`/templates/${id}`, props)
        .then(({ data }) => {
          resolve(data)
        })
        .catch(err => reject(err))
    })
  }
  // FONTS
  getFonts(): Promise<IFontFamily[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const { data } = await this.base.get('/fonts')
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }

  // IMAGES - Load from local JSON file
  getImages(): Promise<any[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load images from local JSON file
        const response = await fetch('/data/images.json')
        const { data } = await response.json()
        
        // Transform the data to match the expected structure
        const transformedImages = data.map(image => ({
          id: image.id,
          url: image.urls.regular,
          src: image.urls.regular,
          preview: image.urls.small,
          alt: image.alt_description,
          description: image.description,
          user: image.user.name,
          width: image.width,
          height: image.height
        }))
        
        resolve(transformedImages)
      } catch (err) {
        reject(err)
      }
    })
  }
}

const apiService = new ApiService()
export default apiService
