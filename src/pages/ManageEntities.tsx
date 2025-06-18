import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, FileText, Download } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  phone: string;
  email: string;
  documentUrl?: string;
  documentName?: string;
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
  const [document, setDocument] = useState<File | null>(null);
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
          documentUrl: data.documentUrl,
          documentName: data.documentName,
          createdAt: data.createdAt?.toDate(),
        });
      });
      setEntities(entitiesList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const uploadDocument = async (file: File, entityId: string): Promise<{ url: string; name: string }> => {
    const timestamp = Date.now();
    const fileName = `${entityType}/${entityId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return { url: downloadURL, name: file.name };
  };

  const deleteDocument = async (documentUrl: string) => {
    try {
      const fileRef = ref(storage, documentUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting document:', error);
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

      let documentData: { documentUrl?: string; documentName?: string } = {};

      // Handle document upload
      if (document) {
        try {
          const entityId = editingEntity?.id || Date.now().toString();
          const uploadResult = await uploadDocument(document, entityId);
          documentData.documentUrl = uploadResult.url;
          documentData.documentName = uploadResult.name;

          // If editing and there was an old document, delete it
          if (editingEntity?.documentUrl) {
            await deleteDocument(editingEntity.documentUrl);
          }
        } catch (error) {
          console.error('Error uploading document:', error);
          toast({
            title: "Warning",
            description: "Document upload failed, but entity will be saved without document.",
            variant: "destructive",
          });
        }
      }

      const entityData = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        ...documentData,
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
      setDocument(null);
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
    setDocument(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (entity: Entity) => {
    if (confirm(`Are you sure you want to delete ${entity.name}?`)) {
      try {
        // Delete document if exists
        if (entity.documentUrl) {
          await deleteDocument(entity.documentUrl);
        }
        
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
    setDocument(null);
    setEditingEntity(null);
  };

  const downloadDocument = async (entity: Entity) => {
    if (!entity.documentUrl) {
      toast({
        title: "No document",
        description: "This entity has no document attached.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(entity.documentUrl);
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = entity.documentName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: "Document download has started.",
      });
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Download failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
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
          <DialogContent className="max-w-md">
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
              <div className="space-y-2">
                <Label htmlFor="document">Document</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="document"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => setDocument(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  <Upload className="w-4 h-4 text-gray-400" />
                </div>
                {editingEntity?.documentName && !document && (
                  <p className="text-xs text-gray-500">
                    Current: {editingEntity.documentName}
                  </p>
                )}
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
                <TableHead>Document</TableHead>
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
                  <TableCell>
                    {entity.documentUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(entity)}
                        className="flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <Download className="w-3 h-3" />
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-sm">No document</span>
                    )}
                  </TableCell>
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
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
