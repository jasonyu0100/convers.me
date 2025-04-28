"""
Post initialization module for sample post and media creation.
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from db.models import Event, EventStatusEnum, Media, MediaTypeEnum, Post, User

from .base_initializer import BaseInitializer


class PostInitializer(BaseInitializer):
    """Handles creation of posts and media content."""

    async def create_feed_content(self, users: List[User], events: List[Event]) -> Tuple[List[Post], List[Media]]:
        """
        Create activity feed content for a single-player experience.
        All content is created by the main user (first user in list).

        Args:
            users: List of users to create posts for
            events: List of events to associate with posts

        Returns:
            Tuple[List[Post], List[Media]]: Created posts and media
        """
        # Get main user (first user, typically jasonyu)
        main_user = users[0] if users else None
        if not main_user:
            self.logger.warning("No main user found for creating feed content")
            return [], []

        # Post templates with varied media types - all from the main user
        post_templates = [
            {
                "content": "Just finished the mockup for our landing page. Here's a walkthrough of the main features:",
                "media": {
                    "type": MediaTypeEnum.VIDEO,
                    "aspectRatio": "video",
                    "title": "Landing Page Walkthrough",
                    "url": "/video/stock-video-1.mp4",
                    "duration": "3:42",
                    "category": "Code Walkthrough",
                },
            },
            {
                "content": "Key takeaway from our design meeting yesterday:",
                "media": {
                    "type": MediaTypeEnum.QUOTE,
                    "source": "We should prioritize mobile responsiveness for all core features from the beginning rather than adding it later.",
                    "audioSource": "/audio/stock-audio-2.mp3",
                    "sourceName": "Design Planning Meeting",
                },
            },
            {
                "content": "Updated the color scheme based on our brand guidelines. What do you think of this palette?",
                "media": {
                    "type": MediaTypeEnum.IMAGE,
                    "aspectRatio": "square",
                    "title": "New Color Palette",
                    "url": "/image/stock-image-2.jpg",
                    "category": "Design Assets",
                },
            },
            {
                "content": "Recorded my thoughts on the API architecture. Let me know if this aligns with what we discussed.",
                "media": {
                    "type": MediaTypeEnum.AUDIO,
                    "aspectRatio": "square",
                    "title": "API Architecture Notes",
                    "url": "/audio/stock-audio-3.mp3",
                    "duration": "8:15",
                    "category": "Audio Discussion",
                },
            },
            {
                "content": "A principle we should follow for the API design:",
                "media": {
                    "type": MediaTypeEnum.QUOTE,
                    "source": "APIs should be designed around the business domain, not the underlying database schema.",
                    "sourceName": "API Design Guidelines",
                },
            },
        ]

        # Event-related post templates
        event_post_templates = [
            {"content_template": "Just wrapped up {}: {}. Great progress and collaboration from the team.", "media_type": MediaTypeEnum.IMAGE},
            {"content_template": "Key insights from {}: {}", "media_type": MediaTypeEnum.QUOTE},
            {"content_template": "Recording from our {} session. The discussion about {} was particularly valuable.", "media_type": MediaTypeEnum.VIDEO},
        ]

        posts = []
        all_media = []

        # Create specific posts from templates - all by main user
        for post_template in post_templates:
            # Create post with main user as author
            post = Post(
                id=str(uuid.uuid4()), content=post_template["content"], visibility="public", author_id=main_user.id, event_id=None  # Always use UUID format
            )

            post = self.add_and_flush(post, f"Error creating post with content: {post_template['content'][:50]}...")
            if not post:
                continue

            # Add media if specified
            if "media" in post_template:
                media_data = post_template["media"]
                media = await self._create_post_media(post, main_user, media_data)
                if media:
                    all_media.append(media)

            posts.append(post)

        # Create event-related posts for completed events - all by main user
        completed_events = [e for e in events if e.status == EventStatusEnum.DONE]
        for event in completed_events[:5]:  # Limit to 5 events
            # All events are hosted by the main user in single-player mode
            # Pick a template
            template = random.choice(event_post_templates)

            # Generate content
            topic_text = ", ".join([t.name for t in event.topics][:2]) if hasattr(event, "topics") and event.topics else "our project"
            content = template["content_template"].format(event.title, topic_text)

            # Create post
            post = Post(id=str(uuid.uuid4()), content=content, visibility="public", author_id=main_user.id, event_id=event.id)

            post = self.add_and_flush(post, f"Error creating event post for event {event.id}")
            if not post:
                continue

            # Add media based on template type
            media = await self._create_event_post_media(post, main_user, event, template, topic_text)
            if media:
                all_media.append(media)

            posts.append(post)

        # Create general posts without media - all by main user
        general_post_templates = [
            "Working on {} today. Making good progress!",
            "Just had a productive meeting about {}. Excited about the next steps!",
            "Looking for feedback on our approach to {}. Any thoughts?",
            "Brainstorming ideas for {}. Lots of potential directions!",
            "Celebrating a milestone in our {} project!",
        ]

        # Create additional posts - only for main user
        post_count = random.randint(5, 8)  # Create more posts for a fuller feed
        for i in range(post_count):
            # Select random topics for post content
            topics = [
                "frontend",
                "backend",
                "design",
                "product",
                "api",
                "database",
                "testing",
                "mobile",
                "security",
                "performance",
                "accessibility",
                "documentation",
            ]
            topic = random.choice(topics)

            # Generate content
            template = random.choice(general_post_templates)
            content = template.format(topic)

            # Create post with timestamp in the past
            hours_ago = random.randint(1, 14 * 24)  # Up to two weeks ago
            created_at = datetime.utcnow() - timedelta(hours=hours_ago)

            post = Post(id=str(uuid.uuid4()), content=content, visibility="public", author_id=main_user.id, created_at=created_at)

            post = self.add_and_flush(post, f"Error creating general post about {topic}")
            if post:
                posts.append(post)

        self.commit_with_rollback("Error saving feed content")

        self.logger.info(f"Created {len(posts)} feed posts with {len(all_media)} media items")
        return posts, all_media

    async def create_guest_feed_content(self, guest_user: User, team_users: List[User], events: List[Event], role: str) -> Tuple[List[Post], List[Media]]:
        """
        Create activity feed content for a guest user with relevant team members.

        Args:
            guest_user: The guest user to create content for
            team_users: List of team members
            events: List of events (may be empty)
            role: The role of the guest user

        Returns:
            Tuple[List[Post], List[Media]]: Created posts and media
        """
        # Safety check for parameters
        if not guest_user:
            self.logger.warning("No guest user provided for feed content creation")
            return [], []

        # Ensure events is at least an empty list
        events = events or []

        # Ensure team_users is at least an empty list
        team_users = team_users or []

        # Define role-specific post templates
        role_post_templates = {
            "dev": [
                {
                    "content": "Just pushed a fix for the authentication bug. This should resolve the login issues some users were experiencing.",
                    "media": {
                        "type": MediaTypeEnum.IMAGE,
                        "aspectRatio": "square",
                        "title": "Code Diff",
                        "url": "/image/stock-image-3.jpg",
                        "category": "Code Changes",
                    },
                },
                {"content": "Updated the API documentation with the new endpoints. Let me know if anything needs clarification.", "media": None},
                {
                    "content": "Working on optimizing our database queries. Already seeing a 30% performance improvement!",
                    "media": {
                        "type": MediaTypeEnum.QUOTE,
                        "source": "Performance is a feature. Users notice when your app is fast, and they notice when it's slow.",
                        "sourceName": "Engineering Principles",
                    },
                },
            ],
            "design": [
                {
                    "content": "Finished the mockups for the new dashboard. Focusing on data visualization and intuitive navigation.",
                    "media": {
                        "type": MediaTypeEnum.IMAGE,
                        "aspectRatio": "16/9",
                        "title": "Dashboard Mockup",
                        "url": "/image/stock-image-1.jpg",
                        "category": "UI Design",
                    },
                },
                {
                    "content": "User research findings are in! Here's a quick summary of what we learned:",
                    "media": {
                        "type": MediaTypeEnum.QUOTE,
                        "source": "Users want simpler navigation, clearer CTAs, and more visual feedback for interactions.",
                        "sourceName": "User Research Summary",
                    },
                },
                {"content": "Updated our color palette to improve accessibility. All colors now meet WCAG AA standards.", "media": None},
            ],
            "product": [
                {
                    "content": "Just updated the product roadmap for Q3. Key focus areas: user onboarding, analytics dashboard, and integration capabilities.",
                    "media": {
                        "type": MediaTypeEnum.IMAGE,
                        "aspectRatio": "16/9",
                        "title": "Q3 Roadmap",
                        "url": "/image/stock-image-4.jpg",
                        "category": "Product Planning",
                    },
                },
                {
                    "content": "Competitive analysis is complete. Here's the key insight we need to keep in mind:",
                    "media": {
                        "type": MediaTypeEnum.QUOTE,
                        "source": "Our key differentiator should be the seamless integration capabilities and enterprise-grade security features.",
                        "sourceName": "Competitive Analysis",
                    },
                },
                {
                    "content": "Met with key customers today to gather feedback on the latest features. Overall very positive with some good suggestions for improvements.",
                    "media": None,
                },
            ],
            "marketing": [
                {
                    "content": "Campaign performance metrics are in! 24% increase in click-through rate and 18% more conversions compared to last quarter.",
                    "media": {
                        "type": MediaTypeEnum.IMAGE,
                        "aspectRatio": "square",
                        "title": "Campaign Metrics",
                        "url": "/image/stock-image-2.jpg",
                        "category": "Analytics",
                    },
                },
                {
                    "content": "Reviewing content strategy for next quarter. Our guiding principle:",
                    "media": {
                        "type": MediaTypeEnum.QUOTE,
                        "source": "Create content that solves real problems for our audience, not just content that talks about our product.",
                        "sourceName": "Content Strategy Guidelines",
                    },
                },
                {
                    "content": "Just finalized the new email newsletter template. Focusing on personalization and highlighting user success stories.",
                    "media": None,
                },
            ],
        }

        # Define team post templates - these will appear from team members
        team_post_templates = [
            {"content_template": "Hey @{}, could you take a look at the {} when you have a moment? Would love your input!", "media": None},
            {"content_template": "@{} Great job on the {} presentation yesterday. Really clear and informative!", "media": None},
            {"content_template": "Working on the {} feature that @{} suggested. Making good progress!", "media": None},
        ]

        # Default to dev role if not specified
        role = role.lower() if role in role_post_templates else "dev"
        post_templates = role_post_templates.get(role, role_post_templates["dev"])

        posts = []
        all_media = []

        # Create guest user posts
        for post_template in post_templates:
            # Create post
            post = Post(
                id=str(uuid.uuid4()),
                content=post_template["content"],
                visibility="public",
                author_id=guest_user.id,
                event_id=None,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
            )

            post = self.add_and_flush(post, f"Error creating guest post: {post_template['content'][:50]}...")
            if not post:
                continue

            # Add media if specified
            if post_template["media"]:
                media_data = post_template["media"]
                media = await self._create_post_media(post, guest_user, media_data)
                if media:
                    all_media.append(media)

            posts.append(post)

        # Create team member posts mentioning the guest user
        for i in range(3):  # Create 3 team posts
            # Pick a random team member
            if not team_users or all(u.id == guest_user.id for u in team_users):
                break

            team_member = random.choice([u for u in team_users if u.id != guest_user.id])

            # Pick a template
            template = random.choice(team_post_templates)

            # Generate content with topics relevant to role
            role_topics = {
                "dev": ["API", "codebase", "database schema", "authentication system"],
                "design": ["UI mockups", "design system", "user flow", "color palette"],
                "product": ["roadmap", "feature prioritization", "user stories", "market analysis"],
                "marketing": ["campaign strategy", "content calendar", "analytics report", "social media plan"],
            }

            topics = role_topics.get(role, role_topics["dev"])
            topic = random.choice(topics)

            content = template["content_template"].format(guest_user.handle, topic)

            # Create post from team member mentioning guest
            post = Post(
                id=str(uuid.uuid4()),
                content=content,
                visibility="public",
                author_id=team_member.id,
                event_id=None,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
            )

            post = self.add_and_flush(post, f"Error creating team post from {team_member.handle}")
            if post:
                posts.append(post)

        # Create event-related posts if there are events
        if events:
            for event in events[:2]:  # Limit to 2 event posts
                # Generate content about the event
                content = f"Notes from our {event.title} meeting. Let's follow up on the action items we discussed."

                # Create post
                post = Post(
                    id=str(uuid.uuid4()),
                    content=content,
                    visibility="public",
                    author_id=guest_user.id,
                    event_id=event.id,
                    created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
                )

                post = self.add_and_flush(post, f"Error creating guest event post for event {event.id}")
                if not post:
                    continue

                # Add media - either image or quote
                if random.choice([True, False]):
                    media_data = {
                        "type": MediaTypeEnum.IMAGE,
                        "aspectRatio": "16/9",
                        "title": f"Notes from {event.title}",
                        "url": f"/image/stock-image-{random.randint(1, 4)}.jpg",
                        "category": "Meeting Notes",
                    }
                else:
                    # Generate a quote based on event title
                    quotes = [
                        "The key to successful collaboration is clear communication and shared understanding of goals.",
                        "Always focus on delivering value to users first, technical implementation second.",
                        "Regular incremental improvements lead to significant long-term gains.",
                        "Data should inform decisions, but not replace critical thinking and user empathy.",
                    ]

                    media_data = {"type": MediaTypeEnum.QUOTE, "source": random.choice(quotes), "sourceName": event.title}

                media = await self._create_post_media(post, guest_user, media_data)
                if media:
                    all_media.append(media)

                posts.append(post)

        self.commit_with_rollback("Error saving guest feed content")

        self.logger.info(f"Created {len(posts)} feed posts with {len(all_media)} media items for {role} guest user")
        return posts, all_media

    async def _create_post_media(self, post: Post, author: User, media_data: Dict[str, any]) -> Optional[Media]:
        """
        Create media for a post.

        Args:
            post: The post to attach media to
            author: The media creator
            media_data: Media data definition

        Returns:
            Media: Created media or None
        """
        try:
            if media_data["type"] == MediaTypeEnum.QUOTE:
                # Create quote media
                media = Media(
                    id=uuid.uuid4(),
                    type=MediaTypeEnum.QUOTE,
                    title=media_data.get("sourceName", "Quote"),
                    url="#",
                    post_id=post.id,
                    created_by_id=author.id,
                    media_metadata={
                        "quote_text": media_data["source"],
                        "source": media_data.get("sourceName", "Unknown"),
                        "audioSource": media_data.get("audioSource"),
                    },
                )
            else:
                # Create other media types
                media = Media(
                    id=uuid.uuid4(),
                    type=media_data["type"],
                    title=media_data.get("title", "Media"),
                    url=media_data["url"],
                    duration=media_data.get("duration"),
                    aspect_ratio=media_data.get("aspectRatio"),
                    post_id=post.id,
                    created_by_id=author.id,
                    media_metadata={"category": media_data.get("category"), "aspectRatio": media_data.get("aspectRatio")},
                )

            return self.add_and_flush(media, f"Error creating media for post {post.id}")
        except Exception as e:
            self.logger.error(f"Error creating post media: {e}")
            return None

    async def _create_event_post_media(self, post: Post, creator: User, event: Event, template: Dict[str, any], topic_text: str) -> Optional[Media]:
        """
        Create media for an event-related post.

        Args:
            post: The post to attach media to
            creator: The media creator
            event: The related event
            template: Template for media creation
            topic_text: Topic text to use in quotes

        Returns:
            Media: Created media or None
        """
        try:
            if template["media_type"] == MediaTypeEnum.QUOTE:
                # Generate a quote about the event
                quote_templates = [
                    f"The {topic_text} implementation should focus on scalability first, then optimize for performance.",
                    f"We need to ensure the {topic_text} aligns with our overall product vision.",
                    f"The key success metric for {topic_text} will be user engagement.",
                    f"For {topic_text}, we should prioritize the core functionality before adding extra features.",
                ]

                quote_text = random.choice(quote_templates)
                media = Media(
                    id=uuid.uuid4(),
                    type=MediaTypeEnum.QUOTE,
                    title=f"Highlight from {event.title}",
                    url="#",
                    post_id=post.id,
                    event_id=event.id,
                    created_by_id=creator.id,
                    media_metadata={"quote_text": quote_text, "source": event.title, "isEvent": True},
                )
            elif template["media_type"] == MediaTypeEnum.VIDEO and hasattr(event, "recording_url") and event.recording_url:
                # Use event recording
                media = Media(
                    id=uuid.uuid4(),
                    type=MediaTypeEnum.VIDEO,
                    title=f"Recording: {event.title}",
                    url=event.recording_url,
                    duration=f"{random.randint(20, 60)}:{random.randint(10, 59)}",
                    aspect_ratio="16/9",
                    post_id=post.id,
                    event_id=event.id,
                    created_by_id=creator.id,
                    media_metadata={"isEvent": True, "aspectRatio": "video"},
                )
            else:
                # Create image
                media = Media(
                    id=uuid.uuid4(),
                    type=MediaTypeEnum.IMAGE,
                    title=f"Image from {event.title}",
                    url=f"/image/stock-image-{random.randint(1, 4)}.jpg",
                    aspect_ratio=random.choice(["16/9", "1/1"]),
                    post_id=post.id,
                    event_id=event.id,
                    created_by_id=creator.id,
                    media_metadata={"isEvent": True, "aspectRatio": random.choice(["16/9", "square"])},
                )

            return self.add_and_flush(media, f"Error creating event media for post {post.id}")
        except Exception as e:
            self.logger.error(f"Error creating event post media: {e}")
            return None
