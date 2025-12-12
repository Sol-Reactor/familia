import { useState, useRef } from 'react';
import { Image, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useAuthStore } from '../../stores/authStore';
import { useCreatePost } from '../../api/posts';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function CreatePost() {
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const createPost = useCreatePost();

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !imageFile) return;

    try {
      setIsUploading(true);
      let imageUrl = null;

      if (imageFile) {
        const result = await uploadToCloudinary(imageFile);
        imageUrl = result.url;
      }

      await createPost.mutateAsync({
        content: content.trim(),
        image: imageUrl,
      });

      toast.success('Post created successfully!');
      
      // Reset form
      setContent('');
      handleRemoveImage();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatarUrl} alt={user?.name} />
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <Textarea
                placeholder={`What's on your mind, ${firstName}?`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none"
              />

              {imagePreview && (
                <div className="relative mt-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="rounded-lg max-h-96 w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Image className="h-5 w-5 mr-2 text-green-500" />
                    Photo
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={(!content.trim() && !imageFile) || isUploading}
                >
                  {isUploading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
