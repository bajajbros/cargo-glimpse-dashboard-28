
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: Date;
}

const EntityTab = ({ 
  entityType, 
  entityLabel 
}: { 
  entityType: string; 
  entityLabel: string; 
}) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEntities();
  }, [entityType]);

  const fetchEntities = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, entityType));
      const entitiesList: Entity[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entitiesList.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          createdAt: data.createdAt?.toDate(),
        });
      });
      setEntities(entitiesList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);

    try {
      // Check if name already exists (case-insensitive)
      const existingQuery = query(
        collection(db, entityType),
        where('name', '==', name.trim())
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty && !editingEntity) {
        toast({
          title: "Error",
          description: `${entityLabel} with this name already exists. Please choose a different name.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const entityData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        createdAt: editingEntity ? editingEntity.createdAt : new Date(),
      };

      if (editingEntity) {
        await updateDoc(doc(db, entityType, editingEntity.id), entityData);
        toast({
          title: "Success",
          description: `${entityLabel} updated successfully`,
        });
      } else {
        await addDoc(collection(db, entityType), entityData);
        toast({
          title: "Success",
          description: `${entityLabel} added successfully`,
        });
      }

      setName('');
      setPhone('');
      setEmail('');
      setEditingEntity(null);
      setIsDialogOpen(false);
      fetchEntities();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingEntity ? 'update' : 'add'} ${entityLabel}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (entity: Entity) => {
    setEditingEntity(entity);
    setName(entity.name);
    setPhone(entity.phone);
    setEmail(entity.email);
    setIsDialogOpen(true);
  };

  const handleDelete = async (entity: Entity) => {
    if (confirm(`Are you sure you want to delete ${entity.name}?`)) {
      try {
        await deleteDoc(doc(db, entityType, entity.id));
        toast({
          title: "Success",
          description: `${entityLabel} deleted successfully`,
        });
        fetchEntities();
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete ${entityLabel}`,
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setEditingEntity(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Manage {entityLabel}s</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add {entityLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntity ? 'Edit' : 'Add'} {entityLabel}</DialogTitle>
              <DialogDescription>
                {editingEntity ? 'Update' : 'Enter'} the details for the {entityLabel.toLowerCase()}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder={`Enter ${entityLabel.toLowerCase()} name`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : editingEntity ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell className="font-medium">{entity.name}</TableCell>
                  <TableCell>{entity.phone}</TableCell>
                  <TableCell>{entity.email}</TableCell>
                  <TableCell>{entity.createdAt?.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(entity)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(entity)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {entities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No {entityLabel.toLowerCase()}s found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ManageEntities() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Entities</CardTitle>
          <CardDescription>
            Manage shippers, consignees, and overseas agents for job creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="shippers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shippers">Shippers</TabsTrigger>
              <TabsTrigger value="consignees">Consignees</TabsTrigger>
              <TabsTrigger value="overseas_agents">Overseas Agents</TabsTrigger>
            </TabsList>
            <TabsContent value="shippers" className="mt-6">
              <EntityTab entityType="shippers" entityLabel="Shipper" />
            </TabsContent>
            <TabsContent value="consignees" className="mt-6">
              <EntityTab entityType="consignees" entityLabel="Consignee" />
            </TabsContent>
            <TabsContent value="overseas_agents" className="mt-6">
              <EntityTab entityType="overseas_agents" entityLabel="Overseas Agent" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
