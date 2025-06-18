
import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
          createdBy: data.createdBy
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
      <Card>
        <CardHeader>
          <CardTitle>Create RM User</CardTitle>
          <CardDescription>
            Create new RM users who can manage jobs and shipments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
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
                <Label htmlFor="shortName">Short Name (Login ID)</Label>
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
                <Label htmlFor="rmType">RM Type</Label>
                <Select value={rmType} onValueChange={setRmType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select RM type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create RM User"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>RM Users</CardTitle>
          <CardDescription>
            Manage existing RM users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Short Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((rmUser) => (
                <TableRow key={rmUser.id}>
                  <TableCell>{`${rmUser.firstName} ${rmUser.lastName}`}</TableCell>
                  <TableCell>{rmUser.shortName}</TableCell>
                  <TableCell>{rmUser.email}</TableCell>
                  <TableCell className="capitalize">{rmUser.rmType}</TableCell>
                  <TableCell className="capitalize">{rmUser.status}</TableCell>
                  <TableCell>
                    {rmUser.createdAt?.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
