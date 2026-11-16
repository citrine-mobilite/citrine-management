import React from 'react';
import { ModalPortal } from '../common/ModalPortal';
import { TaskSheetModalProps } from './modal/TaskSheetModalTypes';
import { TaskSheetModalToolbar } from './modal/TaskSheetModalToolbar';
import { TaskSheetDailyTasksSection } from './modal/TaskSheetDailyTasksSection';
import { TaskSheetDailyScheduleAndUnforeseen } from './modal/TaskSheetDailyScheduleAndUnforeseen';
import { TaskSheetDailyNotesSection } from './modal/TaskSheetDailyNotesSection';
import { TaskSheetMonthlyView } from './modal/TaskSheetMonthlyView';
import { TaskSheetYearlyView } from './modal/TaskSheetYearlyView';
import { useTaskSheetModalLogic } from './modal/useTaskSheetModalLogic';
import { DEFAULT_COMPANY_INFO } from '../../services/pdf/pdfCompanyInfo';

export const TaskSheetModal: React.FC<TaskSheetModalProps> = ({
  isOpen,
  onClose,
  employee,
  allTasks,
  presences,
  incidents = [],
  projects = [],
  defaultMode,
  defaultDate,
  currentUser,
}) => {
  const logic = useTaskSheetModalLogic({
    isOpen,
    employee,
    allTasks,
    presences,
    incidents,
    projects,
    defaultMode,
    defaultDate,
    currentUser,
  });

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-stone-900/65 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
          <TaskSheetModalToolbar
            employee={employee}
            mode={logic.mode}
            onChangeMode={logic.setMode}
            selectedDate={logic.selectedDate}
            onChangeDate={logic.setSelectedDate}
            selectedMonth={logic.selectedMonth}
            onChangeMonth={logic.setSelectedMonth}
            selectedYear={logic.selectedYear}
            onChangeYear={logic.setSelectedYear}
            onExportExcel={logic.handleExportExcel}
            onExportPdf={logic.handleExportPdf}
            onSendEmail={logic.handleSendEmail}
            isSendingEmail={logic.isSendingEmail}
            onClose={onClose}
          />

          <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-6 bg-stone-100/50">
            {logic.emailFeedback && (
              <div
                className={`max-w-4xl mx-auto px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
                  logic.emailFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span>{logic.emailFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => logic.setEmailFeedback(null)}
                  className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            )}
            <div id="tasksheet-printable-sheet" className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 space-y-5 text-xs text-stone-900 max-w-4xl mx-auto">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#D4A82F] pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/citrine-logo.png"
                      alt={DEFAULT_COMPANY_INFO.name}
                      className="h-11 w-auto object-contain"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.dataset.fallbackTried) {
                          img.dataset.fallbackTried = '1';
                          img.src = '/logo.png';
                        }
                      }}
                    />
                    <div className="border-l border-stone-200 pl-3">
                      <div className="font-serif font-black text-sm tracking-wide text-[#164e4b]">
                        {DEFAULT_COMPANY_INFO.name}
                      </div>
                      <div className="text-[10px] font-semibold text-stone-500">
                        {DEFAULT_COMPANY_INFO.subTitle}
                      </div>
                      {DEFAULT_COMPANY_INFO.baseline && (
                        <div className="text-[9.5px] italic text-amber-700 font-medium">
                          {DEFAULT_COMPANY_INFO.baseline}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right text-[10px] text-stone-500 uppercase tracking-wider leading-snug">
                    <div className="font-bold text-[#164e4b]">République du Cameroun</div>
                    <div className="font-semibold text-amber-700">Document Administratif Officiel</div>
                    <div className="normal-case tracking-normal text-stone-400">
                      Édité le {new Date().toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200 border-l-4 border-l-[#164e4b] rounded-r-xl px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-sm text-[#164e4b] uppercase tracking-tight">
                    {logic.mode === 'day' && `Feuille de Tâches Journalière — ${logic.dailyData.department}`}
                    {logic.mode === 'month' && `Feuille de Tâches Mensuelle — ${logic.monthlyData.monthName}`}
                    {logic.mode === 'year' && `Bilan Annuel des Tâches — ${logic.yearlyData.year}`}
                  </div>
                  <div className="sm:text-right text-[11px] text-stone-600 font-mono space-y-0.5 tabular-nums">
                    <div><strong>Collaborateur :</strong> {employee.name}</div>
                    <div><strong>Département :</strong> {employee.department || 'Général'} · <strong>Site :</strong> {DEFAULT_COMPANY_INFO.city}</div>
                    {logic.mode === 'day' && <div><strong>Date :</strong> {logic.dailyData.date} ({logic.dailyData.dayName})</div>}
                    {logic.mode === 'month' && <div><strong>Période :</strong> {logic.monthlyData.month}</div>}
                    {logic.mode === 'year' && <div><strong>Année :</strong> {logic.yearlyData.year}</div>}
                  </div>
                </div>
              </div>

              {logic.mode === 'day' && (
                <div className="space-y-4">
                  <TaskSheetDailyTasksSection dailyData={logic.dailyData} />
                  <TaskSheetDailyScheduleAndUnforeseen
                    dailyData={logic.dailyData}
                    employee={employee}
                    isViewingSelf={logic.isViewingSelf}
                    isAddingUnforeseen={logic.isAddingUnforeseen}
                    onToggleAddingUnforeseen={() => logic.setIsAddingUnforeseen(!logic.isAddingUnforeseen)}
                    newUnforeseenTime={logic.newUnforeseenTime}
                    onChangeNewTime={logic.setNewUnforeseenTime}
                    newUnforeseenSubject={logic.newUnforeseenSubject}
                    onChangeNewSubject={logic.setNewUnforeseenSubject}
                    newUnforeseenLostMin={logic.newUnforeseenLostMin}
                    onChangeNewLostMin={logic.setNewUnforeseenLostMin}
                    onSubmitUnforeseen={logic.handleAddCustomUnforeseen}
                    onRemoveCustomUnforeseen={logic.handleRemoveCustomUnforeseen}
                  />
                  <TaskSheetDailyNotesSection
                    dailyData={logic.dailyData}
                    taskSheetNotes={logic.taskSheetNotes}
                    isAddingNote={logic.isAddingNote}
                    onToggleAddingNote={(force) => logic.setIsAddingNote(force !== undefined ? force : !logic.isAddingNote)}
                    newNoteContent={logic.newNoteContent}
                    onChangeNewContent={logic.setNewNoteContent}
                    newNoteCategory={logic.newNoteCategory}
                    onChangeNewCategory={logic.setNewNoteCategory}
                    newNoteUrgency={logic.newNoteUrgency}
                    onChangeNewUrgency={logic.setNewNoteUrgency}
                    newNoteTarget={logic.newNoteTarget}
                    onChangeNewTarget={logic.setNewNoteTarget}
                    onSubmitNote={logic.handleAddTaskSheetNote}
                    onRemoveNote={logic.handleRemoveNote}
                  />
                </div>
              )}

              {logic.mode === 'month' && <TaskSheetMonthlyView monthlyData={logic.monthlyData} />}
              {logic.mode === 'year' && <TaskSheetYearlyView yearlyData={logic.yearlyData} />}

              <footer className="border-t-2 border-[#D4A82F] pt-3 mt-6 text-center text-[10px] text-stone-500 space-y-0.5">
                <div className="font-bold text-stone-700">
                  {DEFAULT_COMPANY_INFO.name} · {DEFAULT_COMPANY_INFO.address} ({DEFAULT_COMPANY_INFO.city}, {DEFAULT_COMPANY_INFO.country})
                </div>
                <div>
                  Tél. {DEFAULT_COMPANY_INFO.phone} · {DEFAULT_COMPANY_INFO.email}
                </div>
                <div className="text-[9.5px] text-stone-400">
                  SARL au capital de {DEFAULT_COMPANY_INFO.capital} — NUI : {DEFAULT_COMPANY_INFO.nui} — RCCM : {DEFAULT_COMPANY_INFO.rccm}
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default TaskSheetModal;
