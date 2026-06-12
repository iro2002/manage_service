import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

/**
 * Get base OpenProject URL and Basic-Auth header.
 * OpenProject API uses: Authorization: Basic base64("apikey:<TOKEN>")
 */
function getOpenProjectConfig() {
  const baseUrl = process.env.OPENPROJECT_URL?.replace(/\/$/, '');
  const token = process.env.OPENPROJECT_TOKEN;
  if (!baseUrl || !token || token === 'your_openproject_token_here' || token === '') {
    throw new Error('OpenProject is not configured. Please set OPENPROJECT_URL and OPENPROJECT_TOKEN in .env');
  }
  const basicAuth = Buffer.from(`apikey:${token}`).toString('base64');
  return {
    baseUrl: `${baseUrl}/api/v3`,
    siteUrl: baseUrl,
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Fetch all pages from an OpenProject HAL+JSON paginated endpoint.
 * Response shape: { total, count, pageSize, offset, _embedded: { elements: [] } }
 * offset starts at 1.
 */
async function fetchAllPages(baseUrl, headers, path) {
  let results = [];
  const pageSize = 100;
  let offset = 1;

  while (true) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${baseUrl}${path}${sep}pageSize=${pageSize}&offset=${offset}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenProject API error (${res.status}): ${errText.slice(0, 400)}`);
    }

    const data = await res.json();
    const elements = data?._embedded?.elements;
    if (!Array.isArray(elements) || elements.length === 0) break;

    results = results.concat(elements);

    const total = data.total ?? 0;
    if (results.length >= total) break;
    offset += 1; // OpenProject 'offset' is actually the page number (starts at 1)
  }

  return results;
}

/**
 * Extract roles from a membership.
 * REAL API: roles are in _links.roles as [{href, title}, ...]
 * NOT in _embedded (the _embedded is empty on memberships collection).
 */
function extractRoles(membership) {
  // Primary source: _links.roles array
  const linkRoles = membership._links?.roles;
  if (Array.isArray(linkRoles) && linkRoles.length > 0) {
    return linkRoles.map(r => r.title).filter(Boolean);
  }
  // Fallback: _embedded.roles (individual membership endpoint)
  const embRoles = membership._embedded?.roles;
  if (Array.isArray(embRoles) && embRoles.length > 0) {
    return embRoles.map(r => r.name || r.title).filter(Boolean);
  }
  return ['Member'];
}

/**
 * Determine the principal type from the href.
 * /api/v3/users/5        → User
 * /api/v3/groups/3       → Group
 * /api/v3/placeholder_users/1 → Placeholder
 */
function principalType(href) {
  if (!href) return 'User';
  if (href.includes('/groups/')) return 'Group';
  if (href.includes('/placeholder_users/')) return 'Placeholder';
  return 'User';
}

/**
 * Normalise project status from _links.status.title or p.status string.
 * Returns one of: on_track | at_risk | off_track | finished | discontinued | not_started
 */
function normaliseStatus(p) {
  // Try top-level status string first (some OP versions)
  const direct = typeof p.status === 'string' ? p.status.toLowerCase() : '';
  // Try _links.status.title (HAL representation)
  const linkTitle = (p._links?.status?.title || '').toLowerCase();
  const raw = direct || linkTitle;

  if (!raw) return 'on_track';
  if (raw === 'on_track' || raw.includes('on track')) return 'on_track';
  if (raw === 'at_risk'  || raw.includes('at risk'))  return 'at_risk';
  if (raw === 'off_track'|| raw.includes('off track')) return 'off_track';
  if (raw === 'finished' || raw.includes('finish'))    return 'finished';
  if (raw === 'discontinued' || raw.includes('discontinu')) return 'discontinued';
  if (raw === 'not_started' || raw.includes('not start')) return 'not_started';
  return 'on_track';
}

// ─── GET /api/openproject/status ─────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    const { baseUrl, headers } = getOpenProjectConfig();
    const response = await fetch(`${baseUrl}/`, { headers });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
    }
    const data = await response.json();
    res.json({
      connected: true,
      version: data.coreVersion || 'Unknown',
      instanceName: data.instanceName || '',
    });
  } catch (err) {
    console.error('[OpenProject] /status error:', err.message);
    res.status(500).json({ connected: false, error: err.message });
  }
});

// ─── GET /api/openproject/projects ───────────────────────────────────────────
router.get('/projects', async (req, res) => {
  try {
    const { baseUrl, siteUrl, headers } = getOpenProjectConfig();

    // sortBy must be URL-encoded JSON
    const path = '/projects?sortBy=' + encodeURIComponent('[["name","asc"]]');
    const projects = await fetchAllPages(baseUrl, headers, path);

    const mapped = projects.map(p => {
      // description is a FormattableAttribute: { format, raw, html }
      const description = p.description?.raw ?? (typeof p.description === 'string' ? p.description : '');

      // parent project: read from _links.parent (href may be null)
      const parentHref = p._links?.parent?.href;
      const parentId   = parentHref ? parseInt(parentHref.split('/').pop(), 10) || null : null;
      const parentName = p._links?.parent?.title || null;

      return {
        id:          p.id,
        name:        p.name,
        identifier:  p.identifier,
        description,
        status:      normaliseStatus(p),
        active:      p.active !== false,
        public:      p.public ?? false,
        createdAt:   p.createdAt,
        updatedAt:   p.updatedAt,
        web_url:     `${siteUrl}/projects/${p.identifier}`,
        parentId,
        parentName,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error('[OpenProject] /projects error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/openproject/projects/:id/members ───────────────────────────────
router.get('/projects/:id/members', async (req, res) => {
  try {
    const { baseUrl, siteUrl, headers } = getOpenProjectConfig();
    const projectId = req.params.id;

    const filter = encodeURIComponent(
      JSON.stringify([{ project: { operator: '=', values: [String(projectId)] } }])
    );
    const memberships = await fetchAllPages(baseUrl, headers, `/memberships?filters=${filter}`);

    const mapped = memberships.map(m => {
      const roles        = extractRoles(m);
      const principalHref = m._links?.principal?.href || '';
      const type         = principalType(principalHref);

      // Build a readable profile URL from the API href
      // /api/v3/users/5 → /users/5  (web path)
      const webPath = principalHref.replace('/api/v3', '');

      return {
        id:          m.id,
        name:        m._links?.principal?.title || 'Unknown',
        href:        principalHref,
        type,
        roles,
        primary_role: roles[0] || 'Member',
        createdAt:   m.createdAt,
        web_url:     principalHref ? `${siteUrl}${webPath}` : null,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error('[OpenProject] /projects/:id/members error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/openproject/users ──────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { baseUrl, siteUrl, headers } = getOpenProjectConfig();
    const { search = '' } = req.query;

    // OpenProject user status values: 0=anonymous, 1=active, 2=registered, 3=locked, 4=invited
    // The filter expects string names on some versions, e.g. 'active'
    const filters = [{ status: { operator: '=', values: ['active'] } }];
    if (search) filters.push({ name: { operator: '~', values: [search] } });

    const path = `/users?filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const users = await fetchAllPages(baseUrl, headers, path);

    const mapped = users.map(u => ({
      id:         u.id,
      name:       u.name,
      login:      u.login,
      email:      u.email,
      avatar_url: u.avatar || null,
      status:     u.status,
      web_url:    `${siteUrl}/users/${u.id}`,
    }));

    res.json(mapped);
  } catch (err) {
    console.error('[OpenProject] /users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/openproject/users/:id/memberships ──────────────────────────────
router.get('/users/:id/memberships', async (req, res) => {
  try {
    const { baseUrl, siteUrl, headers } = getOpenProjectConfig();
    const userId = req.params.id;

    const filter = encodeURIComponent(
      JSON.stringify([{ principal: { operator: '=', values: [String(userId)] } }])
    );
    const memberships = await fetchAllPages(baseUrl, headers, `/memberships?filters=${filter}`);

    const mapped = memberships
      .filter(m => m._links?.project?.href)
      .map(m => {
        const roles      = extractRoles(m);
        const projectHref = m._links.project.href;
        // href: /api/v3/projects/12 → id = 12
        const projectId  = parseInt(projectHref.split('/').pop(), 10);

        return {
          membership_id:      m.id,
          project_id:         projectId,
          project_name:       m._links.project.title || '',
          project_identifier: m._links.project.identifier || '',
          roles,
          primary_role: roles[0] || 'Member',
          web_url: `${siteUrl}${projectHref.replace('/api/v3', '')}`,
        };
      });

    res.json(mapped);
  } catch (err) {
    console.error('[OpenProject] /users/:id/memberships error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/openproject/access-report ──────────────────────────────────────
router.get('/access-report', async (req, res) => {
  try {
    const { baseUrl, headers } = getOpenProjectConfig();

    // Fetch all projects and all memberships in parallel
    const [allProjects, allMemberships] = await Promise.all([
      fetchAllPages(baseUrl, headers, '/projects?sortBy=' + encodeURIComponent('[["name","asc"]]')),
      fetchAllPages(baseUrl, headers, '/memberships'),
    ]);

    // Project lookup: "162" → { id, name, identifier }
    const projectMap = new Map(
      allProjects.map(p => [String(p.id), { id: p.id, name: p.name, identifier: p.identifier }])
    );

    const rows = [];
    for (const m of allMemberships) {
      const projectHref = m._links?.project?.href || '';
      const projectId   = projectHref.split('/').pop();
      const project     = projectMap.get(projectId);
      if (!project) continue;

      const roles         = extractRoles(m);
      const principalHref = m._links?.principal?.href || '';

      rows.push({
        project_id:   project.id,
        project_name: project.name,
        identifier:   project.identifier,
        member_id:    m.id,
        member_name:  m._links?.principal?.title || 'Unknown',
        member_type:  principalType(principalHref),
        roles,
        primary_role: roles[0] || 'Member',
        createdAt:    m.createdAt,
      });
    }

    rows.sort((a, b) => {
      const proj = a.project_name.localeCompare(b.project_name);
      return proj !== 0 ? proj : a.member_name.localeCompare(b.member_name);
    });

    res.json({
      rows,
      total_projects: allProjects.length,
      total_entries:  rows.length,
    });
  } catch (err) {
    console.error('[OpenProject] /access-report error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
