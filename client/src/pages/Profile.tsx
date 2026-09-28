import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/auth.service';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  FileText, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  Camera,
  UploadCloud,
  Trash2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Picture Upload State
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Invalid file format. Please upload an image (PNG, JPG, WEBP, GIF).');
      return;
    }

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    // Read file as base64 data URL
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setSelectedPreview(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to process image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!selectedPreview) return;
    setIsUploadingPhoto(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await AuthService.updateProfile({ avatarUrl: selectedPreview });
      updateUser(res.data.user);
      setSelectedPreview(null);
      setSuccessMsg('Profile picture updated successfully!');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile picture');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await AuthService.updateProfile({ avatarUrl: '' });
      updateUser(res.data.user);
      setSelectedPreview(null);
      setSuccessMsg('Profile picture removed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove profile picture');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const cancelPreview = () => {
    setSelectedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await AuthService.updateProfile({ name, bio });
      updateUser(res.data.user);
      setSuccessMsg('Hero profile updated successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentDisplayAvatar = selectedPreview || user?.avatarUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Hero Profile</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account identity and adventurer settings</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Avatar Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-1 shadow-xl shadow-indigo-500/20 mb-3">
              <div className="w-full h-full bg-[#0c1220] rounded-[14px] flex items-center justify-center overflow-hidden">
                {currentDisplayAvatar ? (
                  <img src={currentDisplayAvatar} alt={user?.name || 'Profile'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-extrabold text-indigo-400">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
                  </span>
                )}
              </div>
            </div>

            {/* Quick change overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-2 right-0 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
              title="Upload Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif"
            onChange={handleImageFileChange}
            className="hidden"
          />

          {/* Photo Actions / Confirmation */}
          {selectedPreview ? (
            <div className="w-full space-y-2 mb-3">
              <p className="text-[11px] text-amber-400 font-medium">New photo preview (not yet saved)</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={isUploadingPhoto}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? 'Saving...' : 'Save Photo'}</span>
                </button>
                <button
                  type="button"
                  onClick={cancelPreview}
                  disabled={isUploadingPhoto}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-all"
                  title="Cancel Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1 px-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{user?.avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
              {user?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  disabled={isUploadingPhoto}
                  className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs transition-all"
                  title="Remove Profile Picture"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <h2 className="text-lg font-bold text-white">{user?.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Role: {user?.role}</span>
          </div>

          <div className="w-full mt-6 pt-6 border-t border-slate-800/80 space-y-2 text-left text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out of Session</span>
          </button>
        </div>

        {/* Right Col: Edit Form */}
        <div className="md:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-1">Account Details</h2>
          <p className="text-xs text-slate-400 mb-6">Update your public profile and biographical info</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address (Read-Only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-400 cursor-not-allowed outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Unique account credential used for authentication</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Adventurer Bio
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <textarea
                  rows={3}
                  maxLength={250}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief statement about your growth goals..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 text-right">{bio.length} / 250 characters</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
