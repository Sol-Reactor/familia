import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { FormField, FormAlert } from '../common/FormField';
import { useUpdateProfile } from '../../api/users';
import { getErrorMessage } from '../../lib/utils';

export default function EditProfileModal({ user }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', bio: '' });

  const updateProfile = useUpdateProfile();

  // Re-sync the form with the latest profile every time the dialog opens
  useEffect(() => {
    if (open) {
      setFormData({ name: user?.name || '', bio: user?.bio || '' });
      setError('');
    }
  }, [open, user?.name, user?.bio]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (name.length < 2) {
      setError('Name must be at least 2 characters long');
      return;
    }
    try {
      await updateProfile.mutateAsync({ name, bio: formData.bio.trim() });
      toast.success('Profile updated');
      setOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update profile'));
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your name and bio. Photos and other details are in Settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormAlert>{error}</FormAlert>
          <FormField
            label="Name"
            id="edit-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            autoComplete="name"
            minLength={2}
            maxLength={50}
            required
          />

          <FormField label="Bio" id="edit-bio" hint={`${formData.bio.length}/200`}>
            <Textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell people a little about yourself"
              rows={4}
              maxLength={200}
            />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={updateProfile.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
