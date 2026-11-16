import { useEffect, useMemo, useState } from 'react';
import { StrategicProject } from '../../types';
import { computeProjectProgress, deleteStrategicProject, saveStrategicProject } from '../../services/projectService';
import { logSystemAudit } from '../../services/adminAuditService';
import { executeDeleteWithSweetAlert, executeOperationWithLoading } from '../../utils/sweetAlert';

export type ProjectFilterStatus = 'active' | 'on_hold' | 'completed' | 'all';
export type ProjectViewMode = 'list' | 'grid';
export type ProjectSortBy = 'recent' | 'progress' | 'name';

interface UseProjectDirectoryParams {
  projects: StrategicProject[];
  onUpdateProjects?: (updated: StrategicProject[]) => Promise<void> | void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  defaultFilter?: ProjectFilterStatus;
  compactOnHome?: boolean;
}

export function useProjectDirectory({
  projects,
  onUpdateProjects,
  defaultFilter = 'active',
  compactOnHome = false,
}: UseProjectDirectoryParams) {
  const [filter, setFilter] = useState<ProjectFilterStatus>(defaultFilter);
  const [viewMode, setViewMode] = useState<ProjectViewMode>(
    compactOnHome || projects.length > 6 ? 'list' : 'grid'
  );
  const [sortBy, setSortBy] = useState<ProjectSortBy>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<StrategicProject | null>(null);

  const pageSize = compactOnHome
    ? (viewMode === 'list' ? 5 : 3)
    : (viewMode === 'list' ? 8 : 6);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      if (filter !== 'all' && p.status !== filter) return false;
      if (!query) return true;
      const inName = p.name.toLowerCase().includes(query);
      const inDesc = (p.description || '').toLowerCase().includes(query);
      const inMilestones = (p.milestones || []).some(
        (m) => m.title.toLowerCase().includes(query) || (m.ownerName || '').toLowerCase().includes(query)
      );
      return inName || inDesc || inMilestones;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'fr');
      if (sortBy === 'progress') {
        return computeProjectProgress(b).percent - computeProjectProgress(a).percent;
      }
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });
  }, [projects, filter, searchQuery, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, viewMode, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const handleSaveProject = async (project: StrategicProject) => {
    const existsBefore = projects.some((p) => p.id === project.id);
    await executeOperationWithLoading({
      loadingTitle: existsBefore ? 'Mise à jour du projet...' : 'Création du projet...',
      loadingText: `Enregistrement de "${project.name}", veuillez patienter...`,
      action: async () => {
        const saved = await saveStrategicProject(project);
        if (onUpdateProjects) {
          const exists = projects.some((p) => p.id === saved.id);
          const nextList = exists
            ? projects.map((p) => (p.id === saved.id ? saved : p))
            : [saved, ...projects];
          await onUpdateProjects(nextList);
        }
        logSystemAudit({
          targetName: saved.name,
          operationType: 'tache_projet',
          operationLabel: existsBefore ? 'Modification Projet Stratégique' : 'Création Projet Stratégique',
          details: `Projet "${saved.name}" ${existsBefore ? 'mis à jour' : 'créé'} (Statut: ${saved.status}, Jalons: ${(saved.milestones || []).length}).`,
          level: 'success',
        });
      },
      successTitle: existsBefore ? 'Projet mis à jour !' : 'Projet créé !',
      successMessage: `Le projet « ${project.name} » a été ${existsBefore ? 'mis à jour' : 'créé'} avec succès.`,
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    const removed = projects.find((p) => p.id === projectId);
    await executeDeleteWithSweetAlert({
      title: 'Supprimer ce projet ?',
      text: 'Voulez-vous vraiment supprimer ce projet stratégique ?',
      itemName: removed?.name,
      action: async () => {
        await deleteStrategicProject(projectId);
        if (onUpdateProjects) {
          await onUpdateProjects(projects.filter((p) => p.id !== projectId));
        }
        logSystemAudit({
          targetName: removed?.name || projectId,
          operationType: 'tache_projet',
          operationLabel: 'Suppression Projet Stratégique',
          details: `Projet supprimé : "${removed?.name || projectId}".`,
          level: 'warning',
        });
      },
      successTitle: 'Projet supprimé !',
      successMessage: removed?.name ? `Le projet « ${removed.name} » a été supprimé.` : 'Le projet a été supprimé.',
    });
  };

  const openCreateForm = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const openEditForm = (project: StrategicProject) => {
    setSelectedProjectId(null);
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
  };

  return {
    filter,
    setFilter,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    filteredCount: filteredProjects.length,
    paginatedProjects,
    selectedProject,
    setSelectedProjectId,
    isFormOpen,
    editingProject,
    openCreateForm,
    openEditForm,
    closeForm,
    handleSaveProject,
    handleDeleteProject,
  };
}
