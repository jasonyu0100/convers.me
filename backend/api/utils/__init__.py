"""API utility functions package."""

# Re-export key functions from the modules for convenience
# when importing directly from api.utils package

# From api_utils.py
from api.utils.api_utils import (
    add_camel_case_fields,
    check_router_health,
    convert_snake_to_camel,
    convert_to_dict,
    create_model_validator,
    process_api_json,
    to_camel_case,
)

# From auth_utils.py
from api.utils.auth_utils import verify_event_ownership, verify_process_ownership, verify_user_admin

# From event_utils.py
from api.utils.event_utils import (
    create_auto_substeps,
    create_participants_group,
    format_participants,
    format_steps_with_substeps,
    generate_substeps_for_step,
    log_status_change,
    should_have_substeps,
)

# From response_utils.py
from api.utils.response_utils import format_response

# From uuid_utils.py - centralized UUID handling
from api.utils.uuid_utils import ensure_uuid_as_string

# List of all exported functions for star imports
__all__ = [
    # From api_utils.py
    "convert_to_dict",
    "add_camel_case_fields",
    "convert_snake_to_camel",
    "process_api_json",
    "to_camel_case",
    "check_router_health",
    "create_model_validator",
    # From auth_utils.py
    "verify_process_ownership",
    "verify_event_ownership",
    "verify_user_admin",
    # From event_utils.py
    "create_participants_group",
    "format_steps_with_substeps",
    "should_have_substeps",
    "generate_substeps_for_step",
    "create_auto_substeps",
    "format_participants",
    "log_status_change",
    # From uuid_utils.py
    "ensure_uuid_as_string",
    # From response_utils.py
    "format_response",
]
