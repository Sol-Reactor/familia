import { useState, useRef, useEffect } from 'react';
import { Camera, Shield, UserCog, Palette, Moon, Sun, Trash2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { FormField, FormAlert, PasswordInput, getPasswordIssues } from '../components/common/FormField';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useUpdateProfile, useUpdatePassword, useDeleteAccount } from '../api/users';
import { uploadToCloudinary, validateImageFile } from '../lib/cloudinary';
import { cn, getErrorMessage, getInitials, safeExternalUrl } from '../lib/utils';

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <CardHeader className="flex flex-row items-start gap-3 space-y-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>
      <div>
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
      </div>
    </CardHeader>
  );
}

function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

function ProfileSection() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const avatarPreview = useObjectUrl(profilePicture);
  const coverPreview = useObjectUrl(coverPhoto);
  const profilePictureRef = useRef(null);
  const coverPhotoRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const pickFile = (setter) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setter(file);
  };

  const validate = () => {
    const errors = {};
    const name = profileData.name.trim();
    if (name.length < 2 || name.length > 50) errors.name = 'Name must be between 2 and 50 characters';
    const username = profileData.username.trim();
    if (username && !/^[A-Za-z0-9._-]{2,50}$/.test(username)) {
      errors.username = '2-50 characters: letters, numbers, dots, dashes or underscores';
    }
    const website = profileData.website.trim();
    if (website && !safeExternalUrl(website)) errors.website = 'Enter a full URL starting with https://';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (!validate()) return;
    setUploading(true);

    try {
      const payload = {
        name: profileData.name.trim(),
        username: profileData.username.trim(),
        bio: profileData.bio.trim(),
        location: profileData.location.trim(),
        website: profileData.website.trim(),
      };

      if (profilePicture) payload.avatarUrl = (await uploadToCloudinary(profilePicture)).url;
      if (coverPhoto) payload.coverUrl = (await uploadToCloudinary(coverPhoto)).url;

      await updateProfile.mutateAsync(payload);
      setStatus({ type: 'success', text: 'Profile updated successfully.' });
      setProfilePicture(null);
      setCoverPhoto(null);
    } catch (error) {
      setStatus({ type: 'error', text: getErrorMessage(error, 'Failed to update profile') });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <SectionHeader icon={UserCog} title="Profile information" description="This is how other people see you on Familia." />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Cover + avatar picker */}
          <div>
            <div className="relative h-32 overflow-hidden rounded-xl brand-gradient sm:h-40">
              {(coverPreview || user?.coverUrl) && (
                <img src={coverPreview || user?.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute bottom-3 right-3 bg-card/90 shadow"
                onClick={() => coverPhotoRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {coverPhoto ? 'Change cover' : 'Edit cover'}
              </Button>
            </div>
            <div className="-mt-10 flex items-end gap-4 px-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-card shadow-md">
                  <AvatarImage src={avatarPreview || user?.avatarUrl} alt="" />
                  <AvatarFallback className="text-2xl">{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => profilePictureRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-card bg-secondary text-foreground shadow transition-colors hover:bg-accent"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {(profilePicture || coverPhoto) && (
                <p className="pb-2 text-xs text-muted-foreground">New photos will upload when you save.</p>
              )}
            </div>
            <input ref={profilePictureRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" tabIndex={-1} onChange={pickFile(setProfilePicture)} />
            <input ref={coverPhotoRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" tabIndex={-1} onChange={pickFile(setCoverPhoto)} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Name" id="name" name="name" autoComplete="name" value={profileData.name} onChange={handleChange} maxLength={50} error={fieldErrors.name} required />
            <FormField label="Username" id="username" name="username" autoComplete="username" value={profileData.username} onChange={handleChange} maxLength={50} placeholder="your.name" error={fieldErrors.username} hint="Optional. Letters, numbers, dots, dashes and underscores." />
            <FormField label="Email" id="email" value={user?.email || ''} disabled hint="Email can't be changed." />
            <FormField label="Location" id="location" name="location" autoComplete="address-level2" placeholder="City, Country" value={profileData.location} onChange={handleChange} maxLength={100} />
            <FormField className="md:col-span-2" label="Website" id="website" name="website" type="url" inputMode="url" autoComplete="url" placeholder="https://your-site.com" value={profileData.website} onChange={handleChange} error={fieldErrors.website} />
          </div>

          <FormField label="Bio" id="bio" hint={`${profileData.bio.length}/200`}>
            <Textarea name="bio" value={profileData.bio} onChange={handleChange} placeholder="Tell us about yourself…" rows={4} maxLength={200} />
          </FormField>

          <FormAlert type={status.type || 'error'}>{status.text}</FormAlert>

          <div className="flex justify-end">
            <Button type="submit" loading={uploading}>
              {uploading ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const updatePassword = useUpdatePassword();
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleChange = (e) => setPasswordData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    const issues = getPasswordIssues(passwordData.newPassword);
    if (issues.length) {
      setStatus({ type: 'error', text: `New password needs ${issues.join(', ')}.` });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      await updatePassword.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setStatus({ type: 'success', text: 'Password updated. Other devices have been signed out.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setStatus({ type: 'error', text: getErrorMessage(error, 'Failed to update password') });
    }
  };

  return (
    <Card>
      <SectionHeader icon={Shield} title="Security" description="Changing your password signs you out everywhere else." />
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Hidden username helps password managers associate the change */}
          <input type="text" name="username" autoComplete="username" value={useAuthStore.getState().user?.email || ''} readOnly hidden />
          <FormField label="Current password" id="currentPassword">
            <PasswordInput name="currentPassword" autoComplete="current-password" value={passwordData.currentPassword} onChange={handleChange} required />
          </FormField>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="New password" id="newPassword" hint="At least 8 characters with a letter and a number.">
              <PasswordInput name="newPassword" autoComplete="new-password" value={passwordData.newPassword} onChange={handleChange} maxLength={72} required />
            </FormField>
            <FormField label="Confirm new password" id="confirmPassword">
              <PasswordInput name="confirmPassword" autoComplete="new-password" value={passwordData.confirmPassword} onChange={handleChange} maxLength={72} required />
            </FormField>
          </div>
          <FormAlert type={status.type || 'error'}>{status.text}</FormAlert>
          <div className="flex justify-end">
            <Button type="submit" loading={updatePassword.isPending} disabled={!passwordData.currentPassword || !passwordData.newPassword}>
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function AppearanceSection() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];

  return (
    <Card>
      <SectionHeader icon={Palette} title="Appearance" description="Choose how Familia looks on this device." />
      <CardContent>
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-2 gap-3 sm:max-w-sm">
          {options.map(({ value, label, icon: Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors',
                  selected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DangerZone() {
  const deleteAccount = useDeleteAccount();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleDelete = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await deleteAccount.mutateAsync(password);
      toast.success('Your account has been deleted');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete account'));
    }
  };

  return (
    <Card className="border-destructive/40">
      <SectionHeader icon={Trash2} title="Delete account" description="Permanently remove your account, posts, comments and messages." />
      <CardContent>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setPassword(''); setError(''); }}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive">
              Delete my account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>This can&apos;t be undone. Enter your password to confirm.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleDelete} className="space-y-4">
              <FormAlert>{error}</FormAlert>
              <FormField label="Password" id="delete-password">
                <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" variant="destructive" loading={deleteAccount.isPending} disabled={!password}>
                  Delete permanently
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  return (
    <MainLayout title="Settings">
      <div className="space-y-4 sm:space-y-6">
        <header className="px-1">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile, security and preferences.</p>
        </header>
        <ProfileSection />
        <SecuritySection />
        <AppearanceSection />
        <DangerZone />
      </div>
    </MainLayout>
  );
}
