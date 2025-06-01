// src/app/profile/page.tsx
"use client";

import { type ChangeEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import type { Address, AppUser } from '@/types/product';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Schema definitions
const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^[+]?\d{10,15}$/).optional().or(z.literal('')),
  photoURL: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().url().optional()
  ),
});

const addressSchema = z.object({
  street: z.string().min(5, "Street address is too short."),
  city: z.string().min(2, "City name is too short."),
  state: z.string().min(2, "State name is too short."),
  postalCode: z.string().min(5, "Invalid postal code.").max(10, "Invalid postal code."),
  country: z.string().min(2, "Country name is too short."),
  isDefault: z.boolean().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string().min(6, "Please confirm your new password."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

interface PasswordStrength {
  length: boolean;
  number: boolean;
  special: boolean;
  uppercase: boolean;
  lowercase: boolean;
}

// Component Props
interface AddressManagerProps {
  user: AppUser;
  token: string | null;
  setUser: (u: AppUser) => void;
}

interface PasswordManagerProps {
  token: string | null;
}

// Mock address data
const mockAddresses: Address[] = [
  {
    // id: 'addr1',
    street: '123 Sweet Street, Apt 4B',
    city: 'Foodville',
    state: 'Flavoria',
    country: 'India',
    postalCode: '12345',
    isDefault: true,
  },
  {
    // id: 'addr2',
    street: '456 Spice Lane, Unit 7',
    city: 'Tastytown',
    state: 'Aromaland',
    country: 'India',
    postalCode: '67890',
  },
];

// Helper: Calculate profile completion
const getProfileCompletion = (user: any) => {
  let filled = 0;
  let total = 4; // firstName, lastName, email, phone, photo
  if (user?.firstName) filled++;
  if (user?.lastName) filled++;
  if (user?.email) filled++;
  if (user?.phone) filled++;
  if (user?.photoURL || user?.picture) filled++;
  return Math.round((filled / total) * 100);
};

// Mock recent activity
const recentActivity = [
  { date: '2025-05-19', action: 'Changed password' },
  { date: '2025-05-18', action: 'Updated address' },
  { date: '2025-05-15', action: 'Placed an order' },
];

export default function ProfilePage() {
  const { user, loading: authLoading, token, logout, setUser } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editablePhone, setEditablePhone] = useState(user?.phone || '');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user && token) {
      (async () => {
        try {
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            // Defensive: ensure firstName/lastName fallback to empty string if missing
            setUser({
              ...data.user,
              firstName: data.user.firstName ?? '',
              lastName: data.user.lastName ?? '',
              source: 'db',
            });
          }
        } catch (e) {}
      })();
    }
  }, [token]);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      toast({ title: "Access Denied", description: "Please log in to view your profile.", variant: "destructive" });
      router.push('/login?redirect=/profile');
    }
  }, [isClient, authLoading, user, router]);

  // Helper: Copy email to clipboard
  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      toast({ title: 'Copied!', description: 'Email address copied to clipboard.' });
    }
  };

  // Helper: Delete account (mock)
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setShowDeleteDialog(false);
      toast({ title: 'Account Deleted (Mock)', description: 'Your account would be deleted in a real app.' });
      logout();
    }, 2000);
  };

  const handleSavePhone = async () => {
    if (!token) {
      toast({ title: "Authentication Error", description: "You must be logged in to update your phone number.", variant: "destructive" });
      return;
    }

    // Basic validation (can be enhanced with zod)
    const phoneRegex = /^[+]?\d{10,15}$/;
    if (editablePhone && !phoneRegex.test(editablePhone)) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number (10-15 digits, optionally starting with +).", variant: "destructive" });
      return;
    }
    if (!editablePhone && user?.phone) { // If clearing an existing phone number
        // Allow clearing if desired, or add specific logic
    } else if (!editablePhone && !user?.phone) { // No change if both are empty
        setIsEditingPhone(false);
        return;
    }


    setIsSavingPhone(true);
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: editablePhone }), // Send empty string if clearing, or the new number
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: "Phone Number Updated", description: "Your phone number has been successfully updated." });
        setUser({ ...user!, phone: editablePhone === '' ? null : editablePhone }); // Update user context, store null if empty
        setIsEditingPhone(false);
      } else {
        toast({ title: "Update Failed", description: result.error || "Could not update phone number.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update phone number:", error);
      toast({ title: "Error", description: "An unexpected error occurred. Please try again.", variant: "destructive" });
    } finally {
      setIsSavingPhone(false);
    }
  };


  if (!isClient || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-3xl font-bold mb-6 text-gradient text-center">Loading Profile...</h1>
        <div className="flex justify-center">
          <Card className="w-full max-w-3xl animate-pulse">
            <CardHeader className="items-center text-center border-b pb-6">
              <div className="relative group mb-4 w-32 h-32 rounded-full bg-muted"></div>
              <div className="h-7 w-48 bg-muted rounded mb-2"></div>
              <div className="h-5 w-64 bg-muted rounded"></div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="h-10 w-full bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
              <div className="h-10 w-full bg-muted rounded"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 text-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  // Always prefer firstName, fallback to email prefix
  const displayName = user?.firstName || (user?.email ? user.email.split('@')[0] : '');

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-300 bg-clip-text text-transparent flex items-center gap-2 animate-fade-in-down drop-shadow-lg">
          <Icon icon="User" className="h-7 w-7 animate-bounce-slow text-orange-600" /> Profile
        </h1>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={() => router.push('/orders')} className="transition-all duration-200 hover:scale-105 hover:border-orange-400">
            <Icon icon="ShoppingBag" className="mr-2 h-4 w-4" /> My Orders
          </Button>
          <Button variant="destructive" onClick={logout} className="transition-all duration-200 hover:scale-105">
            <Icon icon="LogOut" className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </div>
      <Tabs defaultValue="profile" className="w-full animate-fade-in">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:w-auto mb-8 bg-orange-50/80 border-orange-200 rounded-xl shadow-sm dark:bg-zinc-900 dark:border-zinc-700">
          <TabsTrigger value="profile" className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-200 data-[state=active]:text-orange-900 data-[state=active]:shadow-md dark:data-[state=active]:from-orange-500 dark:data-[state=active]:to-yellow-400 dark:data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-700">
            <Icon icon="User" className="h-4 w-4"/> Profile Details
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-200 data-[state=active]:text-orange-900 data-[state=active]:shadow-md dark:data-[state=active]:from-orange-500 dark:data-[state=active]:to-yellow-400 dark:data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-700">
            <Icon icon="MapPin" className="h-4 w-4"/> Addresses
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-200 data-[state=active]:text-orange-900 data-[state=active]:shadow-md dark:data-[state=active]:from-orange-500 dark:data-[state=active]:to-yellow-400 dark:data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-700">
            <Icon icon="ShieldCheck" className="h-4 w-4"/> Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-white animate-fade-in-up dark:bg-zinc-900 dark:border-zinc-700">
            <CardHeader className="flex flex-col items-center text-center border-b pb-6 bg-gradient-to-r from-orange-100 to-yellow-50 rounded-t-xl dark:bg-gradient-to-r dark:from-zinc-900 dark:to-zinc-800 dark:border-zinc-700">
              <Avatar className="w-24 h-24 border-4 border-orange-300 bg-white shadow-lg mb-2 dark:border-orange-200 dark:bg-zinc-800">
                <AvatarImage src={user?.photoURL || user?.picture || undefined} alt={displayName || 'User'} />
                <AvatarFallback className="text-3xl bg-orange-100 text-orange-600 dark:bg-zinc-800 dark:text-zinc-100">
                  {displayName.charAt(0).toUpperCase() || <Icon icon="User" />}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl flex items-center gap-2 justify-center text-orange-700 font-bold dark:text-yellow-300">
                <Icon icon="User" className="h-5 w-5 text-orange-400 dark:text-yellow-400" /> Profile Details
              </CardTitle>
              <CardDescription className="text-orange-600 dark:text-zinc-300 mt-1 font-medium">
                Your account information is shown below.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 dark:bg-zinc-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-orange-700 font-semibold">First Name</Label>
                  <div className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">{user?.firstName || '-'}</div>
                </div>
                <div>
                  <Label className="text-orange-700 font-semibold">Last Name</Label>
                  <div className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">{user?.lastName || '-'}</div>
                </div>
                <div>
                  <Label className="text-orange-700 font-semibold">Email</Label>
                  <div className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm flex items-center gap-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                    {user?.email || '-'}
                    <Button variant="ghost" size="icon" className="ml-1 hover:bg-orange-100 dark:hover:bg-zinc-700" onClick={handleCopyEmail} title="Copy Email">
                      <Icon icon="Copy" className="h-4 w-4 text-orange-400" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-orange-700 font-semibold">Phone Number</Label>
                  {isEditingPhone ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="tel"
                        value={editablePhone}
                        onChange={(e) => setEditablePhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="bg-white dark:bg-zinc-800"
                      />
                      <Button size="sm" onClick={handleSavePhone} disabled={isSavingPhone} className="bg-green-500 hover:bg-green-600 text-white">
                        {isSavingPhone ? <Icon icon="Loader2" className="h-4 w-4 animate-spin" /> : <Icon icon="Save" className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingPhone(false)} disabled={isSavingPhone}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm flex items-center justify-between dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                      <span>{user?.phone || '-'}</span>
                      <Button variant="ghost" size="icon" className="ml-1 hover:bg-orange-100 dark:hover:bg-zinc-700" onClick={() => { setEditablePhone(user?.phone || ''); setIsEditingPhone(true); }} title="Edit Phone">
                        <Icon icon="Edit" className="h-4 w-4 text-orange-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {user && typeof (user as any).createdAt === 'string' && (
                <div className="flex items-center gap-2 justify-center mt-8">
                  <Icon icon="Calendar" className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-orange-500">Joined: {new Date((user as any).createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="addresses">
          {/* Address management logic restored */}
          <AddressManager user={user} token={token} setUser={setUser} />
        </TabsContent>
        <TabsContent value="security">
          {/* Password update logic restored */}
          <PasswordManager token={token} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// AddressManager and PasswordManager components (restored logic)

function AddressManager({ user, token, setUser }: { user: AppUser, token: string | null, setUser: (u: AppUser) => void }) {
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<AddressFormValues>({ street: '', city: '', state: '', postalCode: '', country: '', isDefault: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAddresses(user?.addresses || []);
  }, [user]);

  const fetchAddresses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
        setUser({
          source: 'jwt',
          userId: user?.userId || '',
          email: user?.email ?? null,
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          phone: user?.phone ?? null,
          photoURL: user?.photoURL ?? null,
          role: user?.role ?? null,
          isAdmin: user?.isAdmin ?? false,
          picture: user?.picture ?? null,
          addresses: data.addresses || [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    setForm(addresses[idx]);
  };
  const handleCancel = () => {
    setEditingIndex(null);
    setForm({ street: '', city: '', state: '', postalCode: '', country: '', isDefault: false });
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/addresses', {
        method: editingIndex === null ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchAddresses();
        handleCancel();
        toast({ title: 'Address saved!' });
      } else {
        toast({ title: 'Failed to save address', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (idx: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/addresses/${idx}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchAddresses();
        toast({ title: 'Address deleted!' });
      } else {
        toast({ title: 'Failed to delete address', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-orange-700 mb-2">Your Addresses</h2>
      {addresses.map((addr, idx) => (
        <Card key={idx} className="mb-2">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4">
            <div>
              <div className="font-semibold">{addr.street}, {addr.city}, {addr.state}, {addr.country} - {addr.postalCode}</div>
              {addr.isDefault && <Badge variant="default">Default</Badge>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(idx)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(idx)}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <div className="mt-4">
        <h3 className="font-semibold mb-2">{editingIndex === null ? 'Add New Address' : 'Edit Address'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input name="street" placeholder="Street" value={form.street} onChange={handleChange} />
          <Input name="city" placeholder="City" value={form.city} onChange={handleChange} />
          <Input name="state" placeholder="State" value={form.state} onChange={handleChange} />
          <Input name="postalCode" placeholder="Postal Code" value={form.postalCode} onChange={handleChange} />
          <Input name="country" placeholder="Country" value={form.country} onChange={handleChange} />
        </div>
        <div className="flex gap-2 mt-2">
          <Button onClick={handleSave} disabled={loading}>{editingIndex === null ? 'Add Address' : 'Save Changes'}</Button>
          {editingIndex !== null && <Button variant="outline" onClick={handleCancel}>Cancel</Button>}
        </div>
      </div>
    </div>
  );
}

function PasswordManager({ token }: { token: string | null }) {
  const [form, setForm] = useState<PasswordFormValues>({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
    lowercase: false
  });

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password)
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'newPassword') {
      validatePassword(value);
    }
  };

  const isFormValid = () => {
    return (
      form.currentPassword && 
      form.newPassword && 
      form.confirmPassword &&
      form.newPassword === form.confirmPassword &&
      form.newPassword.length >= 8 &&
      Object.values(passwordStrength).some(v => v)
    );
  };

  const handleSave = async () => {
    if (!token || !isFormValid()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword
        }),
      });

      if (res.ok) {
        toast({
          title: "Success!",
          description: "Your password has been updated successfully.",
          variant: "default",
        });
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStrength({
          length: false,
          number: false,
          special: false,
          uppercase: false,
          lowercase: false
        });
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "Failed to update password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = (isValid: boolean) => 
    isValid ? "text-green-500" : "text-muted-foreground";

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold text-gradient mb-4">Change Password</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Current Password</label>
            <Input
              name="currentPassword"
              type="password"
              placeholder="Enter current password"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">New Password</label>
            <Input
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Confirm New Password</label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full"
            />
            {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <h3 className="text-sm font-medium mb-2">Password Requirements:</h3>
            <ul className="space-y-2 text-sm">
              <li className={strengthColor(passwordStrength.length)}>
                ✓ At least 8 characters long
              </li>
              <li className={strengthColor(passwordStrength.uppercase)}>
                ✓ Contains uppercase letter
              </li>
              <li className={strengthColor(passwordStrength.lowercase)}>
                ✓ Contains lowercase letter
              </li>
              <li className={strengthColor(passwordStrength.number)}>
                ✓ Contains number
              </li>
              <li className={strengthColor(passwordStrength.special)}>
                ✓ Contains special character
              </li>
            </ul>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading || !isFormValid()}
            className="w-full"
            variant="gradient"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// End of file
