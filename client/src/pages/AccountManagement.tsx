import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Lock, Unlock, Edit2 } from "lucide-react";

export default function AccountManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    role: "user" as "admin" | "user",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    role: "user" as "admin" | "user",
    password: "",
  });

  // 獲取所有帳號
  const { data: accounts = [], isLoading, refetch } = trpc.accountManagement.listAll.useQuery();

  // 建立帳號
  const createMutation = trpc.accountManagement.create.useMutation({
    onSuccess: () => {
      toast.success("帳號建立成功");
      setForm({ username: "", password: "", name: "", role: "user" });
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "建立帳號失敗");
    },
  });

  // 更新帳號
  const updateMutation = trpc.accountManagement.update.useMutation({
    onSuccess: () => {
      toast.success("帳號更新成功");
      setIsEditOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新帳號失敗");
    },
  });

  // 停用帳號
  const deactivateMutation = trpc.accountManagement.deactivate.useMutation({
    onSuccess: () => {
      toast.success("帳號已停用");
      setIsDeleteOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "停用帳號失敗");
    },
  });

  // 啟用帳號
  const activateMutation = trpc.accountManagement.activate.useMutation({
    onSuccess: () => {
      toast.success("帳號已啟用");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "啟用帳號失敗");
    },
  });

  function handleCreate() {
    if (!form.username.trim()) {
      toast.error("請輸入使用者名稱");
      return;
    }
    if (!form.password.trim()) {
      toast.error("請輸入密碼");
      return;
    }
    if (!form.name.trim()) {
      toast.error("請輸入名稱");
      return;
    }
    createMutation.mutate(form);
  }

  function handleEdit() {
    if (!selectedId) return;
    if (!editForm.name.trim()) {
      toast.error("請輸入名稱");
      return;
    }
    updateMutation.mutate({
      id: selectedId,
      name: editForm.name,
      role: editForm.role,
      password: editForm.password || undefined,
    });
  }

  function openEdit(account: any) {
    setSelectedId(account.id);
    setEditForm({
      name: account.name,
      role: account.role,
      password: "",
    });
    setIsEditOpen(true);
  }

  function openDelete(id: number) {
    setSelectedId(id);
    setIsDeleteOpen(true);
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight flex items-center gap-2">
            帳號管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {accounts.length} 個帳號
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          新增帳號
        </Button>
      </div>

      {/* Accounts table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                使用者名稱
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                名稱
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                角色
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                狀態
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account: any) => (
              <tr key={account.id} className="border-b border-border hover:bg-muted/30">
                <td className="px-4 py-3 text-sm">{account.username}</td>
                <td className="px-4 py-3 text-sm">{account.name}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={account.role === "admin" ? "default" : "secondary"}>
                    {account.role === "admin" ? "管理員" : "一般使用者"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge variant={account.isActive ? "outline" : "destructive"}>
                    {account.isActive ? "啟用中" : "已停用"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm space-x-2 flex">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(account)}
                    className="gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    編輯
                  </Button>
                  {account.isActive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDelete(account.id)}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      停用
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => activateMutation.mutate({ id: account.id })}
                      className="gap-1 text-green-600 hover:text-green-700"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      啟用
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增帳號</DialogTitle>
            <DialogDescription>建立新的登入帳號</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">使用者名稱</Label>
              <Input
                id="username"
                placeholder="輸入使用者名稱"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="輸入密碼"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">名稱</Label>
              <Input
                id="name"
                placeholder="輸入名稱"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">角色</Label>
              <Select value={form.role} onValueChange={(value: any) => setForm({ ...form, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">一般使用者</SelectItem>
                  <SelectItem value="admin">管理員</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "建立中..." : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯帳號</DialogTitle>
            <DialogDescription>修改帳號資訊</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-name">名稱</Label>
              <Input
                id="edit-name"
                placeholder="輸入名稱"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-role">角色</Label>
              <Select value={editForm.role} onValueChange={(value: any) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">一般使用者</SelectItem>
                  <SelectItem value="admin">管理員</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-password">新密碼（留空則不變更）</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="輸入新密碼"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>停用帳號</AlertDialogTitle>
            <AlertDialogDescription>
              確認要停用此帳號嗎？停用後該帳號將無法登入。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedId !== null && deactivateMutation.mutate({ id: selectedId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認停用
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
