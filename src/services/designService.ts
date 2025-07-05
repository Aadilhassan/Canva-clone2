import { supabase } from '@/lib/supabase'

export interface DesignProject {
  id: string
  workspace_id: string
  name: string
  description?: string
  thumbnail_url?: string
  canvas_data: any // FabricJS JSON
  frame: { width: number; height: number }
  status: 'draft' | 'published' | 'archived' | 'shared'
  is_template: boolean
  template_category?: string
  tags?: string[]
  created_by: string
  last_modified_by?: string
  last_saved_at: string
  created_at: string
  updated_at: string
}

export interface DesignTemplate {
  id: string
  workspace_id?: string
  name: string
  description?: string
  thumbnail_url: string
  canvas_data: any // FabricJS JSON
  frame: { width: number; height: number }
  category?: string
  tags?: string[]
  is_public: boolean
  is_premium: boolean
  usage_count: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface DesignAsset {
  id: string
  workspace_id: string
  name: string
  file_name: string
  file_size?: number
  mime_type?: string
  asset_type: 'image' | 'video' | 'audio' | 'document' | 'design_template'
  storage_path: string
  public_url?: string
  thumbnail_url?: string
  metadata: any
  uploaded_by: string
  created_at: string
  updated_at: string
}

class DesignService {
  // ===== DESIGN PROJECTS =====

  async getDesignProjects(workspaceId: string): Promise<DesignProject[]> {
    const { data, error } = await supabase
      .from('design_projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getDesignProject(id: string): Promise<DesignProject | null> {
    const { data, error } = await supabase
      .from('design_projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createDesignProject(project: Omit<DesignProject, 'id' | 'created_at' | 'updated_at' | 'last_saved_at'>): Promise<DesignProject> {
    const { data, error } = await supabase
      .from('design_projects')
      .insert(project)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateDesignProject(id: string, updates: Partial<DesignProject>): Promise<DesignProject> {
    const { data, error } = await supabase
      .from('design_projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteDesignProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('design_projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async saveDesignCanvas(id: string, canvasData: any, thumbnailUrl?: string): Promise<void> {
    const updates: any = { canvas_data: canvasData }
    if (thumbnailUrl) {
      updates.thumbnail_url = thumbnailUrl
    }

    const { error } = await supabase
      .from('design_projects')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  // ===== DESIGN TEMPLATES =====

  async getTemplates(isPublic = true, workspaceId?: string): Promise<DesignTemplate[]> {
    let query = supabase
      .from('design_templates')
      .select('*')
      .order('usage_count', { ascending: false })

    if (isPublic) {
      query = query.eq('is_public', true)
    } else if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getTemplate(id: string): Promise<DesignTemplate | null> {
    const { data, error } = await supabase
      .from('design_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createTemplate(template: Omit<DesignTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<DesignTemplate> {
    const { data, error } = await supabase
      .from('design_templates')
      .insert({ ...template, usage_count: 0 })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTemplate(id: string, updates: Partial<DesignTemplate>): Promise<DesignTemplate> {
    const { data, error } = await supabase
      .from('design_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async createDesignFromTemplate(templateId: string, name: string, workspaceId: string): Promise<DesignProject> {
    const { data, error } = await supabase.rpc('create_design_from_template', {
      template_id: templateId,
      project_name: name,
      target_workspace_id: workspaceId
    })

    if (error) throw error
    if (!data[0]?.success) {
      throw new Error(data[0]?.error_message || 'Failed to create design from template')
    }

    return this.getDesignProject(data[0].design_id)
  }

  // ===== DESIGN ASSETS =====

  async getAssets(workspaceId: string, assetType?: string): Promise<DesignAsset[]> {
    let query = supabase
      .from('design_assets')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (assetType) {
      query = query.eq('asset_type', assetType)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async uploadAsset(
    workspaceId: string,
    file: File,
    assetType: 'image' | 'video' | 'audio' | 'document' | 'design_template' = 'image'
  ): Promise<DesignAsset> {
    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${workspaceId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('design-assets')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('design-assets')
      .getPublicUrl(fileName)

    // Create asset record
    const assetData = {
      workspace_id: workspaceId,
      name: file.name,
      file_name: fileName,
      file_size: file.size,
      mime_type: file.type,
      asset_type: assetType,
      storage_path: uploadData.path,
      public_url: publicUrl,
      metadata: {},
      uploaded_by: (await supabase.auth.getUser()).data.user?.id || ''
    }

    const { data, error } = await supabase
      .from('design_assets')
      .insert(assetData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteAsset(id: string): Promise<void> {
    // Get asset info first
    const { data: asset } = await supabase
      .from('design_assets')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (asset) {
      // Delete from storage
      await supabase.storage
        .from('design-assets')
        .remove([asset.storage_path])
    }

    // Delete record
    const { error } = await supabase
      .from('design_assets')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ===== WORKSPACE MANAGEMENT =====

  async getUserWorkspaces(): Promise<any[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select(`
        workspace_id,
        role,
        status,
        workspaces (
          id,
          name,
          slug,
          settings,
          created_at
        )
      `)
      .eq('status', 'active')

    if (error) throw error
    return data?.map(item => ({
      ...item.workspaces,
      role: item.role,
      status: item.status
    })) || []
  }

  async createWorkspace(name: string, slug: string, description?: string): Promise<any> {
    const { data, error } = await supabase.rpc('create_workspace_with_owner', {
      workspace_name: name,
      workspace_slug: slug,
      workspace_description: description
    })

    if (error) throw error
    if (!data[0]?.success) {
      throw new Error(data[0]?.error_message || 'Failed to create workspace')
    }

    return data[0].workspace_id
  }

  // ===== SHARING =====

  async shareDesign(designId: string, email: string, permission: 'view' | 'edit' | 'comment' = 'view'): Promise<string> {
    const { data, error } = await supabase
      .from('design_shares')
      .insert({
        design_project_id: designId,
        shared_with_email: email,
        permission,
        created_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      .select('share_token')
      .single()

    if (error) throw error
    return data.share_token
  }

  async getSharedDesign(token: string): Promise<any> {
    const { data, error } = await supabase
      .from('design_shares')
      .select(`
        *,
        design_projects (*)
      `)
      .eq('share_token', token)
      .single()

    if (error) throw error
    return data
  }
}

export const designService = new DesignService()
export default designService
