"""rename_library_collections_to_collections

Revision ID: dc45c4dd7cf0
Revises: 5ef509ce59d8
Create Date: 2025-04-30 17:31:56.452490

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'dc45c4dd7cf0'
down_revision = '5ef509ce59d8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if library_collections table exists
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='library_collections')"))
    library_collections_exists = result.scalar()

    # Check if collections table exists
    result = conn.execute(sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='collections')"))
    collections_exists = result.scalar()

    # Case 1: None of the tables exist - create collections table from scratch
    if not library_collections_exists and not collections_exists:
        op.create_table('collections',
            sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
            sa.Column('title', sa.String(), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('saves', sa.Integer(), nullable=True),
            sa.Column('collection_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('created_by_id', sa.UUID(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
            sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('idx_collections_created_by_id', 'collections', ['created_by_id'], unique=False)
        op.create_index('idx_collections_title', 'collections', ['title'], unique=False)

        # Update foreign key constraints in directories table
        op.execute(sa.text("ALTER TABLE directories DROP CONSTRAINT IF EXISTS fk_directories_collection_id"))
        op.create_foreign_key("fk_directories_collection_id", 'directories', 'collections', ['collection_id'], ['id'], ondelete='SET NULL')

    # Case 2: library_collections exists but collections does not - rename the table
    elif library_collections_exists and not collections_exists:
        # Rename the table
        op.execute('ALTER TABLE library_collections RENAME TO collections')

        # Rename the indices
        op.execute('ALTER INDEX idx_library_collections_created_by_id RENAME TO idx_collections_created_by_id')
        op.execute('ALTER INDEX idx_library_collections_title RENAME TO idx_collections_title')

        # Update foreign key constraints in directories table
        try:
            op.drop_constraint('directories_collection_id_fkey', 'directories', type_='foreignkey')
        except:
            op.drop_constraint('fk_directories_collection_id', 'directories', type_='foreignkey')

        op.create_foreign_key("fk_directories_collection_id", 'directories', 'collections', ['collection_id'], ['id'], ondelete='SET NULL')

    # Case 3: Both tables exist - merge data and drop library_collections
    elif library_collections_exists and collections_exists:
        # Copy data from library_collections to collections
        op.execute('''
        INSERT INTO collections (id, title, description, saves, collection_metadata, created_by_id, created_at, updated_at)
        SELECT id, title, description, saves, collection_metadata, created_by_id, created_at, updated_at
        FROM library_collections
        ON CONFLICT (id) DO NOTHING
        ''')

        # Drop the old table and indices
        op.drop_index('idx_library_collections_created_by_id', table_name='library_collections')
        op.drop_index('idx_library_collections_title', table_name='library_collections')
        op.drop_table('library_collections')

        # Update foreign key constraints in directories table
        try:
            op.drop_constraint('directories_collection_id_fkey', 'directories', type_='foreignkey')
        except:
            op.drop_constraint('fk_directories_collection_id', 'directories', type_='foreignkey')

        op.create_foreign_key("fk_directories_collection_id", 'directories', 'collections', ['collection_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    # Check if collections table exists
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='collections')"))
    collections_exists = result.scalar()

    # Check if library_collections table exists
    result = conn.execute(sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='library_collections')"))
    library_collections_exists = result.scalar()

    # Only do the downgrade if the collections table exists
    if collections_exists:
        # If library_collections doesn't exist, we need to create it
        if not library_collections_exists:
            op.create_table('library_collections',
                sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
                sa.Column('title', sa.String(), nullable=False),
                sa.Column('description', sa.Text(), nullable=True),
                sa.Column('saves', sa.Integer(), nullable=True),
                sa.Column('collection_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
                sa.Column('created_by_id', sa.UUID(), nullable=True),
                sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
                sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
                sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
                sa.PrimaryKeyConstraint('id')
            )

            op.create_index('idx_library_collections_created_by_id', 'library_collections', ['created_by_id'], unique=False)
            op.create_index('idx_library_collections_title', 'library_collections', ['title'], unique=False)

            # Copy data from collections to library_collections
            op.execute('''
            INSERT INTO library_collections (id, title, description, saves, collection_metadata, created_by_id, created_at, updated_at)
            SELECT id, title, description, saves, collection_metadata, created_by_id, created_at, updated_at
            FROM collections
            ON CONFLICT (id) DO NOTHING
            ''')

        # Update foreign key constraint on directories
        try:
            op.drop_constraint('fk_directories_collection_id', 'directories', type_='foreignkey')
        except:
            op.drop_constraint('directories_collection_id_fkey', 'directories', type_='foreignkey')

        op.create_foreign_key('fk_directories_collection_id', 'directories', 'library_collections', ['collection_id'], ['id'], ondelete='SET NULL')

        # Now we can safely drop the collections table
        op.drop_index('idx_collections_title', table_name='collections')
        op.drop_index('idx_collections_created_by_id', table_name='collections')
        op.drop_table('collections')
