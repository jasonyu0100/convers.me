"""
Process initialization module for sample process creation.
"""

import random
import uuid
from datetime import datetime
from typing import Dict, List

from db.models import Directory, Process, Step, SubStep, User

from .base_initializer import BaseInitializer


class ProcessInitializer(BaseInitializer):
    """Handles creation of processes, steps, and substeps."""

    async def create_work_processes(self, users: List[User], directories: List[Directory]) -> List[Process]:
        """
        Create realistic work process templates and instances.

        Args:
            users: List of users to create processes for
            directories: List of directories to organize processes

        Returns:
            List[Process]: Created processes
        """
        # Define realistic processes for different roles
        process_definitions = [
            # Developer processes
            {
                "title": "Feature Development Workflow",
                "description": "Standard workflow for implementing new features",
                "color": "blue",
                "category": "Development",
                "role": "dev",
                "steps": [
                    {
                        "content": "Understand requirements and acceptance criteria",
                        "substeps": ["Review product specifications", "Clarify requirements with PM", "Define acceptance criteria"],
                    },
                    {
                        "content": "Create technical design document",
                        "substeps": ["Define architecture approach", "Document API contracts", "Get feedback from team"],
                    },
                    {"content": "Implement core functionality", "substeps": ["Set up project structure", "Implement business logic", "Create UI components"]},
                    {"content": "Write unit and integration tests", "substeps": []},
                    {"content": "Submit for code review", "substeps": []},
                    {"content": "Address code review feedback", "substeps": []},
                    {"content": "Merge to development branch", "substeps": []},
                    {"content": "Verify in staging environment", "substeps": []},
                ],
            },
            {
                "title": "Bug Fix Process",
                "description": "Standard workflow for fixing bugs",
                "color": "red",
                "category": "Development",
                "role": "dev",
                "steps": [
                    {
                        "content": "Reproduce and document the issue",
                        "substeps": ["Verify bug report", "Document steps to reproduce", "Record environment details"],
                    },
                    {"content": "Analyze root cause", "substeps": ["Review code", "Check logs", "Isolate the problem"]},
                    {"content": "Create fix implementation plan", "substeps": []},
                    {"content": "Implement the fix", "substeps": []},
                    {"content": "Add regression tests", "substeps": []},
                    {"content": "Verify fix resolves the issue", "substeps": []},
                    {"content": "Submit for code review", "substeps": []},
                    {"content": "Deploy to production", "substeps": []},
                ],
            },
            # Product Manager processes
            {
                "title": "Feature Planning Process",
                "description": "Process for planning and specifying new features",
                "color": "green",
                "category": "Planning",
                "role": "pm",
                "steps": [
                    {
                        "content": "Gather user feedback and requirements",
                        "substeps": ["Conduct user interviews", "Analyze usage data", "Review feature requests"],
                    },
                    {"content": "Define problem statement and success metrics", "substeps": ["Document user problems", "Define KPIs", "Set success criteria"]},
                    {"content": "Prioritize against other features", "substeps": []},
                    {"content": "Create user stories and acceptance criteria", "substeps": []},
                    {"content": "Collaborate with design on wireframes", "substeps": []},
                    {"content": "Review technical feasibility with engineering", "substeps": []},
                    {"content": "Finalize feature specification", "substeps": []},
                    {"content": "Present to stakeholders for approval", "substeps": []},
                ],
            },
            {
                "title": "Product Release Checklist",
                "description": "Steps to complete before releasing a new product version",
                "color": "amber",
                "category": "Product",
                "role": "pm",
                "steps": [
                    {
                        "content": "Verify all planned features are implemented",
                        "substeps": ["Review feature list", "Test all features", "Document any deferred items"],
                    },
                    {"content": "Ensure all critical bugs are fixed", "substeps": ["Review bug tracker", "Verify fixes", "Prioritize remaining issues"]},
                    {"content": "Review documentation updates", "substeps": []},
                    {"content": "Conduct final QA testing", "substeps": []},
                    {"content": "Prepare release notes", "substeps": []},
                    {"content": "Set up marketing announcements", "substeps": []},
                    {"content": "Brief customer support team", "substeps": []},
                    {"content": "Schedule release deployment", "substeps": []},
                    {"content": "Monitor post-release metrics", "substeps": []},
                ],
            },
            # Designer processes
            {
                "title": "Design System Updates",
                "description": "Process for updating the design system components",
                "color": "purple",
                "category": "Design",
                "role": "designer",
                "steps": [
                    {
                        "content": "Identify components needing updates",
                        "substeps": ["Audit existing components", "Gather feedback from users", "Review design inconsistencies"],
                    },
                    {"content": "Research current usage patterns", "substeps": ["Analyze component usage", "Identify pain points", "Document requirements"]},
                    {"content": "Create design proposals", "substeps": []},
                    {"content": "Get feedback from engineering", "substeps": []},
                    {"content": "Finalize component designs", "substeps": []},
                    {"content": "Update design documentation", "substeps": []},
                    {"content": "Create implementation guidelines", "substeps": []},
                    {"content": "Present changes to the team", "substeps": []},
                ],
            },
            # Operations processes
            {
                "title": "Infrastructure Upgrade Checklist",
                "description": "Steps for safely upgrading infrastructure components",
                "color": "teal",
                "category": "DevOps",
                "role": "ops",
                "steps": [
                    {
                        "content": "Document current infrastructure state",
                        "substeps": ["Create system diagram", "Document configurations", "Identify dependencies"],
                    },
                    {"content": "Identify components to upgrade", "substeps": ["Prioritize upgrades", "Research compatibility", "Create inventory"]},
                    {"content": "Assess impact and dependencies", "substeps": []},
                    {"content": "Create rollback plan", "substeps": []},
                    {"content": "Schedule maintenance window", "substeps": []},
                    {"content": "Perform pre-upgrade backups", "substeps": []},
                    {"content": "Execute upgrade steps", "substeps": []},
                    {"content": "Verify system functionality", "substeps": []},
                    {"content": "Update documentation", "substeps": []},
                    {"content": "Communicate completion to stakeholders", "substeps": []},
                ],
            },
            # Team processes that everyone uses
            {
                "title": "Sprint Planning Template",
                "description": "Process for planning and executing a sprint",
                "color": "blue",
                "category": "Agile",
                "role": "any",
                "steps": [
                    {"content": "Review and refine backlog", "substeps": ["Prioritize stories", "Clarify requirements", "Break down large stories"]},
                    {"content": "Estimate stories", "substeps": ["Discuss complexity", "Assign story points", "Identify dependencies"]},
                    {"content": "Set sprint goals", "substeps": []},
                    {"content": "Commit to sprint scope", "substeps": []},
                    {"content": "Create sprint plan", "substeps": []},
                    {"content": "Hold daily standups", "substeps": []},
                    {"content": "Conduct sprint review", "substeps": []},
                    {"content": "Run sprint retrospective", "substeps": []},
                ],
            },
            {
                "title": "Code Review Process",
                "description": "Standard process for code reviews",
                "color": "indigo",
                "category": "Development",
                "role": "any",
                "steps": [
                    {"content": "Prepare code for review", "substeps": ["Check coding standards", "Run tests", "Add documentation"]},
                    {"content": "Create pull request", "substeps": ["Write clear description", "Link relevant issues", "Set appropriate reviewers"]},
                    {"content": "Wait for reviewer feedback", "substeps": []},
                    {"content": "Address review comments", "substeps": []},
                    {"content": "Request re-review if needed", "substeps": []},
                    {"content": "Get approval", "substeps": []},
                    {"content": "Merge code", "substeps": []},
                    {"content": "Verify deployment", "substeps": []},
                ],
            },
            {
                "title": "Meeting Template",
                "description": "Standard process for effective meetings",
                "color": "green",
                "category": "Productivity",
                "role": "any",
                "steps": [
                    {
                        "content": "Define meeting purpose and goals",
                        "substeps": ["Identify key objectives", "Determine required attendees", "Set success criteria"],
                    },
                    {"content": "Create and share agenda", "substeps": ["List discussion topics", "Allocate time slots", "Distribute pre-reading materials"]},
                    {"content": "Conduct meeting", "substeps": []},
                    {"content": "Document decisions and action items", "substeps": []},
                    {"content": "Share meeting notes", "substeps": []},
                    {"content": "Follow up on action items", "substeps": []},
                ],
            },
            {
                "title": "Daily Standup",
                "description": "Process for daily team sync",
                "color": "green",
                "category": "Team",
                "role": "any",
                "steps": [
                    {"content": "What did you work on yesterday?", "substeps": []},
                    {"content": "What are you working on today?", "substeps": []},
                    {"content": "Any blockers or impediments?", "substeps": []},
                    {"content": "Any announcements for the team?", "substeps": []},
                    {"content": "Assign action items for blockers", "substeps": []},
                ],
            },
        ]

        processes = []

        # Categorize directories by purpose
        dev_directories = [d for d in directories if d.name in ["Development", "Engineering", "Tech"]]
        pm_directories = [d for d in directories if d.name in ["Product", "Planning", "Projects"]]
        design_directories = [d for d in directories if d.name in ["Design", "UX", "UI"]]
        ops_directories = [d for d in directories if d.name in ["Operations", "DevOps", "Infrastructure"]]
        general_directories = [d for d in directories if d.name in ["General", "Team", "Company"]]

        # Default fallbacks if specific directories aren't found
        if not dev_directories and directories:
            dev_directories = [directories[0]]
        if not pm_directories and directories:
            pm_directories = [directories[0]]
        if not design_directories and directories:
            design_directories = [directories[0]]
        if not ops_directories and directories:
            ops_directories = [directories[0]]
        if not general_directories and directories:
            general_directories = [directories[0]]

        # First create templates
        for proc_def in process_definitions:
            # Find the appropriate user based on the role
            user = None
            if proc_def["role"] == "dev":
                user = next((u for u in users if u.handle == "dev"), None)
                directory = dev_directories[0] if dev_directories else None
            elif proc_def["role"] == "pm":
                user = next((u for u in users if u.handle == "pm"), None)
                directory = pm_directories[0] if pm_directories else None
            elif proc_def["role"] == "designer":
                user = next((u for u in users if u.handle == "designer"), None)
                directory = design_directories[0] if design_directories else None
            elif proc_def["role"] == "ops":
                user = next((u for u in users if u.handle == "ops"), None)
                directory = ops_directories[0] if ops_directories else None
            else:  # "any" role processes - assign to first user
                user = users[0] if users else None
                directory = general_directories[0] if general_directories else None

            # If no matching user found, use the first user
            if not user and users:
                user = users[0]

            # Skip if no valid user or directory
            if not user or not directory:
                continue

            # Check if process already exists for this user
            existing = self.db.query(Process).filter(Process.title == proc_def["title"], Process.created_by_id == user.id, Process.is_template == True).first()

            if existing:
                processes.append(existing)
                self.logger.info(f"Process template '{proc_def['title']}' already exists for user {user.handle}")
                continue

            # Create the process template
            process = self._create_process_template(
                title=proc_def["title"], description=proc_def["description"], user=user, directory=directory, steps=proc_def["steps"]
            )

            if process:
                processes.append(process)
                self.logger.info(f"Created process template '{proc_def['title']}' for user {user.handle}")

        # Create instances from templates (1-2 instances for each template)
        # This ensures we have both templates and actual instances
        templates = [p for p in processes if p.is_template]
        for template in templates:
            # Create 1-2 instances per template
            instance_count = random.randint(1, 2)
            for i in range(instance_count):
                # Find the creator of the template
                creator = next((u for u in users if u.id == template.created_by_id), users[0] if users else None)
                if not creator:
                    continue

                # Create a modified title for the instance
                instance_title = template.title
                if i > 0:
                    prefixes = ["Project", "Task", "Sprint", "Q2", "Q3", "2024"]
                    instance_title = f"{random.choice(prefixes)}: {template.title}"

                # Create an instance
                instance = Process(
                    id=str(uuid.uuid4()),
                    title=instance_title,
                    description=template.description,
                    color=template.color,
                    created_by_id=creator.id,
                    directory_id=template.directory_id,
                    is_template=False,  # Not a template but an instance
                    template_id=template.id,  # Reference to template
                    category=template.category,
                    last_updated=datetime.utcnow().isoformat(),
                    process_metadata={"template_id": str(template.id), "template_title": template.title},
                )

                instance = self.add_and_flush(instance, f"Error creating process instance from template '{template.title}'")
                if not instance:
                    continue

                # Copy steps from template
                if hasattr(template, "steps") and template.steps:
                    for template_step in template.steps:
                        # Determine if some steps should be completed
                        is_completed = random.random() < 0.3  # 30% chance of completion

                        step = Step(
                            id=str(uuid.uuid4()), content=template_step.content, completed=is_completed, order=template_step.order, process_id=instance.id
                        )

                        step = self.add_and_flush(step, f"Error creating step for process instance '{instance.title}'")
                        if not step:
                            continue

                        # Copy substeps if any
                        if hasattr(template_step, "sub_steps") and template_step.sub_steps:
                            for sub_step in template_step.sub_steps:
                                # If parent step is completed, complete some substeps
                                sub_completed = is_completed and random.random() < 0.7

                                substep = SubStep(
                                    id=str(uuid.uuid4()), content=sub_step.content, completed=sub_completed, order=sub_step.order, step_id=step.id
                                )

                                self.add_and_flush(substep, f"Error creating substep for step '{step.content}'")

                processes.append(instance)
                self.logger.info(f"Created process instance '{instance.title}' from template '{template.title}'")

        # Report results
        self.log_creation("work processes", len(processes))
        return processes

    async def create_role_processes(self, user: User, role: str, directories: List[Directory], set_favorites: bool = True) -> List[Process]:
        """
        Create processes specific to a user role.

        Args:
            user: The user to create processes for
            role: The role of the user (dev, design, product, etc.)
            directories: Directories to organize processes
            set_favorites: Whether to mark some processes as favorites

        Returns:
            List[Process]: Created processes
        """
        role_specific_templates = {
            # Developer role templates
            "dev": [
                {
                    "title": "Feature Development Process",
                    "description": "Standard process for developing new features",
                    "color": "blue",
                    "category": "Development",
                    "steps": [
                        {"content": "Understand requirements", "substeps": ["Review specifications", "Ask clarifying questions", "Identify edge cases"]},
                        {"content": "Design solution", "substeps": ["Create technical design", "Document API changes", "Review with team"]},
                        {"content": "Implement feature", "substeps": []},
                        {"content": "Write tests", "substeps": []},
                        {"content": "Get code review", "substeps": []},
                        {"content": "Deploy to staging", "substeps": []},
                        {"content": "Final testing", "substeps": []},
                        {"content": "Release to production", "substeps": []},
                    ],
                },
                {
                    "title": "Code Refactoring Template",
                    "description": "Process for safely refactoring existing code",
                    "color": "indigo",
                    "category": "Development",
                    "steps": [
                        {"content": "Identify code to refactor", "substeps": ["Analyze complexity", "Review performance issues", "Document current behavior"]},
                        {"content": "Write comprehensive tests", "substeps": ["Unit tests", "Integration tests", "Edge case coverage"]},
                        {"content": "Refactor code incrementally", "substeps": []},
                        {"content": "Verify tests pass", "substeps": []},
                        {"content": "Get code review", "substeps": []},
                        {"content": "Deploy to staging", "substeps": []},
                        {"content": "Monitor performance", "substeps": []},
                    ],
                },
            ],
            # Product Manager role templates
            "pm": [
                {
                    "title": "Feature Definition Process",
                    "description": "Process for defining and scoping new features",
                    "color": "green",
                    "category": "Product",
                    "steps": [
                        {"content": "Identify user needs", "substeps": ["Review user feedback", "Analyze usage data", "Interview stakeholders"]},
                        {"content": "Define problem statement", "substeps": ["Document current pain points", "Identify opportunity", "Set success metrics"]},
                        {"content": "Brainstorm solutions", "substeps": []},
                        {"content": "Create wireframes", "substeps": []},
                        {"content": "Get stakeholder feedback", "substeps": []},
                        {"content": "Refine solution", "substeps": []},
                        {"content": "Create detailed spec", "substeps": []},
                        {"content": "Get implementation estimate", "substeps": []},
                    ],
                },
                {
                    "title": "Quarterly Planning",
                    "description": "Process for quarterly roadmap planning",
                    "color": "amber",
                    "category": "Planning",
                    "steps": [
                        {"content": "Review past quarter", "substeps": ["Analyze metrics", "Review completed features", "Identify gaps"]},
                        {"content": "Gather team input", "substeps": ["Engineering priorities", "Design needs", "Support feedback"]},
                        {"content": "Prioritize features", "substeps": []},
                        {"content": "Set quarterly OKRs", "substeps": []},
                        {"content": "Create draft roadmap", "substeps": []},
                        {"content": "Get stakeholder feedback", "substeps": []},
                        {"content": "Finalize quarterly plan", "substeps": []},
                        {"content": "Present to company", "substeps": []},
                    ],
                },
            ],
            # Designer role templates
            "designer": [
                {
                    "title": "UX Design Process",
                    "description": "Process for designing user experiences",
                    "color": "purple",
                    "category": "Design",
                    "steps": [
                        {"content": "Research & Discovery", "substeps": ["User interviews", "Competitive analysis", "Define problem statement"]},
                        {"content": "Ideation", "substeps": ["Brainstorming", "Sketching", "Solution exploration"]},
                        {"content": "Create wireframes", "substeps": []},
                        {"content": "Develop interactive prototype", "substeps": []},
                        {"content": "Conduct user testing", "substeps": []},
                        {"content": "Refine design", "substeps": []},
                        {"content": "Create final UI design", "substeps": []},
                        {"content": "Prepare handoff to development", "substeps": []},
                    ],
                },
                {
                    "title": "Design System Update",
                    "description": "Process for updating design system components",
                    "color": "pink",
                    "category": "Design",
                    "steps": [
                        {"content": "Audit current components", "substeps": ["Analyze usage", "Identify inconsistencies", "Document accessibility issues"]},
                        {"content": "Define update requirements", "substeps": ["List needed improvements", "Set design principles", "Define scope"]},
                        {"content": "Design component updates", "substeps": []},
                        {"content": "Create implementation plan", "substeps": []},
                        {"content": "Get stakeholder feedback", "substeps": []},
                        {"content": "Refine component designs", "substeps": []},
                        {"content": "Document component guidelines", "substeps": []},
                        {"content": "Release updated components", "substeps": []},
                    ],
                },
            ],
            # Operations role templates
            "ops": [
                {
                    "title": "Deployment Process",
                    "description": "Standard process for deploying code to production",
                    "color": "teal",
                    "category": "DevOps",
                    "steps": [
                        {
                            "content": "Verify staging deployment",
                            "substeps": ["Run automated tests", "Verify manual testing complete", "Check performance metrics"],
                        },
                        {"content": "Prepare deployment plan", "substeps": ["Document steps", "Create rollback procedure", "Set maintenance window"]},
                        {"content": "Back up production data", "substeps": []},
                        {"content": "Deploy to production", "substeps": []},
                        {"content": "Run post-deployment tests", "substeps": []},
                        {"content": "Monitor performance", "substeps": []},
                        {"content": "Verify metrics", "substeps": []},
                        {"content": "Send deployment notification", "substeps": []},
                    ],
                },
                {
                    "title": "Security Audit Process",
                    "description": "Process for conducting security audits",
                    "color": "red",
                    "category": "Security",
                    "steps": [
                        {"content": "Define audit scope", "substeps": ["Identify systems", "Set priorities", "Define success criteria"]},
                        {"content": "Perform vulnerability scan", "substeps": ["Run automated tools", "Document findings", "Prioritize issues"]},
                        {"content": "Review access controls", "substeps": []},
                        {"content": "Audit security configurations", "substeps": []},
                        {"content": "Test incident response", "substeps": []},
                        {"content": "Document findings", "substeps": []},
                        {"content": "Create remediation plan", "substeps": []},
                        {"content": "Present results to team", "substeps": []},
                    ],
                },
            ],
        }

        # Default templates for any role
        default_templates = [
            {
                "title": "Team Standup Process",
                "description": "Daily team standup meeting process",
                "color": "green",
                "category": "Team",
                "steps": [
                    {"content": "What did you accomplish yesterday?", "substeps": []},
                    {"content": "What will you work on today?", "substeps": []},
                    {"content": "Are there any blockers?", "substeps": []},
                    {"content": "Action items for blockers", "substeps": []},
                ],
            },
            {
                "title": "Meeting Process",
                "description": "Standard process for productive meetings",
                "color": "blue",
                "category": "Team",
                "steps": [
                    {"content": "Prepare agenda", "substeps": ["Define goals", "List topics", "Set time limits"]},
                    {"content": "Send invites with agenda", "substeps": []},
                    {"content": "Run meeting", "substeps": []},
                    {"content": "Document decisions", "substeps": []},
                    {"content": "Assign action items", "substeps": []},
                    {"content": "Share meeting notes", "substeps": []},
                ],
            },
        ]

        # Get templates based on role (or use defaults)
        templates_to_create = role_specific_templates.get(role.lower(), []) + default_templates

        # Create processes
        processes = []

        # Find appropriate directories
        role_directories = [d for d in directories if d.name.lower() in [role.lower(), "team", "general"]]
        if not role_directories and directories:
            role_directories = [directories[0]]  # Use first directory if no matching ones

        if not role_directories:
            self.logger.warning(f"No directories found for role {role}, cannot create processes")
            return []

        # Determine which processes will be favorites if set_favorites is True
        favorite_indices = []
        if set_favorites:
            # Choose 2-3 random templates to mark as favorites
            num_favorites = min(random.randint(2, 3), len(templates_to_create))
            favorite_indices = random.sample(range(len(templates_to_create)), num_favorites)

        # Create templates for this user
        for i, template_def in enumerate(templates_to_create):
            # Find or use first directory
            directory = role_directories[0]

            # Check if this template already exists for the user
            existing = self.db.query(Process).filter(Process.title == template_def["title"], Process.created_by_id == user.id).first()

            if existing:
                # If it exists and should be a favorite, update it
                if i in favorite_indices and not existing.favorite:
                    existing.favorite = True
                    self.db.add(existing)
                    self.db.flush()
                    self.logger.info(f"Marked existing process {template_def['title']} as favorite for user {user.handle}")

                self.logger.info(f"Process {template_def['title']} already exists for user {user.handle}")
                processes.append(existing)
                continue

            # Only templates can be favorites in guest initialization
            is_favorite = i in favorite_indices

            # Create template process
            process = self._create_process_template(
                title=template_def["title"],
                description=template_def["description"],
                user=user,
                directory=directory,
                steps=template_def["steps"],
                favorite=is_favorite,
            )

            if process:
                processes.append(process)
                self.logger.info(f"Created role-specific process {template_def['title']} for user {user.handle}")

                # Create 1-2 instances of each template (active processes)
                for i in range(random.randint(1, 2)):
                    instance_title = template_def["title"]

                    # Modify title to make it specific for instances
                    if "standup" in instance_title.lower():
                        instance_title = f"Daily {role.capitalize()} Standup"
                    elif "meeting" in instance_title.lower():
                        meeting_types = ["Planning", "Review", "Sync", "Discussion", "Brainstorming"]
                        instance_title = f"{random.choice(meeting_types)} Meeting"
                    else:
                        # Add a specific project name to other process instances
                        projects = ["User Authentication", "Dashboard", "Reporting", "Mobile App", "Settings Page", "API v2"]
                        instance_title = f"{random.choice(projects)} {instance_title}"

                    # Create a non-template instance - non-templates should never be favorites
                    instance = Process(
                        id=str(uuid.uuid4()),
                        title=instance_title,
                        description=template_def["description"],
                        color=template_def["color"],
                        created_by_id=user.id,
                        directory_id=directory.id,
                        is_template=False,  # Not a template
                        template_id=process.id,  # Reference to template
                        category=template_def["category"],
                        last_updated=datetime.utcnow().isoformat(),
                        process_metadata={"template_id": str(process.id), "template_title": process.title},
                        favorite=False,  # Non-templates should never be favorites
                    )

                    instance = self.add_and_flush(instance, f"Error creating process instance '{instance_title}'")
                    if not instance:
                        continue

                    # Copy steps from template with some completed
                    if hasattr(process, "steps") and process.steps:
                        for j, template_step in enumerate(process.steps):
                            # For instances, mark some steps as completed
                            is_completed = j < len(process.steps) // 2  # Complete about half the steps

                            step = Step(id=str(uuid.uuid4()), content=template_step.content, completed=is_completed, order=j + 1, process_id=instance.id)

                            step = self.add_and_flush(step, f"Error creating step for process instance '{instance_title}'")
                            if not step:
                                continue

                            # Copy substeps if any
                            if hasattr(template_step, "sub_steps") and template_step.sub_steps:
                                for k, sub_step in enumerate(template_step.sub_steps):
                                    # If parent step is completed, complete most substeps too
                                    sub_completed = is_completed and (k < len(template_step.sub_steps) - 1)

                                    substep = SubStep(id=str(uuid.uuid4()), content=sub_step.content, completed=sub_completed, order=k + 1, step_id=step.id)

                                    self.add_and_flush(substep, f"Error creating substep for process instance")

                    processes.append(instance)
                    self.logger.info(f"Created process instance '{instance_title}' for user {user.handle}")

        self.logger.info(f"Created {len(processes)} total processes for user {user.handle} with role {role}")
        return processes

    def _create_process_template(self, title: str, description: str, user: User, directory: Directory, steps: List[Dict], favorite: bool = False) -> Process:
        """
        Create a process template with steps and substeps.

        Args:
            title: Process title
            description: Process description
            user: Creating user
            directory: Directory to place process in
            steps: List of step dictionaries
            favorite: Whether this process should be marked as a favorite

        Returns:
            Process: The created process
        """
        # Create process
        process = Process(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            color=random.choice(["blue", "green", "purple", "orange", "red", "teal"]),
            created_by_id=user.id,
            directory_id=directory.id if directory else None,
            is_template=True,  # Mark as a template
            category=directory.name if directory else "General",
            last_updated=datetime.utcnow().isoformat(),
            favorite=favorite,  # Set favorite status
        )

        # Add to database with our base class method
        process = self.add_and_flush(process, f"Error creating process template '{title}'")

        if not process:
            return None

        # Add steps
        for i, step_data in enumerate(steps):
            step = Step(id=str(uuid.uuid4()), content=step_data["content"], completed=False, order=i + 1, process_id=process.id)

            # Add to database
            step = self.add_and_flush(step, f"Error creating step for process '{title}'")

            if not step:
                continue

            # Add substeps if any
            if "substeps" in step_data and step_data["substeps"]:
                for j, substep_content in enumerate(step_data["substeps"]):
                    substep = SubStep(id=str(uuid.uuid4()), content=substep_content, completed=False, order=j + 1, step_id=step.id)

                    # Add to database
                    self.add_and_flush(substep, f"Error creating substep for step '{step.content}'")

        return process

    # Additional helper methods would be refactored to use the base class
    # ...
