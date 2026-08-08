import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, Search, FileText, Image as ImageIcon, FileArchive, File as FileIcon, Download, Trash2, FolderOpen } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useFiles, useUploadFile, useDeleteFile, useDownloadFile } from './useFiles';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { FileLibraryItem } from '../../types';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return FileArchive;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return FileIcon;
}

function uploaderName(entity: FileLibraryItem['uploadedBy']): string {
  return typeof entity === 'object' ? entity.name : 'Someone';
}

export function FilesPage() {
  const { user, hasRole } = useAuth();
  const isManager = hasRole('company_admin', 'team_lead');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useFiles(search ? { search } : undefined);
  const uploadFile = useUploadFile();
  const deleteFile = useDeleteFile();
  const downloadFile = useDownloadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await uploadFile.mutateAsync(file);
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  async function handleDelete(file: FileLibraryItem) {
    if (!window.confirm(`Delete "${file.fileName}"? This can't be undone.`)) return;
    try {
      await deleteFile.mutateAsync(file._id);
      toast.success('File deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  function canDelete(file: FileLibraryItem): boolean {
    const ownerId = typeof file.uploadedBy === 'object' ? file.uploadedBy._id : file.uploadedBy;
    return ownerId === user?._id || isManager;
  }

  const files = data?.files ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Files</h1>
          <p className="mt-0.5 text-sm text-slate-500">Shared file storage for your company.</p>
        </div>
        <div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadFile.isPending} className="btn-primary">
            {uploadFile.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Upload size={16} />} Upload
          </button>
        </div>
      </div>

      <div className="relative mb-4 w-72">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-8"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : files.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={search ? `No files match "${search}"` : 'No files yet'}
          description="Upload a file to share it with your team."
          action={
            <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
              <Upload size={16} /> Upload
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {files.map((file) => {
            const Icon = iconFor(file.mimeType);
            return (
              <div key={file._id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon size={18} />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => downloadFile.mutate({ fileId: file._id, fileName: file.fileName })}
                      aria-label={`Download ${file.fileName}`}
                      className="rounded p-1 text-slate-400 hover:bg-surface-subtle hover:text-slate-600"
                    >
                      <Download size={14} />
                    </button>
                    {canDelete(file) && (
                      <button
                        onClick={() => handleDelete(file)}
                        aria-label={`Delete ${file.fileName}`}
                        className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-3 truncate text-sm font-medium text-slate-800" title={file.fileName}>
                  {file.fileName}
                </p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{formatSize(file.size)}</span>
                  <span>{uploaderName(file.uploadedBy)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
