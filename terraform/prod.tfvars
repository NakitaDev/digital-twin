project_name             = "twin"
environment              = "prod"
bedrock_model_id         = "amazon.nova-lite-v1:0"  # Use better model for production
lambda_timeout           = 60
api_throttle_burst_limit = 20
api_throttle_rate_limit  = 10
use_custom_domain        = false
root_domain              = ""  # Set to your domain only if you configured Route 53 (e.g. example.com)