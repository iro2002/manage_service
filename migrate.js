import fs from 'fs';
import path from 'path';

const classMap = {
  // Layouts
  'app-layout': 'flex h-screen overflow-hidden',
  'main-content': 'flex-1 flex flex-col overflow-hidden transition-[margin-left] duration-300',
  'page-body': 'flex-1 overflow-y-auto px-8 py-7 bg-bg-primary',
  'topbar': 'h-[64px] bg-bg-card border-b border-border-light flex items-center justify-between px-8 shrink-0',
  'topbar-title': 'text-lg font-bold text-text-primary flex items-center gap-2.5',

  // Sidebar
  'sidebar': 'fixed top-0 left-0 h-screen bg-bg-sidebar border-r border-border-light flex flex-col z-[100] overflow-hidden',
  'sidebar-logo': 'border-b border-border-light flex items-center gap-3',
  'sidebar-logo-icon': 'w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-md flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)] shrink-0',
  'sidebar-logo-text h2': 'text-[14px] font-bold text-text-primary tracking-[0.3px]',
  'sidebar-logo-text span': 'text-[11px] text-text-muted tracking-[0.5px] uppercase',
  'sidebar-logo-text': 'flex flex-col',
  'sidebar-nav': 'flex-1 px-3 py-5 flex flex-col gap-1',
  'nav-section-label': 'text-[10px] font-semibold text-text-muted tracking-widest uppercase px-2 pt-3 pb-1.5',
  'nav-link': 'flex items-center gap-3 px-3 py-2.5 rounded-md text-text-secondary no-underline text-[14px] font-medium transition-all duration-200 cursor-pointer border border-transparent bg-transparent w-full text-left hover:bg-bg-hover hover:text-text-primary',
  'nav-link active': 'bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 text-accent-light border-indigo-500/25',
  'nav-icon': 'w-[18px] h-[18px] shrink-0',
  'sidebar-footer': 'px-3 py-4 border-t border-border-light',
  'sidebar-user': 'flex items-center gap-2.5 p-2.5 rounded-md bg-bg-input mb-2',
  'sidebar-avatar': 'w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-xs font-bold text-white shrink-0',
  'sidebar-user-info': 'flex-1 overflow-hidden flex flex-col',

  // Stats
  'stats-grid': 'grid grid-cols-4 gap-4 mb-7',
  'stat-card': 'bg-bg-card border border-border-light rounded-[14px] px-6 py-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-border-theme',
  'stat-card available': 'bg-bg-card border border-border-light rounded-[14px] px-6 py-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-border-theme before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-status-available',
  'stat-card assigned': 'bg-bg-card border border-border-light rounded-[14px] px-6 py-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-border-theme before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-accent',
  'stat-card hr': 'bg-bg-card border border-border-light rounded-[14px] px-6 py-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-border-theme before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-status-hr',
  'stat-card vendor': 'bg-bg-card border border-border-light rounded-[14px] px-6 py-5 flex items-center gap-4 transition-all duration-200 relative overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:border-border-theme before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-status-vendor',
  'stat-icon': 'w-12 h-12 rounded-md flex items-center justify-center shrink-0',
  'stat-icon available': 'w-12 h-12 rounded-md flex items-center justify-center shrink-0 bg-status-available-bg text-status-available',
  'stat-icon assigned': 'w-12 h-12 rounded-md flex items-center justify-center shrink-0 bg-status-assigned-bg text-status-assigned',
  'stat-icon hr': 'w-12 h-12 rounded-md flex items-center justify-center shrink-0 bg-status-hr-bg text-status-hr',
  'stat-icon vendor': 'w-12 h-12 rounded-md flex items-center justify-center shrink-0 bg-status-vendor-bg text-status-vendor',
  'stat-info': 'flex flex-col',

  // Table Toolbar
  'table-toolbar': 'flex items-center justify-between px-6 py-5 border-b border-border-light gap-4 flex-wrap',
  'table-toolbar-left': 'flex items-center gap-3 flex-1',
  'search-box': 'relative flex-1 max-w-[340px]',
  'search-icon': 'absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none',
  'filter-select': 'bg-bg-input border border-border-light rounded-[10px] px-3.5 py-2.5 text-text-secondary text-[13px] outline-none cursor-pointer transition-all duration-200 focus:border-accent focus:ring-3 focus:ring-accent-glow',

  // Modals
  'modal-overlay': 'fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-5 animate-[fadeIn_0.2s_ease]',
  'modal': 'bg-bg-modal border border-border-light rounded-[20px] w-full max-w-[540px] max-h-[90vh] overflow-y-auto shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(99,102,241,0.15)] animate-[slideUp_0.25s_ease]',
  'modal-header': 'flex items-center justify-between px-7 py-5 border-b border-border-light',
  'modal-header-icon': 'w-8 h-8 rounded-md bg-accent-glow border border-border-theme flex items-center justify-center text-accent-light shrink-0',
  'modal-body': 'px-7 py-6',
  'modal-footer': 'flex items-center justify-end gap-2.5 px-7 py-4 border-t border-border-light',
  
  // Forms
  'form-grid': 'grid grid-cols-2 gap-4',
  'form-group': 'flex flex-col gap-1.5',
  'form-group full-width': 'flex flex-col gap-1.5 col-span-full',

  // Login
  'login-page': 'flex items-center justify-center min-h-screen relative overflow-hidden bg-bg-primary',
  'login-card': 'relative z-10 w-full max-w-[400px] bg-bg-card border border-border-light p-10 rounded-[20px] shadow-[0_8px_40px_rgba(0,0,0,0.6)]',
  'login-logo': 'w-[56px] h-[56px] mx-auto mb-6 bg-gradient-to-br from-accent to-accent-dark rounded-[14px] flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]',
  'login-heading': 'text-center mb-8',
  'login-form': 'flex flex-col gap-5',
  'login-error': 'flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] rounded-md',
  'login-footer': 'mt-8 text-center text-[12px] text-text-muted',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      for (const [oldClass, newClass] of Object.entries(classMap)) {
        content = content.replace(
          new RegExp('className="' + oldClass + '"', 'g'),
          'className="' + newClass + '"'
        );
        content = content.replace(
          new RegExp('className="' + oldClass + ' ', 'g'),
          'className="' + newClass + ' '
        );
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDirectory('./src');
console.log('Migration complete');
