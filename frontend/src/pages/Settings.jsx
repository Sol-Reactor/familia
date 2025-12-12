import { useState, useRef } from 'react';
import { Camera, Shield, Sparkles, UserCog } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { useAuthStore } from '../stores/authStore';
import { useUpdateProfile, useUpdatePassword } from '../api/users';
import { uploadToCloudinary } from '../lib/cloudinary';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
    location: user?.location || '',
    website: user?.website || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const profilePictureRef = useRef(null);
  const coverPhotoRef = useRef(null);

  const getInitials = (name) => {
    return name?.substring(0, 2).toUpperCase() || 'U';
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setUploading(true);

    try {
      let profilePictureUrl = user?.profilePicture;
      let coverPhotoUrl = user?.coverPhoto;

      if (profilePicture) {
        const result = await uploadToCloudinary(profilePicture);
        profilePictureUrl = result.url;
      }

      if (coverPhoto) {
        const result = await uploadToCloudinary(coverPhoto);
        coverPhotoUrl = result.url;
      }

      const updatedUser = await updateProfile.mutateAsync({
        name: profileData.name,
        username: profileData.username,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        avatarUrl: profilePictureUrl,
        coverUrl: coverPhotoUrl
      });

      setUser(updatedUser);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setProfilePicture(null);
      setCoverPhoto(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      await updatePassword.mutateAsync({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update password',
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-facebook-primary via-blue-500 to-indigo-500 text-white p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-white">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Settings
                <Sparkles className="h-5 w-5" />
              </h1>
              <p className="text-white/80">Update your profile, security, and preferences.</p>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <UserCog className="h-5 w-5 text-facebook-primary" />
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-gray-200">
                  <AvatarImage
                    src={profilePicture ? URL.createObjectURL(profilePicture) : user?.avatarUrl}
                    alt={user?.name}
                  />
                  <AvatarFallback>
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-3">
                  <input
                    ref={profilePictureRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => profilePictureRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Change Profile Picture
                  </Button>

                  <input
                    ref={coverPhotoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setCoverPhoto(e.target.files?.[0] || null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => coverPhotoRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {coverPhoto ? 'Cover Selected' : 'Change Cover Photo'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email
                  </label>
                  <Input value={profileData.email} disabled />
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location
                  </label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City, Country"
                    value={profileData.location}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="website" className="text-sm font-medium">
                    Website
                  </label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="https://your-site.com"
                    value={profileData.website}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="bio" className="text-sm font-medium">
                  Bio
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={uploading} className="bg-facebook-primary text-white">
                  {uploading ? 'Updating...' : 'Save Changes'}
                </Button>
                {message.text && (
                  <span className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                    {message.text}
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-5 w-5 text-facebook-primary" />
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <Button type="submit" className="bg-facebook-primary text-white">Update Password</Button>
              {message.text && message.type === 'error' && (
                <p className="text-sm text-red-600">{message.text}</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
