# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-20-critical-issues-linear-integration/spec.md

## Linear MCP Integration Endpoints

### Issue Management Operations

**Purpose:** Core Linear MCP operations for critical issue tracking
**Integration:** Automated workflows for issue lifecycle management

#### Create Critical Issue
- **MCP Function:** `mcp__linear-server__create_issue`
- **Purpose:** Automatically create issues for discovered critical problems
- **Parameters:** title, team, priority, labels, description, state
- **Priority Mapping:** 🚨 Priority 1 (Urgent), 🔥 Priority 2 (High), ⭐ Priority 3 (Normal)
- **Auto-Labels:** launch-blocking, pre-launch, nice-to-have based on impact assessment

#### Update Issue Status  
- **MCP Function:** `mcp__linear-server__update_issue`
- **Purpose:** Sync resolution progress and status changes
- **Parameters:** id, state, assignee, estimate, description updates
- **Workflow Integration:** Automatic updates from development workflow completion

#### Issue Comment Integration
- **MCP Function:** `mcp__linear-server__create_comment`
- **Purpose:** Document investigation steps, testing results, and resolution details
- **Parameters:** issueId, body (markdown-formatted progress updates)
- **Automated Comments:** Testing results, resolution verification, completion confirmation

### Critical Issue Workflow Endpoints

#### Issue Status Tracking
- **MCP Function:** `mcp__linear-server__list_issues`
- **Purpose:** Query current critical issue status for launch readiness assessment
- **Filters:** team, state, priority, labels (launch-blocking, pre-launch)
- **Reporting:** Automated launch readiness calculation based on critical issue resolution

#### Issue Assignment and Management
- **MCP Function:** `mcp__linear-server__list_my_issues`
- **Purpose:** Track assigned critical issues for individual team members
- **Priority Handling:** Focus on launch-blocking issues first, then pre-launch, then nice-to-have

## Integration Workflow Processes

### Automatic Issue Creation Workflow
1. Critical issue discovered during testing/development
2. Automated priority assessment based on launch impact
3. Linear issue creation with proper priority, labels, and team assignment
4. Notification and assignment to appropriate team member

### Resolution Verification Workflow  
1. Issue resolution claimed by developer
2. Automated testing verification of fix in live environment
3. Linear issue status update with test results documentation
4. Final completion confirmation and issue closure

### Launch Readiness Assessment
1. Query all issues with launch-blocking and pre-launch labels
2. Calculate resolution percentage for critical path issues
3. Generate launch readiness report with blocking issue details
4. Automated status updates for stakeholder visibility