"""Add live contexts table

Revision ID: fe368046e22c
Revises: 045896452df8
Create Date: 2025-04-28 08:50:34.378311

"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fe368046e22c'
down_revision = '045896452df8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('live_contexts',
    sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
    sa.Column('messages', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('live_context_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('process_id', sa.UUID(), nullable=True),
    sa.Column('event_id', sa.UUID(), nullable=True),
    sa.Column('template_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['process_id'], ['processes.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['template_id'], ['processes.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_live_contexts_created_at', 'live_contexts', ['created_at'], unique=False)
    op.create_index('idx_live_contexts_event_id', 'live_contexts', ['event_id'], unique=False)
    op.create_index('idx_live_contexts_process_id', 'live_contexts', ['process_id'], unique=False)
    op.create_index('idx_live_contexts_template_id', 'live_contexts', ['template_id'], unique=False)
    op.create_index('idx_live_contexts_user_id', 'live_contexts', ['user_id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index('idx_live_contexts_user_id', table_name='live_contexts')
    op.drop_index('idx_live_contexts_template_id', table_name='live_contexts')
    op.drop_index('idx_live_contexts_process_id', table_name='live_contexts')
    op.drop_index('idx_live_contexts_event_id', table_name='live_contexts')
    op.drop_index('idx_live_contexts_created_at', table_name='live_contexts')
    op.drop_table('live_contexts')
    # ### end Alembic commands ###
