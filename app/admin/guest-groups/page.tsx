'use client';

import { useState, useEffect, useCallback } from 'react';
import { DataTableWithSuspense as DataTable, type ColumnDef } from '@/components/ui/DataTableWithSuspense';
import { CollapsibleForm } from '@/components/admin/CollapsibleForm';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastContext';
import type { GroupWithCount } from '@/schemas/groupSchemas';
import { createGroupSchema, updateGroupSchema } from '@/schemas/groupSchemas';

export default function GuestGroupsPage() {
  const { addToast } = useToast();
  
  const [groups, setGroups] = useState<GroupWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithCount | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupWithCount | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/guest-groups');
      const result = await response.json();
      
      if (result.success) {
        setGroups(result.data || []);
      } else {
        addToast({ type: 'error', message: result.error?.message || 'Failed to load groups' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load groups' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleRowClick = useCallback((group: GroupWithCount) => {
    setSelectedGroup(group);
    setIsFormOpen(true);
  }, []);

  const handleAddGroup = useCallback(() => {
    setSelectedGroup(null);
    setIsFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((group: GroupWithCount) => {
    setGroupToDelete(group);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: any) => {
    try {
      const isEdit = !!selectedGroup;
      const url = isEdit ? `/api/admin/guest-groups/${selectedGroup.id}` : '/api/admin/guest-groups';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          type: 'success',
          message: isEdit ? 'Group updated successfully' : 'Group created successfully',
        });
        await fetchGroups();
        setIsFormOpen(false);
        setSelectedGroup(null);
      } else {
        addToast({ type: 'error', message: result.error?.message || 'Operation failed' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Operation failed' });
    }
  }, [selectedGroup, addToast, fetchGroups]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!groupToDelete) return;

    try {
      const response = await fetch(`/api/admin/guest-groups/${groupToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast({ type: 'success', message: 'Group deleted successfully' });
        await fetchGroups();
        setIsDeleteDialogOpen(false);
        setGroupToDelete(null);
      } else {
        addToast({ type: 'error', message: result.error?.message || 'Failed to delete group' });
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to delete group' });
    }
  }, [groupToDelete, addToast, fetchGroups]);

  const columns: ColumnDef<GroupWithCount>[] = [
    {
      key: 'name',
      label: 'Group Name',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (value) => value || '-',
    },
    {
      key: 'guestCount',
      label: 'Guests',
      sortable: true,
      render: (value) => String(value),
    },
  ];

  const formFields = [
    {
      name: 'name',
      label: 'Group Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Smith Family, College Friends',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: false,
      placeholder: 'Optional description',
      rows: 3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-sage-900">Guest Groups</h1>
          <p className="text-sage-600 mt-1">Organize guests into families or groups</p>
        </div>
      </div>

      <CollapsibleForm
        title={selectedGroup ? 'Edit Group' : 'Add Group'}
        isOpen={isFormOpen}
        onToggle={() => {
          if (isFormOpen) {
            setIsFormOpen(false);
            setSelectedGroup(null);
          } else {
            setIsFormOpen(true);
          }
        }}
        onSubmit={handleSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setSelectedGroup(null);
        }}
        initialData={selectedGroup || {}}
        schema={selectedGroup ? updateGroupSchema : createGroupSchema}
        fields={formFields}
        submitLabel={selectedGroup ? 'Update Group' : 'Create Group'}
      />

      <DataTable
        data={groups}
        columns={columns}
        loading={loading}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        totalCount={groups.length}
        currentPage={1}
        pageSize={25}
        idField="id"
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete ${groupToDelete?.name}? ${
          groupToDelete?.guestCount ? 'This group has guests and cannot be deleted.' : 'This action cannot be undone.'
        }`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  );
}
