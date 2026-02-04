# Nexus - AI-First Ticket Management Platform

## System Architecture

### Information Architecture

```
Nexus Platform
├── Landing Page (/)
│   ├── Hero Section
│   ├── Features
│   ├── AI Showcase
│   └── CTA
│
├── Authentication
│   ├── Login (/login)
│   └── Signup (/signup) → Organization Onboarding
│
├── Dashboard (/dashboard)
│   ├── Stats Overview
│   ├── Recent Tickets
│   ├── Activity Feed
│   ├── AI Insights
│   └── Sprint Progress
│
├── Projects (/projects)
│   └── Project Board (/projects/:id)
│       ├── Kanban View
│       ├── List View (future)
│       └── Timeline View (future)
│
├── Tickets (/tickets)
│   └── My Tickets View
│
├── Team (/team)
│   └── Team Management
│
└── Settings (/settings)
    ├── Profile
    ├── Organization
    └── Integrations
```

### Data Models

```typescript
// Core Entities
Organization {
  id, name, slug, logo_url, created_at, updated_at
}

Profile {
  id, user_id, email, full_name, avatar_url, created_at, updated_at
}

OrganizationMembership {
  id, organization_id, user_id, role: 'admin' | 'manager' | 'member'
}

Project {
  id, organization_id, name, key, description, ticket_counter
}

Sprint {
  id, organization_id, project_id, name, goal, status, start_date, end_date
}

Ticket {
  id, organization_id, project_id, sprint_id?,
  key, title, description,
  type: 'bug' | 'task' | 'story' | 'support',
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked',
  priority: 'critical' | 'high' | 'medium' | 'low',
  assignee_id?, reporter_id, labels[], due_date?,
  estimate_hours?, ai_generated, ai_triage_data
}

Comment {
  id, organization_id, ticket_id, author_id, content, is_ai_generated
}

ActivityLog {
  id, organization_id, entity_type, entity_id, action,
  user_id?, details, is_ai_action
}
```

### AI Agent Prompts

#### 1. Ticket Creation Agent
```
Role: AI-guided ticket creation assistant
Flow: Natural language → Clarifying questions → Structured output
Tool: create_ticket(title, description, type, priority, labels, estimateHours)
```

#### 2. Ticket Triage Agent
```
Role: Automated ticket analysis and recommendations
Outputs:
- Priority assessment with reasoning
- Suggested assignee role
- SLA risk level
- Recommended labels
- Sprint placement suggestion
Tool: triage_ticket(suggestedPriority, priorityReasoning, suggestedAssigneeRole, slaRisk, slaRiskReasoning, suggestedLabels, sprintRecommendation)
```

#### 3. Manager Copilot Agent
Actions:
- sprint_summary: Sprint progress, accomplishments, blockers, velocity
- project_analysis: Health score, bottlenecks, resource insights
- team_insights: Workload distribution, collaboration patterns
- standup_prep: Yesterday, today, blockers, quick stats

### Event Flow: Ticket Lifecycle

```
User Input
    │
    ▼
┌─────────────────────┐
│   AI Chat Panel     │
│   (create_ticket)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Guided Questions   │
│  - What's the issue?│
│  - Type?            │
│  - Urgency?         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Structured Data   │
│   Extraction        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Ticket Created    │────▶│   AI Triage         │
│   (Database)        │     │   (Background)      │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          │                           ▼
          │                 ┌─────────────────────┐
          │                 │   Triage Results    │
          │                 │   - Priority        │
          │                 │   - Assignee        │
          │                 │   - SLA Risk        │
          │                 │   - Labels          │
          │                 └─────────┬───────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Activity Log      │◀────│   Ticket Updated    │
│   Entry Created     │     │   (with triage)     │
└─────────────────────┘     └─────────────────────┘
          │
          ▼
┌─────────────────────┐
│   Kanban Board      │
│   Update            │
└─────────────────────┘
```

### Multi-Tenant Data Isolation

```
Every Request
    │
    ▼
┌─────────────────────┐
│   Auth Check        │
│   (JWT Token)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Organization      │
│   Context           │
│   (from selector)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   RLS Policy        │
│   Enforcement       │
│   - is_member_of_org│
│   - get_user_role   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   Filtered Data     │
│   (org-scoped)      │
└─────────────────────┘
```

### Role-Based Access Control

| Action | Admin | Manager | Member |
|--------|-------|---------|--------|
| View org data | ✅ | ✅ | ✅ |
| Update org settings | ✅ | ❌ | ❌ |
| Create projects | ✅ | ✅ | ❌ |
| Manage projects | ✅ | ✅ | ❌ |
| Create tickets | ✅ | ✅ | ✅ |
| Update any ticket | ✅ | ✅ | ❌ |
| Update assigned ticket | ✅ | ✅ | ✅ |
| Delete tickets | ✅ | ✅ | ❌ |
| Manage team | ✅ | ❌ | ❌ |
| View activity logs | ✅ | ✅ | ✅ |

### Next Implementation Steps

1. **Organization Onboarding Flow**
   - Create org on signup
   - Invite team members

2. **Project CRUD Operations**
   - Create/edit projects
   - Project settings

3. **Ticket CRUD Operations**
   - Create ticket (manual + AI)
   - Ticket detail page
   - Comments and attachments

4. **Sprint Management**
   - Create/manage sprints
   - Sprint planning view

5. **Real-time Updates**
   - Ticket status changes
   - Comments

6. **Advanced AI Features**
   - Bulk triage
   - Sprint planning assistant
   - Burndown predictions
