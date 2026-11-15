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
            onClose={onClose}
          />

          <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto space-y-6 bg-stone-100/50">
            <div id="tasksheet-printable-sheet" className="bg-white p-6 rounded-2xl border border-stone-300 shadow-sm space-y-5 text-xs text-stone-900 max-w-3xl mx-auto" style={{ fontFamily: 'Calibri, Arial, sans-serif' }}>
              <div className="border-b-2 border-[#164e4b] pb-3 flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-serif font-black tracking-wide italic text-[#164e4b]">CITRINE</h1>
                  <div className="font-bold text-sm text-[#164e4b] mt-0.5">
                    {logic.mode === 'day' && `TASKSHEET JOURNALIER — ${logic.dailyData.department.toUpperCase()}`}
                    {logic.mode === 'month' && `TASKSHEET MENSUEL — ${logic.monthlyData.monthName.toUpperCase()}`}
                    {logic.mode === 'year' && `BILAN ANNUEL TASKSHEET — ${logic.yearlyData.year}`}
                  </div>
                </div>
                <div className="text-right text-[11px] text-stone-600 font-mono space-y-0.5">
                  <div><strong>Collaborateur :</strong> {employee.name}</div>
                  <div><strong>Lieu :</strong> Douala • <strong>Département :</strong> {employee.department || 'IT'}</div>
                  {logic.mode === 'day' && <div><strong>Date :</strong> {logic.dailyData.date} ({logic.dailyData.dayName})</div>}
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
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default TaskSheetModal;
