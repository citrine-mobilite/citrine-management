import React from 'react';
import {
  Flag,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowUpRight,
} from 'lucide-react';
import { AppUser, Employee, StrategicProject } from '../../types';
import { canManageStrategicProjects } from '../../services/projectService';
import { ProjectCard } from './ProjectCard';
import { ProjectCompactTable } from './ProjectCompactTable';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectMilestonesModal } from './ProjectMilestonesModal';
import {
  ProjectFilterStatus,
  ProjectSortBy,
  useProjectDirectory,
} from './useProjectDirectory';

interface ProjectMilestonesWidgetProps {
  projects: StrategicProject[];
  onUpdateProjects?: (updated: StrategicProject[]) => void;
  currentUser: AppUser | null;
  employees: Employee[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  defaultFilter?: ProjectFilterStatus;
  compactOnHome?: boolean;
  onOpenProjectsTab?: () => void;
}

export const ProjectMilestonesWidget: React.FC<ProjectMilestonesWidgetProps> = ({
  projects = [],
  onUpdateProjects,
  currentUser,
  employees = [],
  showToast,
  defaultFilter = 'active' as ProjectFilterStatus,
  compactOnHome = false,
  onOpenProjectsTab,
}) => {
  const canManage = canManageStrategicProjects(currentUser);
  const directory = useProjectDirectory({
    projects,
    onUpdateProjects,
    showToast,
    defaultFilter,
    compactOnHome,
  });

  const startItem = (directory.currentPage - 1) * directory.pageSize + 1;
  const endItem = Math.min(
    directory.filteredCount,
    directory.currentPage * directory.pageSize
  );

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#2A7B76] shrink-0" />
              <span className="truncate">Projets Stratégiques &amp; Jalons</span>
              <span className="font-mono tabular-nums text-xs font-semibold text-stone-500">
                {directory.filteredCount}
              </span>
            </h3>
          </div>

          {compactOnHome && onOpenProjectsTab && projects.length > 0 && (
            <button
              type="button"
              onClick={onOpenProjectsTab}
              className="xl:hidden text-xs font-semibold text-[#2A7B76] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Tout voir</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {projects.length > 0 && (
            <div className="relative flex-1 sm:flex-initial min-w-[165px]">
              <Search className="h-3.5 w-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={directory.searchQuery}
                onChange={(e) => directory.setSearchQuery(e.target.value)}
                placeholder="Filtrer..."
                className="w-full sm:w-44 pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>
          )}

          <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80">
            {[
              { id: 'active', label: 'Actifs' },
              { id: 'on_hold', label: 'Pause' },
              { id: 'completed', label: 'Terminés' },
              { id: 'all', label: 'Tous' },
            ].map((tab) => {
              const active = directory.filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => directory.setFilter(tab.id as ProjectFilterStatus)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                    active ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {!compactOnHome && projects.length > 1 && (
            <select
              value={directory.sortBy}
              onChange={(e) => directory.setSortBy(e.target.value as ProjectSortBy)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-700 outline-none cursor-pointer focus:border-[#2A7B76]"
              aria-label="Trier les projets"
            >
              <option value="recent">Récents</option>
              <option value="progress">Avancement</option>
              <option value="name">Nom (A–Z)</option>
            </select>
          )}

          <div className="flex items-center gap-0.5 p-0.5 bg-stone-100 rounded-lg border border-stone-200/80">
            <button
              type="button"
              onClick={() => directory.setViewMode('list')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                directory.viewMode === 'list' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Vue liste compacte"
              aria-label="Vue liste compacte"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => directory.setViewMode('grid')}
              className={`p-1.5 rounded-md transition cursor-pointer ${
                directory.viewMode === 'grid' ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Vue cartes compactes"
              aria-label="Vue cartes compactes"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={directory.openCreateForm}
              className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nouveau projet</span>
            </button>
          )}
        </div>
      </div>

      {directory.paginatedProjects.length === 0 ? (
        <div className="py-6 px-4 text-center space-y-2 border border-dashed border-stone-200 rounded-xl bg-stone-50/50">
          <p className="text-xs sm:text-sm font-medium text-stone-600">
            {directory.searchQuery
              ? 'Aucun projet ne correspond à votre recherche.'
              : directory.filter === 'completed'
                ? 'Aucun projet terminé.'
                : directory.filter === 'on_hold'
                  ? 'Aucun projet en pause.'
                  : 'Aucun projet stratégique suivi pour le moment.'}
          </p>
          {canManage && !directory.searchQuery && directory.filter !== 'completed' && (
            <button
              type="button"
              onClick={directory.openCreateForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Créer un premier projet</span>
            </button>
          )}
        </div>
      ) : directory.viewMode === 'list' ? (
        <ProjectCompactTable
          projects={directory.paginatedProjects}
          canManage={canManage}
          onSelect={directory.setSelectedProjectId}
          onEdit={directory.openEditForm}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {directory.paginatedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={canManage}
              onSelect={directory.setSelectedProjectId}
              onEdit={directory.openEditForm}
            />
          ))}
        </div>
      )}

      {(directory.totalPages > 1 || (compactOnHome && onOpenProjectsTab && directory.filteredCount > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
          <span className="font-mono tabular-nums">
            {directory.filteredCount > 0
              ? `${startItem}–${endItem} sur ${directory.filteredCount} projet(s)`
              : '0 projet'}
          </span>

          <div className="flex items-center gap-3">
            {compactOnHome && onOpenProjectsTab && (
              <button
                type="button"
                onClick={onOpenProjectsTab}
                className="text-xs font-semibold text-[#2A7B76] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>Gérer tous les projets ({projects.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}

            {directory.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={directory.currentPage <= 1}
                  onClick={() => directory.setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono tabular-nums px-1.5 text-stone-700 font-semibold">
                  {directory.currentPage}/{directory.totalPages}
                </span>
                <button
                  type="button"
                  disabled={directory.currentPage >= directory.totalPages}
                  onClick={() => directory.setCurrentPage((p) => Math.min(directory.totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ProjectMilestonesModal
        project={directory.selectedProject}
        onClose={() => directory.setSelectedProjectId(null)}
        canManage={canManage}
        employees={employees}
        onSaveProject={directory.handleSaveProject}
        onEditProject={directory.openEditForm}
        onDeleteProject={directory.handleDeleteProject}
      />

      <ProjectFormModal
        isOpen={directory.isFormOpen}
        onClose={directory.closeForm}
        editingProject={directory.editingProject}
        employees={employees}
        currentUser={currentUser}
        onSave={directory.handleSaveProject}
      />
    </section>
  );
};
