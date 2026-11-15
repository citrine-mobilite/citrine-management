import React, { useMemo, useState } from 'react';
import {
  Flag,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Circle,
  PauseCircle,
} from 'lucide-react';
import { AppUser, Employee, StrategicProject } from '../../types';
import {
  canManageStrategicProjects,
  computeProjectProgress,
  deleteStrategicProject,
  formatShortFrenchDate,
  getNextMilestone,
  MILESTONE_STATUS_META,
  PROJECT_STATUS_META,
  saveStrategicProject,
} from '../../services/projectService';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectMilestonesModal } from './ProjectMilestonesModal';

interface ProjectMilestonesWidgetProps {
  projects: StrategicProject[];
  onUpdateProjects?: (updated: StrategicProject[]) => void;
  currentUser: AppUser | null;
  employees: Employee[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  defaultFilter?: 'active' | 'all' | 'completed';
}

export const ProjectMilestonesWidget: React.FC<ProjectMilestonesWidgetProps> = ({
  projects = [],
  onUpdateProjects,
  currentUser,
  employees = [],
  showToast,
  defaultFilter = 'active',
}) => {
  const [filter, setFilter] = useState<'active' | 'all' | 'completed'>(defaultFilter);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<StrategicProject | null>(null);

  const canManage = canManageStrategicProjects(currentUser);

  const filteredProjects = useMemo(() => {
    const sorted = [...projects].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    if (filter === 'active') return sorted.filter((p) => p.status !== 'completed');
    if (filter === 'completed') return sorted.filter((p) => p.status === 'completed');
    return sorted;
  }, [projects, filter]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const handleSaveProject = async (project: StrategicProject) => {
    const saved = await saveStrategicProject(project);
    if (onUpdateProjects) {
      const exists = projects.some((p) => p.id === saved.id);
      const nextList = exists
        ? projects.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...projects];
      onUpdateProjects(nextList);
    }
    showToast?.(`Projet « ${saved.name} » enregistré.`, 'success');
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteStrategicProject(projectId);
    if (onUpdateProjects) {
      onUpdateProjects(projects.filter((p) => p.id !== projectId));
    }
    showToast?.('Projet supprimé.', 'info');
  };

  const renderProjectStatusIcon = (status: StrategicProject['status']) => {
    if (status === 'completed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
    if (status === 'on_hold') return <PauseCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
    return <Clock className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />;
  };

  const renderMilestoneIcon = (status: string) => {
    if (status === 'done') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
    if (status === 'in_progress') return <Clock className="h-3.5 w-3.5 text-[#2A7B76] shrink-0" />;
    if (status === 'blocked') return <AlertOctagon className="h-3.5 w-3.5 text-rose-600 shrink-0" />;
    return <Circle className="h-3.5 w-3.5 text-stone-400 shrink-0" />;
  };

  return (
    <section className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/70 pb-4">
        <div className="min-w-0">
          <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
            <Flag className="h-4.5 w-4.5 text-[#2A7B76] shrink-0" />
            <span>Évolution des Projets &amp; Prochains Jalons</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Suivi stratégique des grands chantiers et de la prochaine étape clé à franchir
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          {/* Segmented filter */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/70">
            {[
              { id: 'active', label: 'Actifs' },
              { id: 'all', label: 'Tous' },
              { id: 'completed', label: 'Terminés' },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nouveau projet</span>
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="py-8 px-4 text-center space-y-3 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
          <p className="text-sm font-semibold text-stone-700">
            {filter === 'completed'
              ? 'Aucun projet terminé pour le moment.'
              : 'Aucun projet stratégique suivi pour le moment.'}
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Ajoutez vos projets phares (ex. Hero) avec leurs jalons clés pour offrir à toute l’équipe une lecture directe de la progression et du prochain cap.
          </p>
          {canManage && filter !== 'completed' && (
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Créer un premier projet</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const { doneCount, totalCount, percent } = computeProjectProgress(project);
            const nextMilestone = getNextMilestone(project);
            const projStatusMeta = PROJECT_STATUS_META[project.status || 'active'];

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedProjectId(project.id);
                  }
                }}
                className="p-4 sm:p-5 rounded-2xl border border-stone-200/90 bg-white hover:border-[#2A7B76]/50 transition cursor-pointer flex flex-col justify-between space-y-4 text-left focus-visible:outline-2 focus-visible:outline-[#2A7B76]"
              >
                {/* Project title + progress */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-base text-stone-900 truncate">
                        {project.name}
                      </h4>
                      {project.description && (
                        <p className="text-xs text-stone-500 truncate mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                      {renderProjectStatusIcon(project.status)}
                      <span className={projStatusMeta.textClass}>{projStatusMeta.label}</span>
                    </div>
                  </div>

                  {/* Progress bar & tabular count */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Avancement global</span>
                      <span className="font-mono tabular-nums font-bold text-stone-800">
                        {percent}% <span className="text-stone-400 font-normal">·</span> {doneCount}/{totalCount} jalons
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          percent === 100 ? 'bg-emerald-600' : 'bg-[#2A7B76]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Next Milestone Divider Section */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-[11px] font-bold text-stone-400 block">
                      Prochain jalon
                    </span>
                    {nextMilestone ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900">
                          {renderMilestoneIcon(nextMilestone.status)}
                          <span className="truncate">{nextMilestone.title}</span>
                        </div>
                        <div className="text-xs text-stone-500 flex flex-wrap items-center gap-1.5">
                          <span className={MILESTONE_STATUS_META[nextMilestone.status].textClass}>
                            {MILESTONE_STATUS_META[nextMilestone.status].label}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatShortFrenchDate(nextMilestone.targetDate)}
                          </span>
                          {nextMilestone.ownerName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate max-w-[160px]">
                                {nextMilestone.ownerName}
                              </span>
                            </>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Tous les jalons sont terminés</span>
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-[#2A7B76] inline-flex items-center gap-0.5 shrink-0">
                    <span>Jalons</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail & Milestones Management Modal */}
      <ProjectMilestonesModal
        project={selectedProject}
        onClose={() => setSelectedProjectId(null)}
        canManage={canManage}
        employees={employees}
        onSaveProject={handleSaveProject}
        onEditProject={(proj) => {
          setSelectedProjectId(null);
          setEditingProject(proj);
          setIsFormOpen(true);
        }}
        onDeleteProject={handleDeleteProject}
      />

      {/* Create / Edit Project Form Modal */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
        }}
        editingProject={editingProject}
        employees={employees}
        currentUser={currentUser}
        onSave={handleSaveProject}
      />
    </section>
  );
};
