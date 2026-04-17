import React from 'react';
import { useData } from '../../services/DataContext';
import { GroupManagement } from './GroupManagement';

export const GroupMatchingTab: React.FC = () => {
    const { groups, modules, users, addGroup, updateGroup, deleteGroup } = useData();

    return (
        <div className="animate-fade-in space-y-6">
            <GroupManagement 
                groups={groups}
                modules={modules}
                users={users}
                onSave={(g) => {
                    const exists = groups.find(ex => ex.id === g.id);
                    if (exists) updateGroup(g);
                    else addGroup(g);
                }}
                onDelete={(id) => deleteGroup(id)}
            />
        </div>
    );
};
