
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Edit, Eye, UserPlus } from 'lucide-react';

interface RMUser {
  id: string;
  firstName: string;
  lastName: string;
  shortName: string;
  email: string;
  phone: string;
  rmType: string;
  status: string;
  createdAt: Date;
  createdBy: string;
  permissions: Record<string, boolean>;
}

export default function ManageUsers() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [shortName, setShortName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rmType, setRmType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<RMUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<RMUser | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'relationship_managers'));
      const usersList: RMUser[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersList.push({
          id: doc.id,
          firstName: data.firstName,
          lastName: data.lastName,
          shortName: data.shortName,
          email: data.email,
          phone: data.phone,
          rmType: data.rmType,
          status: data.status,
          createdAt: data.createdAt?.toDate(),
          createdBy: data.createdBy,
          permissions: data.permissions || {}
        });
      });
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if short name already exists
      const shortNameCheck = await getDocs(
        query(collection(db, 'relationship_managers'), where('shortName', '==', shortName.toLowerCase()))
      );
      
      if (!shortNameCheck.empty) {
        throw new Error('This Short Name is already taken');
      }

      // Check if email already exists (if provided)
      if (email) {
        const emailCheck = await getDocs(
          query(collection(db, 'relationship_managers'), where('email', '==', email.toLowerCase()))
        );
        
        if (!emailCheck.empty) {
          throw new Error('This Email is already registered');
        }
      }

      // Define permissions based on RM type
      const permissions = rmType === 'user' ? {
        'Create Job': true,
        'View Jobs': true,
        'Create Employee': false,
        'View Employees': false,
        'Settings': false,
      } : {
        'Create Job': false,
        'View Jobs': true,
        'Create Employee': false,
        'View Employees': false,
        'Settings': false,
      };

      // Generate a unique document ID
      const rmRef = doc(collection(db, 'relationship_managers'));
      const docId = rmRef.id;

      // Create RM Document
      const rmData = {
        id: docId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        shortName: shortName.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        permissions: permissions,
        password: password,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        lastLogin: null,
        status: 'active',
        createdBy: user?.id,
        rmType: rmType.toLowerCase(),
      };

      // Create User Credentials
      const userCredentials = {
        id: docId,
        userId: shortName.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password: password,
        role: 'rm',
        permissions: permissions,
        lastLogin: null,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        status: 'active',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        rmType: rmType.toLowerCase(),
      };

      // Save RM data
      await setDoc(doc(db, 'relationship_managers', docId), rmData);

      // Save credentials
      await setDoc(doc(db, 'user_credentials', docId), userCredentials);

      // Create Activity Log
      await addDoc(collection(db, 'activity_logs'), {
        action: 'rm_created',
        performedBy: user?.id,
        targetUser: docId,
        timestamp: serverTimestamp(),
        details: {
          rmName: `${firstName} ${lastName}`,
          shortName: shortName.toLowerCase(),
          rmType: rmType,
        },
      });

      toast({
        title: "RM Created Successfully",
        description: `Login ID: ${shortName.toLowerCase()}`,
      });

      // Clear form
      setFirstName('');
      setLastName('');
      setShortName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRmType('');
      setIsCreateDialogOpen(false);
      
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const updatedData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        ...(password && { password: password }),
        lastUpdated: serverTimestamp(),
      };

      await updateDoc(doc(db, 'relationship_managers', selectedUser.id), updatedData);
      await updateDoc(doc(db, 'user_credentials', selectedUser.id), updatedData);

      toast({
        title: "User Updated Successfully",
        description: "User details have been updated.",
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (rmUser: RMUser) => {
    setSelectedUser(rmUser);
    setFirstName(rmUser.firstName);
    setLastName(rmUser.lastName);
    setEmail(rmUser.email);
    setPhone(rmUser.phone);
    setPassword('');
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (rmUser: RMUser) => {
    setSelectedUser(rmUser);
    setIsViewDialogOpen(true);
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">Access denied. Super admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-gray-800">RM Management</CardTitle>
              <CardDescription className="text-gray-600">
                Create and manage RM users who can access the system
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create New RM
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New RM User</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new RM user.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shortName">Short Name (Login ID) *</Label>
                      <Input
                        id="shortName"
                        placeholder="Enter short name"
                        value={shortName}
                        onChange={(e) => setShortName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="rmType">RM Type *</Label>
                      <Select value={rmType} onValueChange={setRmType} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select RM type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User (Can create jobs)</SelectItem>
                          <SelectItem value="viewer">Viewer (View only)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Creating..." : "Create RM User"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Name</TableHead>
                <TableHead>Short Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((rmUser) => (
                <TableRow key={rmUser.id}>
                  <TableCell className="font-medium">{`${rmUser.firstName} ${rmUser.lastName}`}</TableCell>
                  <TableCell>{rmUser.shortName}</TableCell>
                  <TableCell>{rmUser.email}</TableCell>
                  <TableCell className="capitalize">{rmUser.rmType}</TableCell>
                  <TableCell className="capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rmUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rmUser.status}
                    </span>
                  </TableCell>
                  <TableCell>{rmUser.createdAt?.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openViewDialog(rmUser)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(rmUser)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              View user details and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                  <p className="text-lg">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Short Name</Label>
                  <p className="text-lg">{selectedUser.shortName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-lg">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="text-lg">{selectedUser.phone}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Type</Label>
                <p className="text-lg capitalize">{selectedUser.rmType}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Permissions</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(selectedUser.permissions).map(([permission, hasAccess]) => (
                    <div key={permission} className="flex justify-between items-center">
                      <span>{permission}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {hasAccess ? 'Allowed' : 'Denied'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>
              Update user details and password
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPassword">New Password (leave blank to keep current)</Label>
              <Input
                id="editPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
