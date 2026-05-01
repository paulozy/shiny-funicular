export interface OrganizationConfigResponse {
  id: string
  organization_id: string
  github_token?: string
  anthropic_key?: string
  voyage_key?: string
  webhook_base_url?: string
}

export interface UpdateOrganizationConfigRequest {
  github_token?: string
  anthropic_key?: string
  voyage_key?: string
  webhook_base_url?: string
}
