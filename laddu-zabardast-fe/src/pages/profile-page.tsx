import { type ChangeEvent } from "react";
import { Container, Column, Row, Box } from "@/components/ui/layout";
import { useAuth, toast } from "@/hooks";
import type { Address, AppUser } from "@/types";
import { useState, useEffect } from "react";
import {
  updateProfile,
  changePassword,
} from "@/routes/auth";
import { saveAddress, deleteAddress } from "@/routes/address";
import { getProfile, getAddresses } from "@/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@mui/material";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  profileSchema,
  addressSchema,
  passwordSchema,
  type ProfileFormValues,
  type AddressFormValues,
  type PasswordFormValues,
} from "@/schema";

interface PasswordStrength {
  length: boolean;
  number: boolean;
  special: boolean;
  uppercase: boolean;
  lowercase: boolean;
}

interface AddressManagerProps {
  user: AppUser;
  token: string | null;
  setUser: (u: AppUser) => void;
}

interface PasswordManagerProps {
  token: string | null;
}

const getProfileCompletion = (user: any) => {
  let filled = 0;
  let total = 4;
  if (user?.firstName) filled++;
  if (user?.lastName) filled++;
  if (user?.email) filled++;
  if (user?.phone) filled++;
  if (user?.photoURL || user?.picture) filled++;
  return Math.round((filled / total) * 100);
};

