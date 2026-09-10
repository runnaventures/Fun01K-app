// src/features/platform-admin/components/TaxonomyManager/TaxonomyManager.tsx

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { useTaxonomy } from '../../hooks/useTaxonomy';

// Simple icon list
const TAXONOMY_AVAILABLE_ICONS = [
  'Sparkles', 'Trophy', 'Cpu', 'Palette', 'Utensils', 'Compass', 'Smile',
  'Gamepad', 'Heart', 'Music', 'Camera', 'Dices', 'Coffee', 'Footprints',
  'BookOpen', 'Bike', 'Flame', 'Mountain', 'Tv', 'Plane', 'Activity', 'Sun', 'Shield', 'Gift'
];

export function TaxonomyManager() {
  const { categories, addCategory, addSubInterest, deleteSubInterest } = useTaxonomy();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Sparkles');
  const [newSubName, setNewSubName] = useState('');
  const [newSubIcon, setNewSubIcon] = useState('Sparkles');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    addCategory({
      name: newCategoryName.trim(),
      icon: newCategoryIcon,
      subInterests: [{ name: `General ${newCategoryName.trim()}`, icon: newCategoryIcon }]
    });
    setNewCategoryName('');
    setIsAddCategoryOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Interest Taxonomy</h2>
          <p className="text-sm text-muted-foreground">
            Manage global interest categories and sub-interests for all tenants
          </p>
        </div>
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button size="sm">+ Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Outdoor & Adventure"
                />
              </div>
              <Button onClick={handleAddCategory} className="w-full">
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories List */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`w-full text-left p-3 rounded-lg transition flex items-center justify-between ${
                    selectedCategoryId === category.id
                      ? 'bg-primary/10 border-primary/20 border'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.subInterests.length} sub-interests
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sub-Interests */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {selectedCategory?.name || 'Select a category'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCategory && (
                <div className="space-y-4">
                  {/* Add Sub-Interest */}
                  <div className="flex gap-2">
                    <Input
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="Add sub-interest..."
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (!newSubName.trim()) return;
                        addSubInterest(selectedCategory.id, {
                          name: newSubName.trim(),
                          icon: newSubIcon
                        });
                        setNewSubName('');
                      }}
                    >
                      Add
                    </Button>
                  </div>

                  {/* Sub-Interests Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCategory.subInterests.map((sub) => (
                      <div
                        key={sub.name}
                        className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/20 transition"
                      >
                        <span className="text-sm">{sub.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSubInterest(selectedCategory.id, sub.name)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}