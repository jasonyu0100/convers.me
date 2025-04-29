"""remove_event_id_from_steps

Revision ID: 2e2d7d3fee2e
Revises: fe368046e22c
Create Date: 2025-04-29 11:04:53.565051

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '2e2d7d3fee2e'
down_revision = 'fe368046e22c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Since DB is wiped, we're just updating the table definition
    # Make process_id not nullable (required)
    op.alter_column('steps', 'process_id', nullable=False)

    # Drop the event_id column
    op.drop_column('steps', 'event_id')


def downgrade() -> None:
    # Add the event_id column back
    op.add_column('steps', sa.Column('event_id', sa.UUID(), nullable=True))

    # Make process_id nullable again
    op.alter_column('steps', 'process_id', nullable=True)
