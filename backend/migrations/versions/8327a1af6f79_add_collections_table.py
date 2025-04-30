"""add_collections_table

Revision ID: 8327a1af6f79
Revises: 856fe729115a
Create Date: 2025-04-30 12:37:29.386994

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '8327a1af6f79'
down_revision = '856fe729115a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create collections table
    op.create_table('collections',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('saves', sa.Integer(), default=0, nullable=True),
        sa.Column('collection_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_by_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indices for collections
    op.create_index('idx_collections_created_by_id', 'collections', ['created_by_id'], unique=False)
    op.create_index('idx_collections_title', 'collections', ['title'], unique=False)

    # Add normal_collection_id column to directories table
    op.add_column('directories',
        sa.Column('normal_collection_id', sa.UUID(), nullable=True)
    )

    # Add foreign key constraint to directories.normal_collection_id
    op.create_foreign_key(
        'fk_directories_normal_collection_id',
        'directories',
        'collections',
        ['normal_collection_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Create index for normal_collection_id on directories
    op.create_index('idx_directories_normal_collection_id', 'directories', ['normal_collection_id'], unique=False)


def downgrade() -> None:
    # Drop foreign key constraint and index for normal_collection_id
    op.drop_constraint('fk_directories_normal_collection_id', 'directories', type_='foreignkey')
    op.drop_index('idx_directories_normal_collection_id', table_name='directories')
    op.drop_column('directories', 'normal_collection_id')

    # Drop collections table and indices
    op.drop_index('idx_collections_title', table_name='collections')
    op.drop_index('idx_collections_created_by_id', table_name='collections')
    op.drop_table('collections')
