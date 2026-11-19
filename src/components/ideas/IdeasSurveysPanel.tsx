import React, { useState, useEffect } from 'react';
import { 
  IdeaSuggestion, 
  IdeaStatus, 
  EnterpriseSurvey, 
  AppUser, 
  Employee 
} from '../../types';
import { 
  subscribeToIdeas, 
  subscribeToSurveys, 
  saveIdea, 
  saveSurvey 
} from '../../services/ideaSurveyService';
import { IdeasHeader } from './IdeasHeader';
import { IdeasKpiCards } from './IdeasKpiCards';
import { IdeasGridView } from './IdeasGridView';
import { SurveysGridView } from './SurveysGridView';
import { IdeaDetailModal } from './IdeaDetailModal';
import { NewIdeaModal } from './NewIdeaModal';
import { NewSurveyModal } from './NewSurveyModal';
import { IdeasTabsNav } from './IdeasTabsNav';
import { IdeasFilterBar } from './IdeasFilterBar';

interface IdeasSurveysPanelProps {
  currentUser?: AppUser | null;
  employees: Employee[];
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const IdeasSurveysPanel: React.FC<IdeasSurveysPanelProps> = ({
  currentUser,
  onAddNotification,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ideas' | 'surveys'>('ideas');
  const [ideas, setIdeas] = useState<IdeaSuggestion[]>([]);
  const [surveys, setSurveys] = useState<EnterpriseSurvey[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isNewIdeaModalOpen, setIsNewIdeaModalOpen] = useState(false);
  const [isNewSurveyModalOpen, setIsNewSurveyModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaSuggestion | null>(null);

  useEffect(() => {
    const unsubIdeas = subscribeToIdeas(setIdeas);
    const unsubSurveys = subscribeToSurveys(setSurveys);
    return () => {
      unsubIdeas();
      unsubSurveys();
    };
  }, []);

  const isAdminOrManager = currentUser?.role === 'administrateur' || currentUser?.role === 'responsable';
  const currentUserId = currentUser?.id || 'guest-user';

  const totalVotesAcrossSurveys = surveys.reduce((acc, s) => {
    return acc + s.options.reduce((sum, opt) => sum + opt.votesCount, 0);
  }, 0);

  const filteredIdeas = ideas.filter((idea) => {
    const matchSearch = 
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (!idea.isAnonymous && idea.authorName && idea.authorName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCat = categoryFilter === 'all' || idea.category === categoryFilter;
    const matchStat = statusFilter === 'all' || idea.status === statusFilter;
    return matchSearch && matchCat && matchStat;
  });

  const handleToggleLike = async (idea: IdeaSuggestion) => {
    const alreadyLiked = (idea.likedUserIds || []).includes(currentUserId);
    const updatedUserIds = alreadyLiked 
      ? (idea.likedUserIds || []).filter((id) => id !== currentUserId)
      : [...(idea.likedUserIds || []), currentUserId];

    const updatedIdea: IdeaSuggestion = {
      ...idea,
      likesCount: updatedUserIds.length,
      likedUserIds: updatedUserIds,
    };

    try {
      await saveIdea(updatedIdea);
      showToast?.(alreadyLiked ? 'Vote retiré.' : 'Merci pour votre soutien !', 'success');
    } catch {
      showToast?.('Erreur lors du vote.', 'error');
    }
  };

  const handleUpdateIdeaStatus = async (idea: IdeaSuggestion, nextStatus: IdeaStatus, response?: string) => {
    try {
      const updated: IdeaSuggestion = {
        ...idea,
        status: nextStatus,
        ...(response !== undefined ? { managementResponse: response } : {})
      };
      await saveIdea(updated);
      setSelectedIdea(updated);
      showToast?.(`Statut mis à jour : ${nextStatus}`, 'success');
      onAddNotification?.({
        title: 'Mise à jour Boîte à Idées',
        message: `L'idée "${idea.title}" est maintenant "${nextStatus}".`,
        type: 'info',
      });
    } catch {
      showToast?.('Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleCreateIdea = async (ideaData: Partial<IdeaSuggestion>) => {
    if (!ideaData.title || !ideaData.description) return;
    try {
      const ideaToSave: IdeaSuggestion = {
        id: `idea-${Date.now()}`,
        title: ideaData.title,
        description: ideaData.description,
        category: ideaData.category || 'innovation_logistique',
        isAnonymous: !!ideaData.isAnonymous,
        authorName: ideaData.isAnonymous ? undefined : (currentUser?.name || 'Collaborateur Citrine'),
        authorId: ideaData.isAnonymous ? undefined : currentUserId,
        status: 'soumise',
        likesCount: 1,
        likedUserIds: [currentUserId],
        createdAt: new Date().toISOString(),
      };
      await saveIdea(ideaToSave);
      setIsNewIdeaModalOpen(false);
      showToast?.('Votre idée a été déposée avec succès !', 'success');
    } catch {
      showToast?.('Erreur lors de la soumission.', 'error');
    }
  };

  const handleVoteSurveyOption = async (survey: EnterpriseSurvey, optionId: string) => {
    if ((survey.votedUserIds || []).includes(currentUserId)) {
      showToast?.('Vous avez déjà participé à ce sondage.', 'error');
      return;
    }
    try {
      const updatedOptions = survey.options.map((opt) => {
        if (opt.id === optionId) {
          return { ...opt, votesCount: opt.votesCount + 1 };
        }
        return opt;
      });
      const updatedSurvey: EnterpriseSurvey = {
        ...survey,
        options: updatedOptions,
        votedUserIds: [...(survey.votedUserIds || []), currentUserId],
      };
      await saveSurvey(updatedSurvey);
      showToast?.('Votre vote a bien été enregistré !', 'success');
    } catch {
      showToast?.('Erreur lors du vote.', 'error');
    }
  };

  const handleCreateSurvey = async (surveyData: {
    title: string;
    description: string;
    category: string;
    options: string[];
  }) => {
    const validOptions = surveyData.options.filter((o) => o.trim() !== '');
    if (!surveyData.title || validOptions.length < 2) return;
    try {
      const surveyToSave: EnterpriseSurvey = {
        id: `surv-${Date.now()}`,
        title: surveyData.title,
        description: surveyData.description,
        category: surveyData.category,
        status: 'actif',
        createdBy: currentUser?.name || 'Direction Citrine',
        options: validOptions.map((text, idx) => ({
          id: `opt-${idx + 1}-${Date.now()}`,
          text,
          votesCount: 0,
        })),
        votedUserIds: [],
        createdAt: new Date().toISOString(),
      };
      await saveSurvey(surveyToSave);
      setIsNewSurveyModalOpen(false);
      showToast?.('Sondage d\'entreprise lancé avec succès !', 'success');
    } catch {
      showToast?.('Erreur lors du lancement.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <IdeasHeader
        activeSubTab={activeSubTab}
        isAdminOrManager={isAdminOrManager}
        onOpenNewIdeaModal={() => setIsNewIdeaModalOpen(true)}
        onOpenNewSurveyModal={() => setIsNewSurveyModalOpen(true)}
      />

      <IdeasKpiCards
        totalIdeasCount={ideas.length}
        deployedIdeasCount={ideas.filter((i) => i.status === 'deployee' || i.status === 'retenue_test').length}
        activeSurveysCount={surveys.filter((s) => s.status === 'actif').length}
        totalVotesAcrossSurveys={totalVotesAcrossSurveys}
      />

      <IdeasTabsNav
        activeSubTab={activeSubTab}
        onTabChange={setActiveSubTab}
        ideasCount={ideas.length}
        surveysCount={surveys.length}
      />

      {activeSubTab === 'ideas' && (
        <div className="space-y-4">
          <IdeasFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />

          <IdeasGridView
            ideas={filteredIdeas}
            currentUserId={currentUserId}
            isAdminOrManager={isAdminOrManager}
            onToggleLike={handleToggleLike}
            onSelectIdea={setSelectedIdea}
          />
        </div>
      )}

      {activeSubTab === 'surveys' && (
        <SurveysGridView
          surveys={surveys}
          currentUserId={currentUserId}
          onVoteOption={handleVoteSurveyOption}
        />
      )}

      {selectedIdea && (
        <IdeaDetailModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onUpdateStatus={handleUpdateIdeaStatus}
        />
      )}

      {isNewIdeaModalOpen && (
        <NewIdeaModal
          onClose={() => setIsNewIdeaModalOpen(false)}
          onSubmit={handleCreateIdea}
        />
      )}

      {isNewSurveyModalOpen && (
        <NewSurveyModal
          onClose={() => setIsNewSurveyModalOpen(false)}
          onSubmit={handleCreateSurvey}
        />
      )}
    </div>
  );
};

export default IdeasSurveysPanel;
