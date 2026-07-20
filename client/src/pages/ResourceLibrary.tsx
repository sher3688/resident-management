import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Folder, File, Plus, Edit2, Trash2, Download, Printer, Upload, X } from "lucide-react";
import { toast } from "sonner";

export default function ResourceLibrary() {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [editFolderOpen, setEditFolderOpen] = useState(false);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState<number | null>(null);
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null);

  const [folderForm, setFolderForm] = useState({ id: 0, name: "", description: "" });
  const [fileForm, setFileForm] = useState({ id: 0, folderId: 0, name: "", file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 查詢
  const { data: folders = [], refetch: refetchFolders } = trpc.resourceLibrary.listFolders.useQuery();
  const { data: files = [], refetch: refetchFiles } = trpc.resourceLibrary.listFiles.useQuery(
    { folderId: selectedFolderId || 0 },
    { enabled: !!selectedFolderId }
  );

  // 變更
  const createFolderMutation = trpc.resourceLibrary.createFolder.useMutation({
    onSuccess: () => {
      toast.success("文件夾建立成功");
      setCreateFolderOpen(false);
      setFolderForm({ id: 0, name: "", description: "" });
      refetchFolders();
    },
    onError: (error) => {
      toast.error(error.message || "建立失敗");
    },
  });

  const updateFolderMutation = trpc.resourceLibrary.updateFolder.useMutation({
    onSuccess: () => {
      toast.success("文件夾更新成功");
      setEditFolderOpen(false);
      setFolderForm({ id: 0, name: "", description: "" });
      refetchFolders();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deleteFolderMutation = trpc.resourceLibrary.deleteFolder.useMutation({
    onSuccess: () => {
      toast.success("文件夾刪除成功");
      setDeleteFolderId(null);
      setSelectedFolderId(null);
      refetchFolders();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const createFileMutation = trpc.resourceLibrary.createFile.useMutation({
    onSuccess: () => {
      toast.success("檔案上傳成功");
      setUploadFileOpen(false);
      setFileForm({ id: 0, folderId: 0, name: "", file: null });
      setUploading(false);
      refetchFiles();
    },
    onError: (error) => {
      toast.error(error.message || "上傳失敗");
      setUploading(false);
    },
  });

  const deleteFileMutation = trpc.resourceLibrary.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("檔案刪除成功");
      setDeleteFileId(null);
      refetchFiles();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const handleCreateFolder = () => {
    if (!folderForm.name.trim()) {
      toast.error("文件夾名稱不能為空");
      return;
    }
    createFolderMutation.mutate({
      name: folderForm.name.trim(),
      description: folderForm.description.trim() || undefined,
    });
  };

  const handleUpdateFolder = () => {
    if (!folderForm.name.trim()) {
      toast.error("文件夾名稱不能為空");
      return;
    }
    updateFolderMutation.mutate({
      id: folderForm.id,
      name: folderForm.name.trim(),
      description: folderForm.description.trim() || undefined,
    });
  };

  const handleDeleteFolder = () => {
    if (deleteFolderId) {
      deleteFolderMutation.mutate({ id: deleteFolderId });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 驗證檔案類型
      const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("只支援 PDF 和 Word 檔案");
        return;
      }
      // 驗證檔案大小（最大 10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error("檔案大小不能超過 10MB");
        return;
      }
      setFileForm({ ...fileForm, file, name: file.name.replace(/\.[^/.]+$/, "") });
    }
  };

  const handleUploadFile = async () => {
    if (!fileForm.name.trim() || !fileForm.file) {
      toast.error("檔案名稱和檔案不能為空");
      return;
    }
    if (!selectedFolderId) {
      toast.error("請先選擇文件夾");
      return;
    }

    setUploading(true);
    try {
      // 上傳檔案到 S3
      const formData = new FormData();
      formData.append("file", fileForm.file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("檔案上傳失敗");
      }

      const uploadData = await uploadResponse.json();
      const fileUrl = uploadData.url;

      // 保存檔案資訊到資料庫
      createFileMutation.mutate({
        folderId: selectedFolderId,
        name: fileForm.name.trim(),
        fileUrl: fileUrl,
        fileSize: fileForm.file.size,
        fileType: fileForm.file.type.includes("pdf") ? "pdf" : "doc",
      });
    } catch (error: any) {
      toast.error(error.message || "上傳失敗");
      setUploading(false);
    }
  };

  const handleDeleteFile = () => {
    if (deleteFileId) {
      deleteFileMutation.mutate({ id: deleteFileId });
    }
  };

  const openEditFolder = (folder: any) => {
    setFolderForm({ id: folder.id, name: folder.name, description: folder.description || "" });
    setEditFolderOpen(true);
  };

  const openUploadFile = () => {
    setFileForm({ id: 0, folderId: selectedFolderId || 0, name: "", file: null });
    setUploadFileOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">資源庫</h1>
          <p className="text-sm text-muted-foreground mt-1">管理社區相關文件和資源</p>
        </div>
        <Button onClick={() => setCreateFolderOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          新增文件夾
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左側：文件夾列表 */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">文件夾</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {folders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">尚無文件夾</p>
              ) : (
                folders.map((folder: any) => (
                  <div
                    key={folder.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFolderId === folder.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    onClick={() => setSelectedFolderId(folder.id)}
                  >
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Folder className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium truncate">{folder.name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditFolder(folder);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteFolderId(folder.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側：檔案列表 */}
        <div className="lg:col-span-3">
          {selectedFolderId ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">檔案</CardTitle>
                <Button onClick={openUploadFile} size="sm" className="gap-2">
                  <Upload className="w-4 h-4" />
                  上傳檔案
                </Button>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">尚無檔案</p>
                ) : (
                  <div className="space-y-2">
                    {files.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <File className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.fileSize && formatFileSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(file.fileUrl, "_blank")}
                            title="下載"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const printWindow = window.open(file.fileUrl, "_blank");
                              if (printWindow) {
                                printWindow.addEventListener("load", () => {
                                  printWindow.print();
                                });
                              }
                            }}
                            title="列印"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteFileId(file.id)}
                            title="刪除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">請選擇左側文件夾以查看檔案</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 新增文件夾 Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增文件夾</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">文件夾名稱</Label>
              <Input
                id="folder-name"
                value={folderForm.name}
                onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                placeholder="例如：社區規約、住戶須知"
              />
            </div>
            <div>
              <Label htmlFor="folder-description">描述（選填）</Label>
              <Textarea
                id="folder-description"
                value={folderForm.description}
                onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                placeholder="文件夾描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending}>
              {createFolderMutation.isPending ? "建立中..." : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯文件夾 Dialog */}
      <Dialog open={editFolderOpen} onOpenChange={setEditFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯文件夾</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-folder-name">文件夾名稱</Label>
              <Input
                id="edit-folder-name"
                value={folderForm.name}
                onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                placeholder="文件夾名稱"
              />
            </div>
            <div>
              <Label htmlFor="edit-folder-description">描述（選填）</Label>
              <Textarea
                id="edit-folder-description"
                value={folderForm.description}
                onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                placeholder="文件夾描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFolderOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateFolder} disabled={updateFolderMutation.isPending}>
              {updateFolderMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 上傳檔案 Dialog */}
      <Dialog open={uploadFileOpen} onOpenChange={setUploadFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上傳檔案</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-name">檔案名稱</Label>
              <Input
                id="file-name"
                value={fileForm.name}
                onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                placeholder="例如：社區規約 2024"
              />
            </div>
            <div>
              <Label htmlFor="file-input">選擇檔案</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-start"
                >
                  {fileForm.file ? fileForm.file.name : "選擇 PDF 或 Word 檔案"}
                </Button>
                {fileForm.file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFileForm({ ...fileForm, file: null })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">支援 PDF、DOC、DOCX，最大 10MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadFileOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUploadFile} disabled={uploading || !fileForm.file}>
              {uploading ? "上傳中..." : "上傳"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除文件夾確認 */}
      <AlertDialog open={!!deleteFolderId} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除文件夾</AlertDialogTitle>
            <AlertDialogDescription>
              刪除文件夾將同時刪除其中的所有檔案。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFolderMutation.isPending}
            >
              {deleteFolderMutation.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除檔案確認 */}
      <AlertDialog open={!!deleteFileId} onOpenChange={(open) => !open && setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除檔案</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除這個檔案嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFileMutation.isPending}
            >
              {deleteFileMutation.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