export default function ProfilePage() {
  const { user, loading: authLoading, token, logout, setUser } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editablePhone, setEditablePhone] = useState(user?.phone || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        if (data && data.user) {
          const u = data.user;
          if (!u.userId) {
            throw new Error("User ID is missing from profile response");
          }
          setUser({
            ...u,
            userId: u.userId,
            id: u.userId,
            firstName: u.firstName ?? "",
            lastName: u.lastName ?? "",
            source: "db",
          });
        }
      } catch (e) {
        console.error("Failed to fetch profile details:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (user?.phone) {
      setEditablePhone(user.phone);
    }
  }, [user?.phone]);

  useEffect(() => {
    if (isClient && !authLoading && !user) {
      toast({
        title: "Access Denied",
        description: "Please log in to view your profile.",
        variant: "destructive",
      });
      router.push("/login?redirect=/profile");
    }
  }, [isClient, authLoading, user, router]);

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard.",
      });
    }
  };

  // Helper: Delete account (mock)
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setTimeout(() => {
      setDeleting(false);
      setShowDeleteDialog(false);
      toast({
        title: "Account Deleted (Mock)",
        description: "Your account would be deleted in a real app.",
      });
      logout();
    }, 2000);
  };

  const handleSavePhone = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update your phone number.",
        variant: "destructive",
      });
      return;
    }

    // Basic validation (can be enhanced with zod)
    const phoneRegex = /^[+]?\d{10,15}$/;
    if (editablePhone && !phoneRegex.test(editablePhone)) {
      toast({
        title: "Invalid Phone Number",
        description:
          "Please enter a valid phone number (10-15 digits, optionally starting with +).",
        variant: "destructive",
      });
      return;
    }
    if (!editablePhone && user?.phone) {
      // If clearing an existing phone number
      // Allow clearing if desired, or add specific logic
    } else if (!editablePhone && !user?.phone) {
      // No change if both are empty
      setIsEditingPhone(false);
      return;
    }

    setIsSavingPhone(true);
    try {
      await updateProfile({ phone: editablePhone });
      toast({
        title: "Phone Number Updated",
        description: "Your phone number has been successfully updated.",
      });
      setUser({ ...user!, phone: editablePhone === "" ? null : editablePhone }); // Update user context, store null if empty
      setIsEditingPhone(false);
    } catch (error: any) {
      console.error("Failed to update phone number:", error);
      toast({
        title: "Error",
        description:
          error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  if (!isClient || authLoading) {
    return (
      <Container className="px-4 py-8 md:px-6 md:py-12">
        <h1 className="text-3xl font-bold mb-6 text-gradient text-center">
          Loading Profile...
        </h1>
        <Row className="justify-center">
          <Card className="w-full max-w-3xl animate-pulse">
            <CardHeader className="items-center text-center border-b pb-6">
              <Box className="relative group mb-4 w-32 h-32 rounded-full bg-muted"></Box>
              <Box className="h-7 w-48 bg-muted rounded mb-2"></Box>
              <Box className="h-5 w-64 bg-muted rounded"></Box>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <Box className="h-10 w-full bg-muted rounded"></Box>
              <Box className="h-10 w-full bg-muted rounded"></Box>
              <Box className="h-10 w-full bg-muted rounded"></Box>
            </CardContent>
          </Card>
        </Row>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="px-4 py-8 md:px-6 md:py-12 text-center">
        <p>Redirecting to login...</p>
      </Container>
    );
  }

  // Always prefer firstName, fallback to email prefix
  const displayName =
    user?.firstName || (user?.email ? user.email.split("@")[0] : "");

  return (
    <Container className="px-4 py-8 md:px-6 md:py-12">
      <Row className="flex-col md:flex-row items-center justify-between mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-300 bg-clip-text text-transparent flex items-center gap-2 animate-fade-in-down drop-shadow-lg">
          <Icon
            icon="User"
            className="h-7 w-7 animate-bounce-slow text-orange-600"
          />{" "}
          Profile
        </h1>
        <Row className="items-center gap-2 mt-4 md:mt-0">
          <Button
            variant="outlined"
            onClick={() => router.push("/orders")}
            className="transition-all duration-200 hover:scale-105 hover:border-orange-400"
          >
            <Icon icon="ShoppingBag" className="mr-2 h-4 w-4" /> My Orders
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={logout}
            className="transition-all duration-200 hover:scale-105"
          >
            <Icon icon="LogOut" className="mr-2 h-4 w-4" /> Logout
          </Button>
        </Row>
      </Row>
      <Tabs defaultValue="profile" className="w-full animate-fade-in">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 md:w-auto mb-8 bg-orange-50/80 border-orange-200 rounded-xl shadow-sm dark:bg-zinc-900 dark:border-zinc-700">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-200 data-[state=active]:text-orange-900 data-[state=active]:shadow-md dark:data-[state=active]:from-orange-500 dark:data-[state=active]:to-yellow-400 dark:data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-700"
          >
            <Icon icon="User" className="h-4 w-4" /> Profile Details
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-200 data-[state=active]:text-orange-900 data-[state=active]:shadow-md dark:data-[state=active]:from-orange-500 dark:data-[state=active]:to-yellow-400 dark:data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-700"
          >
            <Icon icon="MapPin" className="h-4 w-4" /> Addresses
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-400 data-[state=active]:to-yellow-200 data-[state=active]:text-orange-900 data-[state=active]:shadow-md dark:data-[state=active]:from-orange-500 dark:data-[state=active]:to-yellow-400 dark:data-[state=active]:text-zinc-900 dark:data-[state=active]:border-zinc-700"
          >
            <Icon icon="ShieldCheck" className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-gradient-to-br from-orange-50 via-yellow-50 to-white animate-fade-in-up dark:bg-zinc-900 dark:border-zinc-700">
            <CardHeader className="flex flex-col items-center text-center border-b pb-6 bg-gradient-to-r from-orange-100 to-yellow-50 rounded-t-xl dark:bg-gradient-to-r dark:from-zinc-900 dark:to-zinc-800 dark:border-zinc-700">
              <Avatar className="w-24 h-24 border-4 border-orange-300 bg-white shadow-lg mb-2 dark:border-orange-200 dark:bg-zinc-800">
                <AvatarImage
                  src={user?.photoURL || user?.picture || undefined}
                  alt={displayName || "User"}
                />
                <AvatarFallback className="text-3xl bg-orange-100 text-orange-600 dark:bg-zinc-800 dark:text-zinc-100">
                  {displayName.charAt(0).toUpperCase() || <Icon icon="User" />}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl flex items-center gap-2 justify-center text-orange-700 font-bold dark:text-yellow-300">
                <Icon
                  icon="User"
                  className="h-5 w-5 text-orange-400 dark:text-yellow-400"
                />{" "}
                Profile Details
              </CardTitle>
              <CardDescription className="text-orange-600 dark:text-zinc-300 mt-1 font-medium">
                Your account information is shown below.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 dark:bg-zinc-900">
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Box>
                  <Label className="text-orange-700 font-semibold">
                    First Name
                  </Label>
                  <Box className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                    {user?.firstName ?? "—"}
                  </Box>
                </Box>
                <Box>
                  <Label className="text-orange-700 font-semibold">
                    Last Name
                  </Label>
                  <Box className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                    {user?.lastName ?? "—"}
                  </Box>
                </Box>
                <Box>
                  <Label className="text-orange-700 font-semibold">Email</Label>
                  <Box className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm flex items-center gap-2 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                    {user?.email || "-"}
                    <Button
                      variant="text"
                      size="small"
                      className="ml-1 hover:bg-orange-100 dark:hover:bg-zinc-700"
                      onClick={handleCopyEmail}
                      title="Copy Email"
                    >
                      <Icon icon="Copy" className="h-4 w-4 text-orange-400" />
                    </Button>
                  </Box>
                </Box>
                <Box>
                  <Label className="text-orange-700 font-semibold">
                    Phone Number
                  </Label>
                  {isEditingPhone ? (
                    <Row className="items-center gap-2 mt-1">
                      <Input
                        type="tel"
                        value={editablePhone}
                        onChange={(e) => setEditablePhone(e.target.value)}
                        placeholder="Enter phone number"
                        className="bg-white dark:bg-zinc-800"
                      />
                      <Button
                        size="small"
                        onClick={handleSavePhone}
                        disabled={isSavingPhone}
                        className="bg-green-500 hover:bg-green-600 text-white"
                      >
                        {isSavingPhone ? (
                          <Icon
                            icon="Loader2"
                            className="h-4 w-4 animate-spin"
                          />
                        ) : (
                          <Icon icon="Save" className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setIsEditingPhone(false)}
                        disabled={isSavingPhone}
                      >
                        Cancel
                      </Button>
                    </Row>
                  ) : (
                    <Row className="bg-orange-50 border rounded px-3 py-2 mt-1 text-orange-900 shadow-sm items-center justify-between dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100">
                      <span>{user?.phone || "-"}</span>
                      <Button
                        variant="text"
                        size="small"
                        className="ml-1 hover:bg-orange-100 dark:hover:bg-zinc-700"
                        onClick={() => {
                          setEditablePhone(user?.phone || "");
                          setIsEditingPhone(true);
                        }}
                        title="Edit Phone"
                      >
                        <Icon icon="Edit" className="h-4 w-4 text-orange-400" />
                      </Button>
                    </Row>
                  )}
                </Box>
              </Box>
              {user && typeof (user as any).createdAt === "string" && (
                <Row className="items-center gap-2 justify-center mt-8">
                  <Icon icon="Calendar" className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-orange-500">
                    Joined:{" "}
                    {new Date((user as any).createdAt).toLocaleDateString()}
                  </span>
                </Row>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="addresses">
          <AddressManager user={user} token={token} setUser={setUser} />
        </TabsContent>
        <TabsContent value="security">
          <PasswordManager token={token} />
        </TabsContent>
      </Tabs>
    </Container>
  );
}

function AddressManager({
  user,
  token,
  setUser,
}: {
  user: AppUser;
  token: string | null;
  setUser: (u: AppUser) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>(user?.addresses || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form, setForm] = useState<AddressFormValues>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAddresses(user?.addresses || []);
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getAddresses(token ?? undefined);
      setAddresses(data.addresses || []);
      setUser({
        source: "jwt",
        userId: user?.userId || (user as any)?.id || "",
        id: user?.id || user?.userId || "",
        email: user?.email ?? null,
        firstName: user?.firstName ?? "",
        lastName: user?.lastName ?? "",
        phone: user?.phone ?? null,
        photoURL: user?.photoURL ?? null,
        role: user?.role ?? null,
        isAdmin: user?.isAdmin ?? false,
        picture: user?.picture ?? null,
        addresses: data.addresses || [],
      });
    } catch (e) {
      console.error("Failed to fetch addresses:", e);
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
    setForm({
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      isDefault: false,
    });
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await saveAddress(
        form,
        token ?? undefined,
        editingIndex === null ? "POST" : "PUT",
      );
      await fetchAddresses();
      handleCancel();
      toast({ title: "Address saved!" });
    } catch (err: any) {
      toast({
        title: err.message || "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await deleteAddress(id, token ?? undefined);
      await fetchAddresses();
      toast({ title: "Address deleted!" });
    } catch (err: any) {
      toast({
        title: err.message || "Failed to delete address",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Column className="space-y-4">
      <h2 className="text-lg font-bold text-orange-700 mb-2">Your Addresses</h2>
      {addresses.map((addr, idx) => (
        <Card key={idx} className="mb-2">
          <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4">
            <Box>
              <Box className="font-semibold">
                {addr.street}, {addr.city}, {addr.state}, {addr.country} -{" "}
                {addr.postalCode}
              </Box>
              {addr.isDefault && <Badge variant="default">Default</Badge>}
            </Box>
            <Row className="gap-2">
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleEdit(idx)}
              >
                Edit
              </Button>
              <Button
                size="small"
                variant="contained"
                color="error"
                onClick={() => handleDelete(addr.id ?? "")} /// need to verify
              >
                Delete
              </Button>
            </Row>
          </CardContent>
        </Card>
      ))}
      <Box className="mt-4">
        <h3 className="font-semibold mb-2">
          {editingIndex === null ? "Add New Address" : "Edit Address"}
        </h3>
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            name="street"
            placeholder="Street"
            value={form.street}
            onChange={handleChange}
          />
          <Input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
          />
          <Input
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
          />
          <Input
            name="postalCode"
            placeholder="Postal Code"
            value={form.postalCode}
            onChange={handleChange}
          />
          <Input
            name="country"
            placeholder="Country"
            value={form.country}
            onChange={handleChange}
          />
        </Box>
        <Row className="gap-2 mt-2">
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {editingIndex === null ? "Add Address" : "Save Changes"}
          </Button>
          {editingIndex !== null && (
            <Button variant="outlined" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </Row>
      </Box>
    </Column>
  );
}

function PasswordManager({ token }: { token: string | null }) {
  const [form, setForm] = useState<PasswordFormValues>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    number: false,
    special: false,
    uppercase: false,
    lowercase: false,
  });

  const validatePassword = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
    });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "newPassword") {
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
      Object.values(passwordStrength).some((v) => v)
    );
  };

  const handleSave = async () => {
    if (!token || !isFormValid()) return;

    setLoading(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      toast({
        title: "Success!",
        description: "Your password has been updated successfully.",
        variant: "default",
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStrength({
        length: false,
        number: false,
        special: false,
        uppercase: false,
        lowercase: false,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = (isValid: boolean) =>
    isValid ? "text-green-500" : "text-muted-foreground";

  return (
    <Column className="space-y-6 max-w-md mx-auto">
      <Box className="border rounded-lg p-6 bg-card">
        <h2 className="text-xl font-semibold text-gradient mb-4">
          Change Password
        </h2>

        <Column className="space-y-4">
          <Box>
            <label className="text-sm font-medium mb-1 block">
              Current Password
            </label>
            <Input
              name="currentPassword"
              type="password"
              placeholder="Enter current password"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full"
            />
          </Box>

          <Box>
            <label className="text-sm font-medium mb-1 block">
              New Password
            </label>
            <Input
              name="newPassword"
              type="password"
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full"
            />
          </Box>

          <Box>
            <label className="text-sm font-medium mb-1 block">
              Confirm New Password
            </label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full"
            />
            {form.newPassword &&
              form.confirmPassword &&
              form.newPassword !== form.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  Passwords do not match
                </p>
              )}
          </Box>

          <Box className="bg-muted/50 rounded-lg p-4 mt-4">
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
          </Box>

          <Button
            onClick={handleSave}
            disabled={loading || !isFormValid()}
            className="w-full"
            variant="contained"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </Column>
      </Box>
    </Column>
  );
}

// End of file
