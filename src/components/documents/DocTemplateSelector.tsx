import React, { useState, useMemo } from 'react';
import { DOC_TEMPLATES, DocTemplate } from '../DocTemplates';
import {
  DocTemplateSelectorHeader,
  DocTemplateControlsBar,
  TemplateCategoryFilter,
} from './templateSelector/DocTemplateSelectorHeader';
import { DocTemplateListViews } from './templateSelector/DocTemplateListViews';

interface DocTemplateSelectorProps {
  onSelectTemplate: (template: DocTemplate) => void;
  templates?: DocTemplate[];
  onCreateNewTemplate?: () => void;
}

export const DocTemplateSelector: React.FC<DocTemplateSelectorProps> = ({
  onSelectTemplate,
  templates,
  onCreateNewTemplate,
}) => {
  const currentTemplates = templates && templates.length > 0 ? templates : DOC_TEMPLATES;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategoryFilter>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = viewMode === 'table' ? 5 : 6;

  const filteredTemplates = useMemo(() => {
    return currentTemplates.filter((tpl) => {
      if (categoryFilter === 'contracts' && tpl.category !== 'contract' && tpl.category !== 'amendment') {
        return false;
      }
      if (
        categoryFilter === 'attestations' &&
        tpl.category !== 'attestation' &&
        tpl.category !== 'certificate' &&
        tpl.category !== 'internship'
      ) {
        return false;
      }
      if (
        categoryFilter === 'discipline' &&
        tpl.category !== 'disciplinary' &&
        tpl.category !== 'memo' &&
        tpl.category !== 'regulation'
      ) {
        return false;
      }
      if (
        categoryFilter === 'operations' &&
        tpl.category !== 'mission' &&
        tpl.category !== 'discharge' &&
        tpl.category !== 'job_description' &&
        tpl.category !== 'evaluation'
      ) {
        return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = tpl.name.toLowerCase().includes(q);
        const matchDesc = tpl.description?.toLowerCase().includes(q) || false;
        const matchCat = tpl.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      return true;
    });
  }, [currentTemplates, categoryFilter, searchTerm]);

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage) || 1;
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden transition-all duration-200">
      <DocTemplateSelectorHeader
        totalTemplatesCount={currentTemplates.length}
        viewMode={viewMode}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onChangeViewMode={(mode) => {
          setViewMode(mode);
          setCurrentPage(1);
        }}
        onCreateNewTemplate={onCreateNewTemplate}
      />

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          <DocTemplateControlsBar
            totalTemplatesCount={currentTemplates.length}
            searchTerm={searchTerm}
            onSearchChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            categoryFilter={categoryFilter}
            onCategoryChange={(cat) => {
              setCategoryFilter(cat);
              setCurrentPage(1);
            }}
          />

          <DocTemplateListViews
            viewMode={viewMode}
            paginatedTemplates={paginatedTemplates}
            totalFilteredCount={filteredTemplates.length}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onSelectTemplate={onSelectTemplate}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};
