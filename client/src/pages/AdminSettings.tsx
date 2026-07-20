'use client';

import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Download, Upload, Shield, Database, Plus, Edit2, Trash2, Key } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function InvitedUsersTab() {
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");

  const { data: invitedUsers = [], refetch: refetchInvitedUsers, isLoading } = trpc.invitedUsers.list.useQuery();

  const addInvitedUserMutation = trpc.invitedUsers.add.useMutation({
    onSuccess: () => {
      toast.success("受邀人員添加成功");
      setNewEmail("");
      setNewName("");
      setNewRole("user");
      refetchInvitedUsers();
    },
    onError: (error) => {
      toast.error(error.message || "添加失敗");
    },
  });

  const deleteInvitedUserMutation = trpc.invitedUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("受邀人員刪除成功");
      refetchInvitedUsers();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const handleAddInvitedUser = () => {
    if (!newEmail) {
      toast.error("請輸入郵箱");
      return;
    }
    addInvitedUserMutation.mutate({
      email: newEmail,
      name: newName || newEmail,
      role: newRole,
    });
  };

  const handleDeleteInvitedUser = (id: number) => {
    if (confirm("確定要刪除此受邀人員吗？")) {
      deleteInvitedUserMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">受邀人員管理</h2>
      <Card className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>郵箱</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="輸入郵箱"
              />
            </div>
            <div className="space-y-2">
              <Label>姓名 (可選)</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="輸入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as "admin" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">一般使用者</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddInvitedUser}
                disabled={addInvitedUserMutation.isPending || !newEmail}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加受邀人員
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>郵箱</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>邀請日期</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitedUsers.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "管理员" : "一般使用者"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "accepted" ? "default" : "outline"}>
                    {user.status === "pending" ? "待實" : user.status === "accepted" ? "已接受" : "已拒絕"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(user.invitedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteInvitedUser(user.id)}
                    disabled={deleteInvitedUserMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function AuditLogTable() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("timestamp");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  const { data: logs = [], isLoading } = trpc.auditLog.list.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    userId: userId ? parseInt(userId) : undefined,
    action: action && action !== 'all' ? (action as "CREATE" | "UPDATE" | "DELETE") : undefined,
    sortBy: (sortBy as "timestamp" | "userId" | "action" | "entity") || "timestamp",
    sortOrder: (sortOrder as "asc" | "desc") || "desc",
    limit: 100,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">載入中...</div>;
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '新增';
      case 'UPDATE':
        return '編輯';
      case 'DELETE':
        return '刪除';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-4">
      {/* 篩選與排序控制面板 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-muted/50 p-4 rounded-lg">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">開始日期</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">結束日期</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">操作人員 ID</label>
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="輸入使用者 ID"
            className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">動作類型</label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="CREATE">新增</SelectItem>
              <SelectItem value="UPDATE">編輯</SelectItem>
              <SelectItem value="DELETE">刪除</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">排序欄位</label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">時間</SelectItem>
              <SelectItem value="userId">使用者</SelectItem>
              <SelectItem value="action">動作</SelectItem>
              <SelectItem value="entity">實體</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">排序順序</label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">降序</SelectItem>
              <SelectItem value="asc">升序</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 日誌表格 */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">暫無操作日誌</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>時間</TableHead>
                <TableHead>使用者</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>實體</TableHead>
                <TableHead>變更內容</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="text-sm">
                    {new Date(log.timestamp).toLocaleString('zh-TW')}
                  </TableCell>
                  <TableCell className="text-sm">{log.userName}</TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeColor(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.entity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {JSON.stringify(log.changes).substring(0, 50)}...
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"admin" | "user">("user");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPasswordChangeDialog, setShowPasswordChangeDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [dialogMode, setDialogMode] = useState<"create" | "update">("create");
  const [passwordUsers, setPasswordUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "user" as "admin" | "user" });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const createPasswordUserMutation = trpc.passwordUsers.create.useMutation({
    onSuccess: () => {
      toast.success("帳密使用者建立成功");
      setNewUser({ username: "", password: "", role: "user" });
      setShowPasswordDialog(false);
      refetchPasswordUsers();
    },
    onError: (error) => {
      toast.error(error.message || "建立失敗");
    },
  });

  const updatePasswordUserMutation = trpc.passwordUsers.update.useMutation({
    onSuccess: () => {
      toast.success("帳密使用者更新成功");
      setShowPasswordDialog(false);
      refetchPasswordUsers();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  const deletePasswordUserMutation = trpc.passwordUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("帳密使用者刪除成功");
      refetchPasswordUsers();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  const { data: passwordUsersData = [], refetch: refetchPasswordUsers } = trpc.passwordUsers.list.useQuery();

  const initializeUsersMutation = trpc.passwordUsers.initializeDefaultUsers.useMutation({
    onSuccess: (data) => {
      const createdCount = data.results.filter((r: any) => r.status === 'created').length;
      toast.success(`成功初始化 ${createdCount} 個使用者`);
      refetchPasswordUsers();
    },
    onError: (error) => {
      toast.error(error.message || '初始化失敗');
    },
  });

  const handleInitializeUsers = () => {
    if (confirm('確認要初始化 10 個預設使用者嗎？此操作無法撤銷。')) {
      initializeUsersMutation.mutate();
    }
  };

  const handleCreatePasswordUser = () => {
    if (!newUser.username || !newUser.password) {
      toast.error("請填寫使用者名稱和密碼");
      return;
    }
    createPasswordUserMutation.mutate({
      username: newUser.username,
      password: newUser.password,
      name: newUser.username,
      role: newUser.role,
    });
  };

  const handleUpdatePasswordUser = (userId: number) => {
    updatePasswordUserMutation.mutate({
      id: String(userId),
      role: selectedRole as "admin" | "user",
    });
  };

  const handleDeletePasswordUser = (userId: number) => {
    if (confirm("確認刪除此帳密使用者？")) {
      deletePasswordUserMutation.mutate({ id: String(userId) });
    }
  };

  const handleChangePassword = (userId: number) => {
    if (!newPassword) {
      toast.error("請輸入新密碼");
      return;
    }
    updatePasswordUserMutation.mutate({
      id: String(userId),
      password: newPassword,
    });
    setNewPassword("");
    setShowPasswordChangeDialog(false);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="max-w-5xl mx-auto py-12">
        <div className="text-center text-muted-foreground">
          <p>您沒有權限存取此頁面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="border-b border-border pb-5">
        <header>
          <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            管理設定
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理帳密使用者、操作日誌和系統設定
          </p>
        </header>
      </section>

      <div className="space-y-4">
        <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/admin/accounts'}>
          <Shield className="w-4 h-4" />
          前往帳號管理
        </Button>
      </div>

      <Tabs defaultValue="password-users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="password-users">帳密使用者</TabsTrigger>
          <TabsTrigger value="invited-users">受邀人員</TabsTrigger>
          <TabsTrigger value="audit-logs">操作日誌</TabsTrigger>
        </TabsList>

        <TabsContent value="password-users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">帳密使用者管理</h2>
            <div className="flex gap-2">
              <Button onClick={() => {
                setDialogMode("create");
                setNewUser({ username: "", password: "", role: "user" });
                setShowPasswordDialog(true);
              }} className="gap-2">
                <Plus className="w-4 h-4" />
                新增使用者
              </Button>
              <Button onClick={handleInitializeUsers} variant="outline" className="gap-2">
                <Database className="w-4 h-4" />
                初始化使用者
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>使用者名稱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passwordUsersData.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.username}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                          {u.role === "admin" ? "管理員" : "一般使用者"}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="修改密碼"
                          onClick={() => {
                            setSelectedUserId(String(u.id));
                            setSelectedUserName(u.username);
                            setShowPasswordChangeDialog(true);
                          }}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="修改角色"
                          onClick={() => {
                            setSelectedUserId(String(u.id));
                            setSelectedUserName(u.username);
                            setSelectedRole(u.role as "admin" | "user");
                            setShowRoleDialog(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="刪除使用者"
                          onClick={() => handleDeletePasswordUser(u.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
                </TabsContent>

        <TabsContent value="invited-users" className="space-y-4">
          <InvitedUsersTab />
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <h2 className="text-lg font-semibold">操作日誌查詢</h2>
          <Card className="p-4">
            <AuditLogTable />
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新增/編輯帳密使用者對話框 */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "新增帳密使用者" : "編輯帳密使用者"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>使用者名稱</Label>
              <Input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="輸入使用者名稱"
                disabled={dialogMode === "update"}
              />
            </div>
            <div className="space-y-2">
              <Label>密碼</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="輸入密碼"
              />
            </div>
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={newUser.role} onValueChange={(v: any) => setNewUser({ ...newUser, role: v as "admin" | "user" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">一般使用者</SelectItem>
                  <SelectItem value="admin">管理員</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleCreatePasswordUser}
              className="w-full"
              disabled={createPasswordUserMutation.isPending}
            >
              {createPasswordUserMutation.isPending ? "處理中..." : "確認"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 編輯角色對話框 */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯使用者角色</DialogTitle>
            <DialogDescription>
              編輯 {selectedUserName} 的角色
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>角色</Label>
              <Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v as "admin" | "user")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">一般使用者</SelectItem>
                  <SelectItem value="admin">管理員</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => handleUpdatePasswordUser(parseInt(selectedUserId))}
              className="w-full"
              disabled={updatePasswordUserMutation.isPending}
            >
              {updatePasswordUserMutation.isPending ? "處理中..." : "確認"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 修改密碼對話框 */}
      <Dialog open={showPasswordChangeDialog} onOpenChange={setShowPasswordChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改使用者密碼</DialogTitle>
            <DialogDescription>
              修改 {selectedUserName} 的密碼
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>新密碼</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="輸入新密碼"
              />
            </div>
            <Button
              onClick={() => handleChangePassword(parseInt(selectedUserId))}
              className="w-full"
              disabled={updatePasswordUserMutation.isPending || !newPassword}
            >
              {updatePasswordUserMutation.isPending ? "處理中..." : "確認修改"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
