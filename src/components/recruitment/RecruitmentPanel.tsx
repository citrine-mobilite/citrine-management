import React, { useState, useEffect } from 'react';
import { Briefcase, UserPlus, Plus } from 'lucide-react';
import { 
  JobOffer, 
  JobApplication, 
  ApplicationStage, 
  JobContractType, 
  AppUser, 
  Employee 
} from '../../types';
import { 
  subscribeToJobOffers, 
  subscribeToJobApplications, 
  saveJobOffer, 
  saveJobApplication 
} from '../../services/recruitmentService';
import { RecruitmentKpiCards } from './RecruitmentKpiCards';
import { CandidateDetailModal } from './CandidateDetailModal';
import { NewJobOfferModal } from './NewJobOfferModal';
import { NewCandidateModal } from './NewCandidateModal';
import { RecruitmentOffersView } from './RecruitmentOffersView';
import { RecruitmentInterviewsView } from './RecruitmentInterviewsView';
import { RecruitmentApplicationsView, getStageBadge } from './RecruitmentApplicationsView';
import { RecruitmentTabsNav } from './RecruitmentTabsNav';

interface RecruitmentPanelProps {
  currentUser?: AppUser | null;
  employees: Employee[];
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  onUpdateEmployees?: (employees: Employee[]) => void;
}

