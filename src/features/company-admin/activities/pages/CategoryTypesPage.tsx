import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import { categoryTypeService } from '@/features/activities/services/categoryTypeService';
import { LoadingScreen } from '@/components/feedback/LoadingScreen';
import type { ActivityCategory, ActivityType } from '@/features/activities/types/activity.types';

export default function CategoryTypesPage() {
  const { user } = useAuth();
  const { organizationMember } = useOrganization();
  const organizationId = organizationMember?.organization_id || '';

  console.log('CategoryTypesPage - organizationId:', organizationId);
  console.log('CategoryTypesPage - organizationMember:', organizationMember);

  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Category form state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', color: '' });
  
  // Type form state
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', icon: '', color: '', category_id: '' });

  const loadData = async () => {
    console.log('Loading data for organization:', organizationId);
    setIsLoading(true);
    try {
      const cats = await categoryTypeService.getCategories(organizationId);
      console.log('Categories loaded:', cats);
      setCategories(cats);
      
      const typesData = await categoryTypeService.getTypes(organizationId);
      console.log('Types loaded:', typesData);
      setTypes(typesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      loadData();
    } else {
      console.log('No organization ID available');
      setIsLoading(false);
    }
  }, [organizationId]);

  // Category handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating category:', categoryForm);
    const result = await categoryTypeService.createCategory(
      organizationId,
      categoryForm.name,
      categoryForm.description,
      categoryForm.icon,
      categoryForm.color
    );
    console.log('Create category result:', result);
    if (result) {
      setCategories([...categories, result]);
      setIsCreatingCategory(false);
      setCategoryForm({ name: '', description: '', icon: '', color: '' });
      // Reload to refresh the list
      loadData();
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId) return;
    console.log('Updating category:', editingCategoryId, categoryForm);
    const result = await categoryTypeService.updateCategory(editingCategoryId, categoryForm);
    console.log('Update category result:', result);
    if (result) {
      setCategories(categories.map(c => c.id === editingCategoryId ? result : c));
      setEditingCategoryId(null);
      setCategoryForm({ name: '', description: '', icon: '', color: '' });
      loadData();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Delete this category? This will also delete all its types.')) {
      console.log('Deleting category:', id);
      const success = await categoryTypeService.deleteCategory(id);
      console.log('Delete category success:', success);
      if (success) {
        setCategories(categories.filter(c => c.id !== id));
        setTypes(types.filter(t => t.category_id !== id));
        if (selectedCategory === id) setSelectedCategory(null);
        loadData();
      }
    }
  };

  // Type handlers
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating type:', typeForm);
    const result = await categoryTypeService.createType(
      organizationId,
      typeForm.category_id,
      typeForm.name,
      typeForm.description,
      typeForm.icon,
      typeForm.color
    );
    console.log('Create type result:', result);
    if (result) {
      setTypes([...types, result]);
      setIsCreatingType(false);
      setTypeForm({ name: '', description: '', icon: '', color: '', category_id: '' });
      loadData();
    }
  };

  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTypeId) return;
    console.log('Updating type:', editingTypeId, typeForm);
    const result = await categoryTypeService.updateType(editingTypeId, typeForm);
    console.log('Update type result:', result);
    if (result) {
      setTypes(types.map(t => t.id === editingTypeId ? result : t));
      setEditingTypeId(null);
      setTypeForm({ name: '', description: '', icon: '', color: '', category_id: '' });
      loadData();
    }
  };

  const handleDeleteType = async (id: string) => {
    if (window.confirm('Delete this type?')) {
      console.log('Deleting type:', id);
      const success = await categoryTypeService.deleteType(id);
      console.log('Delete type success:', success);
      if (success) {
        setTypes(types.filter(t => t.id !== id));
        loadData();
      }
    }
  };

  const filteredTypes = selectedCategory ? types.filter(t => t.category_id === selectedCategory) : types;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Categories Column */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Categories</h2>
            {!isCreatingCategory && !editingCategoryId && (
              <button
                onClick={() => setIsCreatingCategory(true)}
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
              >
                + Add
              </button>
            )}
          </div>

          {/* Category Form */}
          {(isCreatingCategory || editingCategoryId) && (
            <form onSubmit={editingCategoryId ? handleUpdateCategory : handleCreateCategory} className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Category Name *"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
              <input
                type="text"
                placeholder="Description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Icon (emoji)"
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  className="w-24 px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
                <input
                  type="color"
                  value={categoryForm.color || '#4F46E5'}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-12 h-10 rounded border border-input cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-primary px-4 py-1 text-sm text-primary-foreground hover:bg-primary/90">
                  {editingCategoryId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setEditingCategoryId(null);
                    setCategoryForm({ name: '', description: '', icon: '', color: '' });
                  }}
                  className="rounded-md border px-4 py-1 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Category List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet. Create one above!</p>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedCategory === cat.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || '📁'}</span>
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCategoryId(cat.id);
                        setCategoryForm({ 
                          name: cat.name, 
                          description: cat.description || '', 
                          icon: cat.icon || '', 
                          color: cat.color || '' 
                        });
                        setIsCreatingCategory(false);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Types Column */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {selectedCategory ? `Types for ${categories.find(c => c.id === selectedCategory)?.name}` : 'Types'}
            </h2>
            {selectedCategory && !isCreatingType && !editingTypeId && (
              <button
                onClick={() => {
                  setIsCreatingType(true);
                  setTypeForm({ ...typeForm, category_id: selectedCategory });
                }}
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
              >
                + Add Type
              </button>
            )}
          </div>

          {!selectedCategory && (
            <p className="text-sm text-muted-foreground">Select a category to manage its types</p>
          )}

          {/* Type Form */}
          {(isCreatingType || editingTypeId) && selectedCategory && (
            <form onSubmit={editingTypeId ? handleUpdateType : handleCreateType} className="mb-4 space-y-3">
              <input
                type="text"
                placeholder="Type Name *"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
              <input
                type="text"
                placeholder="Description"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Icon (emoji)"
                  value={typeForm.icon}
                  onChange={(e) => setTypeForm({ ...typeForm, icon: e.target.value })}
                  className="w-24 px-3 py-2 border border-input rounded-md bg-background text-sm"
                />
                <input
                  type="color"
                  value={typeForm.color || '#4F46E5'}
                  onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                  className="w-12 h-10 rounded border border-input cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-primary px-4 py-1 text-sm text-primary-foreground hover:bg-primary/90">
                  {editingTypeId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingType(false);
                    setEditingTypeId(null);
                    setTypeForm({ name: '', description: '', icon: '', color: '', category_id: selectedCategory || '' });
                  }}
                  className="rounded-md border px-4 py-1 text-sm hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Type List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {!selectedCategory ? null : filteredTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No types in this category. Create one above!</p>
            ) : (
              filteredTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon || '📄'}</span>
                    <div>
                      <p className="font-medium">{type.name}</p>
                      {type.description && <p className="text-xs text-muted-foreground">{type.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingTypeId(type.id);
                        setTypeForm({ 
                          name: type.name, 
                          description: type.description || '', 
                          icon: type.icon || '', 
                          color: type.color || '',
                          category_id: type.category_id 
                        });
                        setIsCreatingType(false);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteType(type.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}