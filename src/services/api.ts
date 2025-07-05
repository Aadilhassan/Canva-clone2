import { IElement, IFontFamily, IUpload } from '@/interfaces/editor'
import { supabase } from '@/lib/supabase'
import { designService } from './designService'

type Template = any

class ApiService {
  constructor() {
    // No longer using external APIs - all data is handled through Supabase
  }

  // Helper to get current user's workspace
  private async getCurrentWorkspaceId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    // Get user's first workspace (you might want to implement workspace selection)
    const workspaces = await designService.getUserWorkspaces()
    if (workspaces.length === 0) {
      throw new Error('No workspace found for user')
    }
    return workspaces[0].id
  }

  // UPLOADS - Now using Supabase storage
  async getSignedURLForUpload(props: { name: string }): Promise<{ url: string }> {
    // This method is deprecated as we now upload directly to Supabase
    // Return a placeholder for backward compatibility
    return { url: '/api/upload-placeholder' }
  }

  async updateUploadFile(props: { name: string }): Promise<any> {
    // Legacy method - uploads are now handled directly through Supabase
    return { success: true }
  }

  async getUploads(): Promise<IUpload[]> {
    try {
      const workspaceId = await this.getCurrentWorkspaceId()
      const assets = await designService.getAssets(workspaceId, 'image')
      
      // Transform design assets to IUpload format
      return assets.map(asset => ({
        id: asset.id,
        contentType: asset.mime_type || 'image/jpeg',
        folder: 'uploads',
        name: asset.name,
        type: asset.asset_type,
        url: asset.public_url || ''
      }))
    } catch (err) {
      throw err
    }
  }

  async deleteUpload(id: string) {
    try {
      await designService.deleteAsset(id)
      return { success: true }
    } catch (err) {
      throw err
    }
  }

  // TEMPLATES - Now using Supabase database
  async createTemplate(props: Partial<Template>): Promise<Template> {
    try {
      const workspaceId = await this.getCurrentWorkspaceId()
      const template = await designService.createTemplate({
        workspace_id: workspaceId,
        name: props.name || 'Untitled Template',
        description: props.description,
        thumbnail_url: props.preview || '',
        canvas_data: {
          objects: props.objects || [],
          background: props.background || { type: 'color', value: '#ffffff' },
          frame: props.frame || { width: 800, height: 600 }
        },
        frame: props.frame || { width: 800, height: 600 },
        category: props.category,
        tags: props.tags || [],
        is_public: false,
        is_premium: false,
        created_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      return template
    } catch (err) {
      throw err
    }
  }

  async downloadTemplate(props: Partial<Template>): Promise<{ source: string }> {
    // This method is deprecated as templates are now stored in database
    return { source: JSON.stringify(props) }
  }

  async getTemplates(): Promise<any[]> {
    try {
      // First try to get public templates from database
      const dbTemplates = await designService.getTemplates(true)
      
      if (dbTemplates.length > 0) {
        return dbTemplates.map(template => ({
          id: template.id,
          name: template.name,
          preview: template.thumbnail_url,
          width: template.frame?.width || 800,
          height: template.frame?.height || 600,
          objects: template.canvas_data?.objects || [],
          background: template.canvas_data?.background || { type: 'color', value: '#ffffff' },
          frame: template.frame || { width: 800, height: 600 },
          version: template.canvas_data?.version,
          clipPath: template.canvas_data?.clipPath
        }))
      }

      // Fallback to local JSON file if no database templates exist
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
      
      return transformedTemplates
    } catch (err) {
      throw err
    }
  }

  async getTemplateById(id: string): Promise<any> {
    try {
      const template = await designService.getTemplate(id)
      if (!template) throw new Error('Template not found')
      
      return {
        id: template.id,
        name: template.name,
        preview: template.thumbnail_url,
        width: template.frame?.width || 800,
        height: template.frame?.height || 600,
        objects: template.canvas_data?.objects || [],
        background: template.canvas_data?.background || { type: 'color', value: '#ffffff' },
        frame: template.frame || { width: 800, height: 600 },
        version: template.canvas_data?.version,
        clipPath: template.canvas_data?.clipPath
      }
    } catch (err) {
      throw err
    }
  }

  // async updateTemplate(id: string, props: Partial<Template>): Promise<Template> {
  //   try {
  //     const updates: any = {}
      
  //     if (props.name) updates.name = props.name
  //     if (props.description) updates.description = props.description
  //     if (props.preview) updates.thumbnail_url = props.preview
  //     if (props.category) updates.category = props.category
  //     if (props.tags) updates.tags = props.tags
      
  //     if (props.objects || props.background || props.frame) {
  //       updates.canvas_data = {
  //         objects: props.objects || [],
  //         background: props.background || { type: 'color', value: '#ffffff' },
  //         frame: props.frame || { width: 800, height: 600 }
  //       }
  //     }
      
  //     if (props.frame) updates.frame = props.frame

  //     const { data, error } = await supabase
  //       .from('design_templates')
  //       .update(updates)
  //       .eq('id', id)
  //       .select()
  //       .single()

  //     if (error) throw error
  //     return data
  //   } catch (err) {
  //     throw err
  //   }
  // }
  // CREATIONS - Now using Supabase database
  async createCreation(props: Partial<Template>): Promise<Template> {
    try {
      const workspaceId = await this.getCurrentWorkspaceId()
      const creation = await designService.createDesignProject({
        workspace_id: workspaceId,
        name: props.name || 'Untitled Design',
        description: props.description,
        canvas_data: {
          objects: props.objects || [],
          background: props.background || { type: 'color', value: '#ffffff' },
          frame: props.frame || { width: 800, height: 600 }
        },
        frame: props.frame || { width: 800, height: 600 },
        thumbnail_url: props.preview,
        status: 'draft',
        is_template: false,
        tags: props.tags || [],
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
        last_modified_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      return creation
    } catch (err) {
      throw err
    }
  }

  async getCreations(): Promise<any[]> {
    try {
      const workspaceId = await this.getCurrentWorkspaceId()
      const projects = await designService.getDesignProjects(workspaceId)
      
      return projects.map(project => ({
        id: project.id,
        name: project.name,
        preview: project.thumbnail_url,
        width: project.frame?.width || 800,
        height: project.frame?.height || 600,
        objects: project.canvas_data?.objects || [],
        background: project.canvas_data?.background || { type: 'color', value: '#ffffff' },
        frame: project.frame || { width: 800, height: 600 },
        status: project.status,
        created_at: project.created_at,
        updated_at: project.updated_at
      }))
    } catch (err) {
      throw err
    }
  }

  async getCreationById(id: string): Promise<any> {
    try {
      const project = await designService.getDesignProject(id)
      if (!project) throw new Error('Design project not found')
      
      return {
        id: project.id,
        name: project.name,
        preview: project.thumbnail_url,
        width: project.frame?.width || 800,
        height: project.frame?.height || 600,
        objects: project.canvas_data?.objects || [],
        background: project.canvas_data?.background || { type: 'color', value: '#ffffff' },
        frame: project.frame || { width: 800, height: 600 },
        status: project.status,
        created_at: project.created_at,
        updated_at: project.updated_at
      }
    } catch (err) {
      throw err
    }
  }

  async updateCreation(id: string, props: Partial<Template>): Promise<Template> {
    try {
      const updates: any = {}
      
      if (props.name) updates.name = props.name
      if (props.description) updates.description = props.description
      if (props.preview) updates.thumbnail_url = props.preview
      if (props.tags) updates.tags = props.tags
      
      if (props.objects || props.background || props.frame) {
        updates.canvas_data = {
          objects: props.objects || [],
          background: props.background || { type: 'color', value: '#ffffff' },
          frame: props.frame || { width: 800, height: 600 }
        }
      }
      
      if (props.frame) updates.frame = props.frame

      const updatedProject = await designService.updateDesignProject(id, updates)
      
      return {
        id: updatedProject.id,
        name: updatedProject.name,
        preview: updatedProject.thumbnail_url,
        width: updatedProject.frame?.width || 800,
        height: updatedProject.frame?.height || 600,
        objects: updatedProject.canvas_data?.objects || [],
        background: updatedProject.canvas_data?.background || { type: 'color', value: '#ffffff' },
        frame: updatedProject.frame || { width: 800, height: 600 },
        status: updatedProject.status,
        created_at: updatedProject.created_at,
        updated_at: updatedProject.updated_at
      }
    } catch (err) {
      throw err
    }
  }

  // ELEMENTS - Using local elements or Supabase storage
  async getElements(): Promise<IElement[]> {
    try {
      // For now, return empty array or implement local elements
      // You can create a design_elements table if needed
      return []
    } catch (err) {
      throw err
    }
  }
  async updateTemplate(id: string | number, props: Partial<Template>): Promise<Template> {
    try {
      const updates: any = {}
      
      if (props.name) updates.name = props.name
      if (props.description) updates.description = props.description
      if (props.preview) updates.thumbnail_url = props.preview
      if (props.category) updates.category = props.category
      if (props.tags) updates.tags = props.tags
      
      if (props.objects || props.background || props.frame) {
        updates.canvas_data = {
          objects: props.objects || [],
          background: props.background || { type: 'color', value: '#ffffff' },
          frame: props.frame || { width: 800, height: 600 }
        }
      }
      
      if (props.frame) updates.frame = props.frame

      const updatedTemplate = await designService.updateTemplate(id.toString(), updates)
      
      return {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        preview: updatedTemplate.thumbnail_url,
        width: updatedTemplate.frame?.width || 800,
        height: updatedTemplate.frame?.height || 600,
        objects: updatedTemplate.canvas_data?.objects || [],
        background: updatedTemplate.canvas_data?.background || { type: 'color', value: '#ffffff' },
        frame: updatedTemplate.frame || { width: 800, height: 600 },
        version: updatedTemplate.canvas_data?.version,
        clipPath: updatedTemplate.canvas_data?.clipPath
      }
    } catch (err) {
      throw err
    }
  }
  // FONTS
  async getFonts(): Promise<IFontFamily[]> {
    try {
      // Load fonts from a local JSON file
      const response = await fetch('/data/fonts.json')
      const { data } = await response.json()
      return data
    } catch (err) {
      console.error('Error loading fonts:', err)
      // Return some default fonts as fallback
      return [
        {
          id: 'arial',
          family: 'Arial',
          variants: ['300', 'regular', '700'],
          files: [],
          subsets: ['latin'],
          version: '1',
          lastModified: '2023-01-01',
          category: 'sans-serif',
          kind: 'webfonts#webfont'
        },
        {
          id: 'times-new-roman',
          family: 'Times New Roman',
          variants: ['regular', '500', '700'],
          files: [],
          subsets: ['latin'],
          version: '1',
          lastModified: '2023-01-01',
          category: 'serif',
          kind: 'webfonts#webfont'
        }
      ]
    }
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
