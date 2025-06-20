
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit2, Plus, FileText, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Entity {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  documentUrl?: string;
  documentName?: string;
}

interface NewEntity {
  name: string;
  email?: string;
  phone?: string;
  document?: File;
}

export default function ManageEntities() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('shippers');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [newEntity, setNewEntity] = useState<NewEntity>({ name: '', email: '', phone: '', document: null });
  const [editEntity, setEditEntity] = useState<Entity | null>(null);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntities();
  }, [activeTab]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const collectionName = activeTab;
      const querySnapshot = await getDocs(collection(db, collectionName));
      const entityList: Entity[] = [];
      querySnapshot.forEach((doc) => {
        entityList.push({ id: doc.id, ...doc.data() } as Entity);
      });
      setEntities(entityList);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch entities. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setEntities([]);
    setEditEntity(null);
    setNewEntity({ name: '', email: '', phone: '', document: null });
  };

  const handleInputChange = (field: string, value: string) => {
    setNewEntity({ ...newEntity, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewEntity({ ...newEntity, document: e.target.files[0] });
    }
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditData({ ...editData, [field]: value });
  };

  const addEntity = async () => {
    if (!newEntity.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Entity name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const collectionName = activeTab;
      let documentUrl = null;
      let documentName = null;

      if (newEntity.document) {
        const storageRef = ref(storage, `${collectionName}/${newEntity.document.name}`);
        await uploadBytes(storageRef, newEntity.document);
        documentUrl = await getDownloadURL(storageRef);
        documentName = newEntity.document.name;
      }

      await addDoc(collection(db, collectionName), {
        name: newEntity.name,
        email: newEntity.email || '',
        phone: newEntity.phone || '',
        documentUrl: documentUrl || null,
        documentName: documentName || null,
      });

      toast({
        title: "Entity Added",
        description: `${newEntity.name} has been added to ${collectionName}.`,
      });
      setNewEntity({ name: '', email: '', phone: '', document: null });
      fetchEntities();
    } catch (error) {
      console.error('Error adding entity:', error);
      toast({
        title: "Error",
        description: "Failed to add entity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEntity = async (entityId: string, entityName: string, documentUrl?: string) => {
    setLoading(true);
    try {
      const collectionName = activeTab;
      await deleteDoc(doc(db, collectionName, entityId));

      if (documentUrl) {
        const fileRef = ref(storage, documentUrl);
        await deleteObject(fileRef);
      }

      toast({
        title: "Entity Deleted",
        description: `${entityName} has been deleted from ${collectionName}.`,
      });
      fetchEntities();
    } catch (error) {
      console.error('Error deleting entity:', error);
      toast({
        title: "Error",
        description: "Failed to delete entity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (entity: Entity) => {
    setEditEntity(entity);
    setEditData({ 
      name: entity.name, 
      email: entity.email || '', 
      phone: entity.phone || '' 
    });
  };

  const cancelEdit = () => {
    setEditEntity(null);
    setEditData({ name: '', email: '', phone: '' });
  };

  const saveEdit = async () => {
    if (!editEntity) return;

    setLoading(true);
    try {
      const collectionName = activeTab;
      const entityDocRef = doc(db, collectionName, editEntity.id);
      await updateDoc(entityDocRef, editData);

      toast({
        title: "Entity Updated",
        description: `${editData.name} has been updated in ${collectionName}.`,
      });
      cancelEdit();
      fetchEntities();
    } catch (error) {
      console.error('Error updating entity:', error);
      toast({
        title: "Error",
        description: "Failed to update entity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    <div className="p-3 h-full overflow-auto">
      <Card className="max-w-4xl mx-auto shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Manage Entities</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="shippers">Shippers</TabsTrigger>
              <TabsTrigger value="consignees">Consignees</TabsTrigger>
              <TabsTrigger value="overseas_agents">Overseas Agents</TabsTrigger>
            </TabsList>
            <TabsContent value="shippers">
              {renderEntityManagement('shippers')}
            </TabsContent>
            <TabsContent value="consignees">
              {renderEntityManagement('consignees')}
            </TabsContent>
            <TabsContent value="overseas_agents">
              {renderEntityManagement('overseas_agents')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function renderEntityManagement(tabName: string) {
    return (
      <div className="space-y-4">
        {/* Add Entity Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="entityName">
              {tabName.replace('_', ' ')} Name
            </Label>
            <Input
              type="text"
              id="entityName"
              placeholder={`Enter ${tabName.replace('_', ' ')} name`}
              value={newEntity.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="entityEmail">
              Email
            </Label>
            <Input
              type="email"
              id="entityEmail"
              placeholder="Enter email"
              value={newEntity.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="entityPhone">
              Phone
            </Label>
            <Input
              type="text"
              id="entityPhone"
              placeholder="Enter phone"
              value={newEntity.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="entityDocument">
            Upload Document (Optional)
          </Label>
          <Input
            type="file"
            id="entityDocument"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        <Button onClick={addEntity} disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Add {tabName.replace('_', ' ')}
        </Button>

        {/* Entity List Section */}
        {entities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity) => (
              <Card key={entity.id} className="shadow-sm">
                <CardHeader>
                  {editEntity?.id === entity.id ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={editData.name}
                        onChange={(e) => handleEditInputChange('name', e.target.value)}
                        className="text-sm"
                        placeholder="Name"
                      />
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={(e) => handleEditInputChange('email', e.target.value)}
                        className="text-sm"
                        placeholder="Email"
                      />
                      <Input
                        type="text"
                        value={editData.phone}
                        onChange={(e) => handleEditInputChange('phone', e.target.value)}
                        className="text-sm"
                        placeholder="Phone"
                      />
                    </div>
                  ) : (
                    <div>
                      <CardTitle className="text-sm">{entity.name}</CardTitle>
                      {entity.email && <p className="text-xs text-gray-600">{entity.email}</p>}
                      {entity.phone && <p className="text-xs text-gray-600">{entity.phone}</p>}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex items-center justify-between p-2">
                  <div>
                    {entity.documentUrl && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => downloadDocument(entity)}
                        className="mr-2"
                        disabled={loading}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Document
                      </Button>
                    )}
                  </div>
                  <div>
                    {editEntity?.id === entity.id ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveEdit}
                          disabled={loading}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(entity)}
                          disabled={loading}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteEntity(entity.id, entity.name, entity.documentUrl)}
                          disabled={loading}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Badge variant="secondary">No {tabName.replace('_', ' ')} added yet.</Badge>
        )}
      </div>
    );
  }
}