export const RecruitmentPanel: React.FC<RecruitmentPanelProps> = ({
  currentUser,
  employees,
  onAddNotification,
  showToast,
  onUpdateEmployees,
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'offers' | 'interviews'>('applications');
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedOfferFilter, setSelectedOfferFilter] = useState<string>('all');
  
  const [isNewOfferModalOpen, setIsNewOfferModalOpen] = useState(false);
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);

  useEffect(() => {
    const unsubOffers = subscribeToJobOffers(setOffers);
    const unsubApps = subscribeToJobApplications(setApplications);
    return () => {
      unsubOffers();
      unsubApps();
    };
  }, []);

  const isAdminOrManager = currentUser?.role === 'administrateur' || currentUser?.role === 'responsable';

  const filteredApplications = applications.filter((app) => {
    const matchSearch = 
      app.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobOfferTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.candidateCity && app.candidateCity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.currentPosition && app.currentPosition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchStage = selectedStage === 'all' || app.stage === selectedStage;
    const matchOffer = selectedOfferFilter === 'all' || app.jobOfferId === selectedOfferFilter;
    return matchSearch && matchStage && matchOffer;
  });

  const upcomingInterviews = applications.filter((a) => 
    (a.stage === 'entretien_rh' || a.stage === 'entretien_technique') && a.interviewDate
  );

  const handleStageChange = async (app: JobApplication, newStage: ApplicationStage) => {
    try {
      const updated: JobApplication = {
        ...app,
        stage: newStage,
        updatedAt: new Date().toISOString(),
      };
      await saveJobApplication(updated);
      setSelectedApplication(updated);
      showToast?.(`Statut mis à jour : ${newStage.replace('_', ' ')}`, 'success');
    } catch {
      showToast?.('Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleCreateOffer = async (offerData: Partial<JobOffer>) => {
    if (!offerData.title) return;
    try {
      const offerToSave: JobOffer = {
        id: `job-${Date.now()}`,
        title: offerData.title,
        department: offerData.department || 'Opérations',
        location: offerData.location || 'Douala',
        contractType: (offerData.contractType as JobContractType) || 'CDI',
        openingsCount: Number(offerData.openingsCount) || 1,
        description: offerData.description || '',
        requirements: [],
        salaryRange: offerData.salaryRange || 'Selon profil',
        deadline: offerData.deadline || '',
        status: offerData.status || 'ouvert',
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Direction RH Citrine',
      };
      await saveJobOffer(offerToSave);
      setIsNewOfferModalOpen(false);
      showToast?.('Offre d\'emploi créée avec succès !', 'success');
    } catch {
      showToast?.('Erreur lors de la création de l\'offre.', 'error');
    }
  };

  const handleCreateApplication = async (appData: Partial<JobApplication>) => {
    if (!appData.candidateName || !appData.candidatePhone) return;
    try {
      const selectedJob = offers.find((o) => o.id === appData.jobOfferId);
      const appToSave: JobApplication = {
        id: `app-${Date.now()}`,
        jobOfferId: appData.jobOfferId || (offers[0]?.id || 'spontanee'),
        jobOfferTitle: selectedJob ? selectedJob.title : 'Candidature spontanée',
        candidateName: appData.candidateName,
        candidateEmail: appData.candidateEmail || '',
        candidatePhone: appData.candidatePhone,
        candidateCity: appData.candidateCity || 'Douala',
        currentPosition: appData.currentPosition || 'Candidat externe',
        experienceYears: Number(appData.experienceYears) || 0,
        stage: 'nouveau',
        notes: appData.notes || '',
        appliedAt: new Date().toISOString(),
      };
      await saveJobApplication(appToSave);
      setIsNewApplicationModalOpen(false);
      showToast?.('Candidat ajouté au vivier avec succès !', 'success');
    } catch {
      showToast?.('Erreur lors de l\'ajout.', 'error');
    }
  };

  const handleConvertCandidateToEmployee = async (app: JobApplication) => {
    if (!onUpdateEmployees) return;
    const nameParts = app.candidateName.split(' ');
    const firstName = nameParts[0] || 'Prénom';
    const lastName = nameParts.slice(1).join(' ') || 'Nom';

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name: app.candidateName,
      firstName,
      lastName,
      email: app.candidateEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@citrine-mobilite.com`,
      phone: app.candidatePhone,
      roleType: 'employé',
      role: app.jobOfferTitle.toLowerCase().includes('chauffeur') ? 'Chauffeur VTC' : 'Agent Logistique',
      department: 'Logistique & Exploitation',
      status: 'en_poste',
      hireDate: new Date().toISOString().split('T')[0],
      salary: 180000,
      avatarUrl: '',
    };

    onUpdateEmployees([...employees, newEmployee]);
    await handleStageChange(app, 'embauche');
    showToast?.(`${app.candidateName} embauché chez Citrine !`, 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-teal-50 text-[#2A7B76] rounded-xl border border-teal-100">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">Recrutement & Vivier de Candidatures (ATS)</h1>
            <p className="text-xs text-stone-500">Postes ouverts, entretiens et sélection des talents Citrine SARL</p>
          </div>
        </div>

        {isAdminOrManager && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsNewApplicationModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-stone-600" /> Ajouter un Candidat
            </button>
            <button
              onClick={() => setIsNewOfferModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouvelle Offre
            </button>
          </div>
        )}
      </div>

      <RecruitmentKpiCards
        openOffersCount={offers.filter((o) => o.status === 'ouvert' || o.status === 'en_cours').length}
        totalAppsCount={applications.length}
        interviewsCount={upcomingInterviews.length}
        hiredCount={applications.filter((a) => a.stage === 'embauche').length}
      />

      <RecruitmentTabsNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        applicationsCount={applications.length}
        offersCount={offers.length}
        interviewsCount={upcomingInterviews.length}
      />

      {activeTab === 'applications' && (
        <RecruitmentApplicationsView
          applications={filteredApplications}
          offers={offers}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStage={selectedStage}
          onStageFilterChange={setSelectedStage}
          selectedOfferFilter={selectedOfferFilter}
          onOfferFilterChange={setSelectedOfferFilter}
          onSelectApplication={setSelectedApplication}
        />
      )}

      {activeTab === 'offers' && (
        <RecruitmentOffersView
          offers={offers}
          applications={applications}
          onSelectOffer={(id) => { setSelectedOfferFilter(id); setActiveTab('applications'); }}
        />
      )}

      {activeTab === 'interviews' && (
        <RecruitmentInterviewsView
          interviews={upcomingInterviews}
          onSelectApplication={setSelectedApplication}
          getStageBadge={getStageBadge}
        />
      )}

      {selectedApplication && (
        <CandidateDetailModal
          application={selectedApplication}
          isAdminOrManager={isAdminOrManager}
          onClose={() => setSelectedApplication(null)}
          onStageChange={handleStageChange}
          onConvertCandidateToEmployee={handleConvertCandidateToEmployee}
        />
      )}

      {isNewOfferModalOpen && (
        <NewJobOfferModal
          onClose={() => setIsNewOfferModalOpen(false)}
          onSubmit={handleCreateOffer}
        />
      )}

      {isNewApplicationModalOpen && (
        <NewCandidateModal
          offers={offers}
          onClose={() => setIsNewApplicationModalOpen(false)}
          onSubmit={handleCreateApplication}
        />
      )}
    </div>
  );
};

export default RecruitmentPanel;
