import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

// Returns public system configuration for the dashboard home page
router.get('/', (req, res) => {
  const tools = [
    {
      key: 'phpmyadmin',
      label: 'phpMyAdmin',
      description: 'MySQL database management',
      url: process.env.TOOL_PHPMYADMIN_URL || '',
      color: '#f97316',
      category: 'Database',
    },
    {
      key: 'grafana',
      label: 'Grafana',
      description: 'Metrics & analytics dashboards',
      url: process.env.TOOL_GRAFANA_URL || '',
      color: '#f59e0b',
      category: 'Monitoring',
    },
    {
      key: 'prometheus',
      label: 'Prometheus',
      description: 'Systems monitoring & alerting',
      url: process.env.TOOL_PROMETHEUS_URL || '',
      color: '#ef4444',
      category: 'Monitoring',
    },
    {
      key: 'zabbix',
      label: 'Zabbix',
      description: 'Enterprise network monitoring',
      url: process.env.TOOL_ZABBIX_URL || '',
      color: '#dc2626',
      category: 'Monitoring',
    },
    {
      key: 'gitlab',
      label: 'GitLab',
      description: 'Source code & CI/CD',
      url: process.env.TOOL_GITLAB_URL || process.env.GITLAB_URL || '',
      color: '#e24329',
      category: 'Development',
    },
    {
      key: 'gitea',
      label: 'Gitea',
      description: 'Lightweight Git service',
      url: process.env.TOOL_GITEA_URL || '',
      color: '#609926',
      category: 'Development',
    },
  ].filter(t => t.url); // only include tools with URLs configured

  res.json({
    company: process.env.COMPANY_NAME || 'Manage Service',
    tools,
  });
});

export default router;
