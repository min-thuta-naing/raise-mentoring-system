import React, { useState } from 'react';
import { Users, GraduationCap, Briefcase, Shield } from 'lucide-react';
import { Batch, Module, Group, User, Role, MentorType } from '../../types';
import { AssessmentBuilder } from './AssessmentBuilder';

interface SetupTabProps {
  batches: Batch[];
  modules: Module[];
  users: User[];
  onAddBatch: (b: Batch) => void;
  onUpdateModule: (m: Module) => void;
}

export const SetupTab: React.FC<SetupTabProps> = ({
  batches,
  modules,
  users,
  onAddBatch,
  onUpdateModule
}) => {


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* Assessment Builder Section */}
      <div className="md:col-span-2">
        <AssessmentBuilder modules={modules} onUpdateModule={onUpdateModule} />
      </div>
    </div>
  );
};
