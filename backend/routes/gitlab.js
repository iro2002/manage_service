import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * Get base GitLab URL and headers for API requests.
 */
function getGitlabConfig() {
  const baseUrl = process.env.GITLAB_URL?.replace(/\/$/, '');
  const token = process.env.GITLAB_TOKEN;
  if (!baseUrl || !token || token === 'your_gitlab_admin_pat_here') {
    throw new Error('GitLab is not configured. Please set GITLAB_URL and GITLAB_TOKEN in .env');
  }
  return {
    baseUrl: `${baseUrl}/api/v4`,
    headers: {
      'PRIVATE-TOKEN': token,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Fetch all pages from a GitLab paginated endpoint.
 */
async function fetchAllPages(url, headers) {
  let results = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const separator = url.includes('?') ? '&' : '?';
    const pageUrl = `${url}${separator}per_page=${perPage}&page=${page}`;
    
    const res = await fetch(pageUrl, { headers });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GitLab API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    results = results.concat(data);

    const totalPages = parseInt(res.headers.get('x-total-pages') || '1', 10);
    if (page >= totalPages) break;
    page++;
  }

  return results;
}

// ─── Access Level Map ─────────────────────────────────────────────────────────
const ACCESS_LEVEL_MAP = {
  10: 'Guest',
  20: 'Reporter',
  30: 'Developer',
  40: 'Maintainer',
  50: 'Owner',
};

// ─── GET /api/gitlab/projects ─────────────────────────────────────────────────
// Returns all projects the admin token can see
router.get('/projects', async (req, res) => {
  try {
    const { baseUrl, headers } = getGitlabConfig();
    const { search = '', visibility = '', group_id = '' } = req.query;

    let url = `${baseUrl}/projects?membership=false&statistics=false&with_issues_enabled=false`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (visibility) url += `&visibility=${visibility}`;
    if (group_id) url += `&namespace_id=${group_id}`;

    const projects = await fetchAllPages(url, headers);

    const mapped = projects.map(p => ({
      id: p.id,
      name: p.name,
      name_with_namespace: p.name_with_namespace,
      path_with_namespace: p.path_with_namespace,
      namespace: p.namespace ? { id: p.namespace.id, name: p.namespace.name, kind: p.namespace.kind } : null,
      visibility: p.visibility,
      description: p.description,
      last_activity_at: p.last_activity_at,
      web_url: p.web_url,
      avatar_url: p.avatar_url,
      star_count: p.star_count,
      forks_count: p.forks_count,
      open_issues_count: p.open_issues_count,
      default_branch: p.default_branch,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('[GitLab] /projects error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/gitlab/projects/:id/members ────────────────────────────────────
// Returns all members (direct + inherited) for a project
router.get('/projects/:id/members', async (req, res) => {
  try {
    const { baseUrl, headers } = getGitlabConfig();
    const url = `${baseUrl}/projects/${req.params.id}/members/all`;
    const members = await fetchAllPages(url, headers);

    const mapped = members.map(m => ({
      id: m.id,
      name: m.name,
      username: m.username,
      avatar_url: m.avatar_url,
      web_url: m.web_url,
      access_level: m.access_level,
      access_label: ACCESS_LEVEL_MAP[m.access_level] || `Level ${m.access_level}`,
      expires_at: m.expires_at,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('[GitLab] /projects/:id/members error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/gitlab/groups ───────────────────────────────────────────────────
// Returns all top-level groups visible to the admin token
router.get('/groups', async (req, res) => {
  try {
    const { baseUrl, headers } = getGitlabConfig();
    const groups = await fetchAllPages(`${baseUrl}/groups?top_level_only=false`, headers);

    const mapped = groups.map(g => ({
      id: g.id,
      name: g.name,
      full_name: g.full_name,
      full_path: g.full_path,
      visibility: g.visibility,
      web_url: g.web_url,
      avatar_url: g.avatar_url,
      description: g.description,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('[GitLab] /groups error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/gitlab/status ───────────────────────────────────────────────────
// Quick connectivity check
router.get('/status', async (req, res) => {
  try {
    const { baseUrl, headers } = getGitlabConfig();
    const response = await fetch(`${baseUrl}/version`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json({ connected: true, version: data.version, revision: data.revision });
  } catch (err) {
    console.error('[GitLab] /status error:', err.message);
    res.status(500).json({ connected: false, error: err.message });
  }
});

// ─── GET /api/gitlab/users ───────────────────────────────────────────────────
// Returns all GitLab users on the server
router.get('/users', async (req, res) => {
  try {
    const { baseUrl, headers } = getGitlabConfig();
    const { search = '' } = req.query;
    let url = `${baseUrl}/users?active=true&humans=true`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const users = await fetchAllPages(url, headers);
    const mapped = users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar_url: u.avatar_url,
      web_url: u.web_url,
      state: u.state,
    }));
    res.json(mapped);
  } catch (err) {
    console.error('[GitLab] /users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/gitlab/users/:id/memberships ────────────────────────────────────
// Finds all repos a user is a member of by scanning project members.
// Works without admin/sudo — only needs read_api scope.
router.get('/users/:id/memberships', async (req, res) => {
  try {
    const { baseUrl, headers } = getGitlabConfig();
    const userId = parseInt(req.params.id, 10);

    // 1. Fetch all projects
    const allProjects = await fetchAllPages(`${baseUrl}/projects?simple=true`, headers);

    // 2. For each project, fetch members and check if user is in there
    // We run in batches of 10 to avoid hammering the API
    const userProjects = [];
    const BATCH = 10;

    for (let i = 0; i < allProjects.length; i += BATCH) {
      const batch = allProjects.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(async (project) => {
          try {
            const membersRes = await fetch(
              `${baseUrl}/projects/${project.id}/members/all?per_page=100`,
              { headers }
            );
            if (!membersRes.ok) return null;
            const members = await membersRes.json();
            const found = Array.isArray(members) && members.find(m => m.id === userId);
            if (found) {
              return {
                project_id: project.id,
                project_name: project.name,
                path_with_namespace: project.path_with_namespace,
                access_level: found.access_level,
                access_label: ACCESS_LEVEL_MAP[found.access_level] || `Level ${found.access_level}`,
              };
            }
            return null;
          } catch {
            return null;
          }
        })
      );
      results.forEach(r => { if (r) userProjects.push(r); });
    }

    res.json(userProjects);
  } catch (err) {
    console.error('[GitLab] /users/:id/memberships error:', err.message);
    res.status(500).json({ error: err.message });
  }
});



export default router;
