"""drop_collection_directories_table

Revision ID: a29b8da4566c
Revises: 8327a1af6f79
Create Date: 2025-04-30 12:41:20.975034

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'a29b8da4566c'
down_revision = '8327a1af6f79'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if the table exists before dropping
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='collection_directories')"))
    table_exists = result.scalar()

    if table_exists:
        # Drop the table with cascade to automatically drop constraints
        op.execute(sa.text("DROP TABLE IF EXISTS collection_directories CASCADE"))


def downgrade() -> None:
    # Check if the table already exists
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='collection_directories')"))
    table_exists = result.scalar()

    if not table_exists:
        # Recreate the collection_directories table
        op.create_table('collection_directories',
            sa.Column('collection_id', sa.UUID(), nullable=False),
            sa.Column('directory_id', sa.UUID(), nullable=False),
            sa.ForeignKeyConstraint(['collection_id'], ['library_collections.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['directory_id'], ['directories.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('collection_id', 'directory_id')
        )
