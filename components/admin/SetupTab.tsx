import React, { useState } from 'react';
import { Users, GraduationCap, Briefcase, Shield } from 'lucide-react';
import { Batch, Module, Group, User, Role, MentorType } from '../../types';
import { AssessmentBuilder } from './AssessmentBuilder';
import { GroupManagement } from './GroupManagement';

interface SetupTabProps {
  batches: Batch[];
  modules: Module[];
  groups: Group[];
  users: User[];
  onAddBatch: (b: Batch) => void;
  onUpdateModule: (m: Module) => void;
  onAddUser: (u: User) => void;
  onAddGroup: (g: Group) => void;
  onUpdateGroup: (g: Group) => void;
}

export const SetupTab: React.FC<SetupTabProps> = ({
  batches,
  modules,
  groups,
  users,
  onAddBatch,
  onUpdateModule,
  onAddUser,
  onAddGroup,
  onUpdateGroup
}) => {


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* Assessment Builder Section */}
      <div className="md:col-span-2">
        <AssessmentBuilder modules={modules} onUpdateModule={onUpdateModule} />
      </div>

      {/* Group Management Section */}
      <div className="md:col-span-2">
        <GroupManagement
          groups={groups}
          modules={modules}
          users={users}
          onSave={(g) => {
            const exists = groups.find(ex => ex.id === g.id);
            if (exists) onUpdateGroup(g);
            else onAddGroup(g);
          }}
        />
      </div>
    </div>
  );
};
