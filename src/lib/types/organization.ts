export interface OrganizationConfigResponse {
  anthropic_api_key_configured: boolean
  anthropic_tokens_per_hour: number
  github_token_configured: boolean
  github_pr_review_enabled: boolean
  webhook_base_url?: string
  embeddings_provider: string
  voyage_api_key_configured: boolean
  embeddings_model: string
  embeddings_dimensions: number
  github_client_id_configured: boolean
  github_client_secret_configured: boolean
  github_callback_url?: string
  gitlab_client_id_configured: boolean
  gitlab_client_secret_configured: boolean
  gitlab_callback_url?: string
  output_language: string
}

export interface UpdateOrganizationConfigRequest {
  anthropic_api_key?: string
  anthropic_tokens_per_hour?: number
  github_token?: string
  github_pr_review_enabled?: boolean
  webhook_base_url?: string
  embeddings_provider?: string
  voyage_api_key?: string
  embeddings_model?: string
  embeddings_dimensions?: number
  github_client_id?: string
  github_client_secret?: string
  github_callback_url?: string
  gitlab_client_id?: string
  gitlab_client_secret?: string
  gitlab_callback_url?: string
  output_language?: string
}
