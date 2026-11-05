import { useState, useRef, useEffect, useId } from 'react';
import { ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useAuthStore } from '../../stores/authStore';
import { useCreatePost } from '../../api/posts';
import { uploadToCloudinary, validateImageFile } from '../../lib/cloudinary';
import { getErrorMessage, getInitials } from '../../lib/utils';

const MAX_LENGTH = 5000;

export default function CreatePost() {
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);
  const textareaId = useId();

  const createPost = useCreatePost();
  const isBusy = uploadProgress !== null || createPost.isPending;

  // Release object URLs to avoid memory leaks
  useEffect(() => () => imagePreview && URL.revokeObjectURL(imagePreview), [imagePreview]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast.error(problem);
      e.target.value = '';
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if ((!text && !imageFile) || isBusy) return;

    try {
      let imageUrl = null;
      if (imageFile) {
        setUploadProgress(0);
        const result = await uploadToCloudinary(imageFile, setUploadProgress);
        imageUrl = result.url;
      }
      setUploadProgress(null);

      await createPost.mutateAsync({ content: text, image: imageUrl });

      toast.success('Post shared');
      setContent('');
      handleRemoveImage();
    } catch (error) {
      setUploadProgress(null);
      toast.error(getErrorMessage(error, 'Failed to create post. Please try again.'));
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const remaining = MAX_LENGTH - content.length;

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} aria-label="Create a post">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatarUrl} alt="" />
            <AvatarFallback className="text-xs">{getInitials(user?.name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <label htmlFor={textareaId} className="sr-only">What&apos;s on your mind?</label>
            <Textarea
              id={textareaId}
              placeholder={`What's on your mind, ${firstName}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={3}
              className="min-h-[88px] resize-none border-transparent bg-muted/60 text-base focus-visible:bg-card"
              disabled={isBusy}
            />

            {imagePreview && (
              <div className="relative mt-3 overflow-hidden rounded-xl border">
                <img src={imagePreview} alt="Selected image preview" className="max-h-96 w-full object-cover" />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="absolute right-2 top-2 rounded-full bg-card/90 shadow"
                  onClick={handleRemoveImage}
                  disabled={isBusy}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
                {uploadProgress !== null && (
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                    <div className="h-full bg-primary transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                  tabIndex={-1}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="text-muted-foreground"
                >
                  <ImagePlus className="h-5 w-5 text-success" aria-hidden="true" />
                  Photo
                </Button>
                {remaining < 200 && (
                  <span className={remaining < 0 ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'} aria-live="polite">
                    {remaining} left
                  </span>
                )}
              </div>

              <Button
                type="submit"
                className="min-w-[88px]"
                disabled={!content.trim() && !imageFile}
                loading={isBusy}
              >
                {uploadProgress !== null ? `${uploadProgress}%` : createPost.isPending ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
