# Prevent SQLAlchemy from loading psycopg dialect by patching sys.modules before any SQLAlchemy imports
import sys

# Remove psycopg dialect modules from sys.modules before they can be imported
modules_to_remove = [
    'sqlalchemy.dialects.postgresql.psycopg',
    'sqlalchemy.dialects.postgresql.psycopg_async',
]

for mod in modules_to_remove:
    if mod in sys.modules:
        del sys.modules[mod]

# Also remove from the parent module's __dict__ to prevent lazy loading
import sqlalchemy.dialects.postgresql
for attr in ['psycopg', 'psycopg_async']:
    if hasattr(sqlalchemy.dialects.postgresql, attr):
        delattr(sqlalchemy.dialects.postgresql, attr)

# Patch the dialect registry to remove psycopg entries
try:
    from sqlalchemy.dialects import registry
    if hasattr(registry, '_impls'):
        keys_to_remove = [k for k in registry._impls.keys() if 'psycopg' in k and 'psycopg2' not in k]
        for k in keys_to_remove:
            del registry._impls[k]
except Exception:
    pass