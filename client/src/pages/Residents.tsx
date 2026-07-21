import React from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2,
  Car,
  Edit2,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  Bike,
  AlertCircle,
  X,
  Download,
  Upload,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
// React already imported at line 1

type ResidentForm = {
  unitNumber: string;
  ownerName: string;
  ownerPhone: string;
  address: string;
  coResidents: Array<{ name: string; phone: string }>;
  parkings: Array<{ type: "car" | "motorcycle" | "bicycle"; number: string; plateNumber?: string }>;
  emergencyContacts: Array<{ name: string; phone: string; relation: string }>;
  squareMeters: string;
  waterMeterNumber: string;
  electricityMeterNumber: string;
  moveInDate: string;
  notes: string;
};

const emptyForm: ResidentForm = {
  unitNumber: "",
  ownerName: "",
  ownerPhone: "",
  address: "",
  coResidents: [],
  parkings: [],
  emergencyContacts: [],
  squareMeters: "",
  waterMeterNumber: "",
  electricityMeterNumber: "",
  moveInDate: "",
  notes: "",
};

// 戶號排序順序定義
const UNIT_ORDER: Record<string, number[]> = {
  A: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15],
  B: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22],
  E: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18],
  S: [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20],
};

// 解析戶號並返回排序鍵
const parseUnitNumber = (unitNumber: string): [string, number, number] => {
  const match = unitNumber.match(/^([A-Z]+)(\d+)(?:-(.+))?$/);
  if (!match) return ["", 0, 0];
  
  const prefix = match[1];
  const mainNum = parseInt(match[2], 10);
  const subNum = match[3] ? parseInt(match[3], 10) : 0;
  
  return [prefix, mainNum, subNum];
};

// 比較兩個戶號的排序順序
const compareUnitNumbers = (a: string, b: string): number => {
  const [prefixA, mainA, subA] = parseUnitNumber(a);
  const [prefixB, mainB, subB] = parseUnitNumber(b);
  
  // 先比較前綴
  if (prefixA !== prefixB) {
    return prefixA.localeCompare(prefixB);
  }
  
  // 再比較主號（按照定義的順序）
  const order = UNIT_ORDER[prefixA] || [];
  const indexA = order.indexOf(mainA);
  const indexB = order.indexOf(mainB);
  
  if (indexA !== indexB) {
    return indexA - indexB;
  }
  
  // 最後比較子號
  return subA - subB;
};

export default function Residents() {
  const { data: residents = [], isLoading, error } = trpc.residents.list.useQuery();
  if (residents.length > 0 || error) {
    console.log('[DEBUG] Residents.tsx: useQuery result', { residentsCount: residents.length, error, firstResident: residents[0] });
  }
  const utils = trpc.useUtils();
  const createMutation = trpc.residents.create.useMutation({
    onSuccess: () => {
      toast.success("住戶新增成功");
      setDialogOpen(false);
      setForm(emptyForm);
      utils.residents.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = trpc.residents.update.useMutation({
    onSuccess: () => {
      console.log('[DEBUG] updateMutation success');
      toast.success("住戶更新成功");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      utils.residents.list.invalidate();
    },
    onError: (error) => {
      console.log('[DEBUG] updateMutation error:', error);
      toast.error(error.message);
    },
  });
  const deleteMutation = trpc.residents.delete.useMutation({
    onSuccess: () => {
      toast.success("住戶刪除成功");
      setDeleteId(null);
      utils.residents.list.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const [form, setForm] = React.useState<ResidentForm>(emptyForm);
  const [search, setSearch] = React.useState("");
  const [selectedAril, setSelectedAril] = React.useState<string | null>(null);
  const [selectedMainNumber, setSelectedMainNumber] = React.useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [deleteId, setDeleteId] = React.useState<number | null>(null);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importLoading, setImportLoading] = React.useState(false);

  const importMutation = trpc.residents.importBatch.useMutation({
    onSuccess: (result) => {
      const successCount = result.filter((r) => r.success).length;
      const errorCount = result.filter((r) => !r.success).length;
      toast.success(`成功匯入 ${successCount} 筆住戶資料${errorCount > 0 ? `, 失敗 ${errorCount} 筆` : ''}`);
      setImportDialogOpen(false);
      setImportFile(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const unitNumberError = React.useMemo(() => {
    if (!form.unitNumber.trim()) return "";
    const isDuplicate = residents.some(
      (r) => r.unitNumber === form.unitNumber.trim() && r.id !== editingId
    );
    return isDuplicate ? "此戶號已存在" : "";
  }, [form.unitNumber, editingId, residents]);

  // 高亮顯示搜尋關鍵字的元件
  const HighlightText = ({ text, query }: { text: string | null | undefined; query: string }) => {
    if (!text || !query) return <>{text}</>;
    const isNumeric = /^\d+$/.test(query);
    if (!isNumeric && !text.toLowerCase().includes(query.toLowerCase())) return <>{text}</>;
    if (isNumeric && !/\d/.test(text)) return <>{text}</>;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, idx) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <mark key={idx} className="bg-yellow-300 text-black font-semibold">{part}</mark> : 
            <span key={idx}>{part}</span>
        )}
      </>
    );
  };

  // 提取所有唯一的 Aril（戶別）並按照定義的順序排列
  const allArils = React.useMemo(() => {
    const arils = new Set<string>();
    residents.forEach((r) => {
      const aril = r.unitNumber.split('-')[0];
      if (aril) {
        const prefix = aril.match(/^[A-Z]+/)?.[0];
        if (prefix) arils.add(prefix);
      }
    });
    return Array.from(arils).sort((a, b) => a.localeCompare(b));
  }, [residents]);

  // 提取特定前綴的所有主號
  const getMainNumbersForPrefix = (prefix: string): number[] => {
    const numbers = new Set<number>();
    residents.forEach((r) => {
      const [p, mainNum] = parseUnitNumber(r.unitNumber);
      if (p === prefix) {
        numbers.add(mainNum);
      }
    });
    const order = UNIT_ORDER[prefix] || [];
    return order.filter(n => numbers.has(n));
  };

  const filtered = residents.filter((r) => {
    // 先按 Aril 篩選
    if (selectedAril) {
      const aril = r.unitNumber.split('-')[0];
      if (!aril.startsWith(selectedAril)) return false;
    }
    
    // 按主號篩選
    if (selectedMainNumber !== null) {
      const [, mainNum] = parseUnitNumber(r.unitNumber);
      if (mainNum !== selectedMainNumber) return false;
    }
    
    const q = search.toLowerCase();
    const isNumeric = /^\d+$/.test(q);
    
    if (isNumeric) {
      return (
        (r.carParkingNumber?.includes(q) ?? false) ||
        (r.carPlateNumber?.includes(q) ?? false) ||
        (r.motorcycleParkingNumber?.includes(q) ?? false) ||
        (r.motorcyclePlateNumber?.includes(q) ?? false) ||
        (r.bicycleParkingNumber?.includes(q) ?? false)
      );
    } else {
      const ownerMatch = 
        r.unitNumber.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        (r.ownerPhone?.toLowerCase().includes(q) ?? false);
      
      const coResidentsMatch = [1, 2, 3, 4].some((i) => {
        const name = (r as any)[`coResident${i}Name`];
        const phone = (r as any)[`coResident${i}Phone`];

        const nameMatch = name && typeof name === 'string' && name.toLowerCase().includes(q);
        const phoneMatch = phone && typeof phone === 'string' && phone.toLowerCase().includes(q);
        return nameMatch || phoneMatch;
      });
      
      return ownerMatch || coResidentsMatch;
    }
  }).sort((a, b) => compareUnitNumbers(a.unitNumber, b.unitNumber));

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(resident: any) {
    setEditingId(resident.id);
    setDialogOpen(true);
  }

  const getQuery = trpc.residents.get.useQuery(
    { id: editingId || 0 },
    { enabled: editingId !== null && dialogOpen }
  );

  React.useEffect(() => {
    if (getQuery.data && dialogOpen && editingId) {
      const fullResident = getQuery.data;
      console.log('[DEBUG] Loading resident:', editingId, 'emergencyContacts:', fullResident.emergencyContacts);
      setForm({
        unitNumber: fullResident.unitNumber,
        ownerName: fullResident.ownerName,
        ownerPhone: fullResident.ownerPhone || "",
        address: fullResident.address || "",
        coResidents: [1, 2, 3, 4].map((i) => ({
          name: (fullResident as any)[`coResident${i}Name`] || "",
          phone: (fullResident as any)[`coResident${i}Phone`] || "",
        })).filter((c) => c.name || c.phone),
        parkings: [
          ...(fullResident.carParkingNumber ? [{ type: "car" as const, number: fullResident.carParkingNumber, plateNumber: fullResident.carPlateNumber || undefined }] : []),
          ...(fullResident.motorcycleParkingNumber ? [{ type: "motorcycle" as const, number: fullResident.motorcycleParkingNumber, plateNumber: fullResident.motorcyclePlateNumber || undefined }] : []),
          ...(fullResident.bicycleParkingNumber ? [{ type: "bicycle" as const, number: fullResident.bicycleParkingNumber }] : []),
        ],
        emergencyContacts: [
          // 新的 emergencyContacts 陣列
          ...(fullResident.emergencyContacts || []).map((contact: any) => ({
            name: contact.name || "",
            phone: contact.phone || "",
            relation: contact.relationship || "",
          })),
          // 舊的緊急聯絡人欄位
          ...(fullResident.emergencyContactName ? [{
            name: fullResident.emergencyContactName,
            phone: fullResident.emergencyContactPhone || "",
            relation: fullResident.emergencyContactRelation || "",
          }] : []),
          ...(fullResident.emergencyContact2Name ? [{
            name: fullResident.emergencyContact2Name,
            phone: fullResident.emergencyContact2Phone || "",
            relation: fullResident.emergencyContact2Relation || "",
          }] : []),
        ],
        squareMeters: fullResident.squareMeters || "",
        waterMeterNumber: fullResident.waterMeterNumber || "",
        electricityMeterNumber: fullResident.electricityMeterNumber || "",
        moveInDate: fullResident.moveInDate ? new Date(fullResident.moveInDate).toISOString().split('T')[0] : "",
        notes: fullResident.notes || "",
      });
    }
  }, [getQuery.data, dialogOpen, editingId])

  function handleSubmit() {
    console.log('[DEBUG] handleSubmit called, editingId:', editingId);
    if (!form.unitNumber.trim()) {
      toast.error("戶號為必填");
      return;
    }

    if (unitNumberError) {
      toast.error(unitNumberError);
      return;
    }



    const data = {
      unitNumber: form.unitNumber.trim(),
      ownerName: form.ownerName.trim(),
      ownerPhone: form.ownerPhone.trim() || null,
      address: form.address.trim() || null,
      coResident1Name: form.coResidents[0]?.name.trim() || null,
      coResident1Phone: form.coResidents[0]?.phone.trim() || null,
      coResident2Name: form.coResidents[1]?.name.trim() || null,
      coResident2Phone: form.coResidents[1]?.phone.trim() || null,
      coResident3Name: form.coResidents[2]?.name.trim() || null,
      coResident3Phone: form.coResidents[2]?.phone.trim() || null,
      coResident4Name: form.coResidents[3]?.name.trim() || null,
      coResident4Phone: form.coResidents[3]?.phone.trim() || null,
      carParkingNumber: form.parkings.find((p) => p.type === "car")?.number || null,
      carPlateNumber: form.parkings.find((p) => p.type === "car")?.plateNumber || null,
      motorcycleParkingNumber: form.parkings.find((p) => p.type === "motorcycle")?.number || null,
      motorcyclePlateNumber: form.parkings.find((p) => p.type === "motorcycle")?.plateNumber || null,
      bicycleParkingNumber: form.parkings.find((p) => p.type === "bicycle")?.number || null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      emergencyContactRelation: null,
      emergencyContact2Name: null,
      emergencyContact2Phone: null,
      emergencyContact2Relation: null,
      emergencyContacts: form.emergencyContacts.map((c) => ({
        name: c.name.trim(),
        phone: c.phone.trim() || null,
        relation: c.relation?.trim() || null,
      })).filter((c) => c.name || c.phone),
      squareMeters: form.squareMeters.trim() || null,
      waterMeterNumber: form.waterMeterNumber.trim() || null,
      electricityMeterNumber: form.electricityMeterNumber.trim() || null,
      moveInDate: form.moveInDate || null,
      notes: form.notes.trim() || null,
    };

    if (editingId !== null) {
      console.log('[DEBUG] Calling updateMutation with editingId:', editingId, 'data:', data);
      updateMutation.mutate({ id: editingId, ...data } as any);
    } else {
      console.log('[DEBUG] editingId is null, calling createMutation instead');
      createMutation.mutate(data);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            住戶資料庫
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {residents.length} 筆住戶資料
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/api/residents/export?format=json';
              link.download = `residents_${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('住戶資料已開始下載（JSON 格式，可直接匯入）');
            }}
            variant="outline"
            className="gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            匯出 JSON
          </Button>
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/api/residents/export?format=csv';
              link.download = `residents_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('住戶資料已開始下載（CSV 格式）');
            }}
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
          >
            <Download className="w-3 h-3" />
            CSV
          </Button>
          <Button
            onClick={() => setImportDialogOpen(true)}
            variant="outline"
            className="gap-2 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            匯入資料
          </Button>
          <Button onClick={openCreate} className="gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            新增住戶
          </Button>
        </div>
      </div>

      {/* Search - Moved to top */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜尋戶號、姓名、電話…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Aril Filter - Below search */}
      {allArils.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">Aril：</span>
          <Button
            variant={selectedAril === null ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedAril(null);
              setSelectedMainNumber(null);
            }}
            className="h-8"
          >
            全部
          </Button>
          {allArils.map((aril) => (
            <Button
              key={aril}
              variant={selectedAril === aril ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedAril(aril);
                setSelectedMainNumber(null);
              }}
              className="h-8"
            >
              {aril}
            </Button>
          ))}
        </div>
      )}

      {/* Unit Number Index - Below Aril filter */}
      {selectedAril && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">戶號：</span>
          {getMainNumbersForPrefix(selectedAril).map((mainNum) => (
            <Button
              key={mainNum}
              variant={selectedMainNumber === mainNum ? "default" : "outline"}
              size="sm"
            onClick={() => {
                // 設置主號篩選，清除搜索
                setSelectedMainNumber(selectedMainNumber === mainNum ? null : mainNum);
                setSearch("");
              }}
              className="h-8"
            >
              {selectedAril}{mainNum}
            </Button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {residents.length === 0 ? "尚無住戶資料" : "搜尋無結果"}
          </div>
        ) : (
          filtered.map((r) => {
            const isExpanded = expandedId === r.id;
            const coList = form.coResidents || [];
            const parkList = form.parkings || [];

            return (
              <div
                key={r.id}
                className="border border-border rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
              >
                <div
                  className="px-5 py-4 bg-card cursor-pointer hover:bg-muted/50 transition-colors flex items-center justify-between"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className="font-mono text-base shrink-0"
                        style={isExpanded ? { backgroundColor: '#E0BFB4', borderColor: '#E0BFB4' } : {}}
                      >
                        <HighlightText text={r.unitNumber} query={search} />
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          <HighlightText text={r.ownerName} query={search} />
                        </p>
                        {r.ownerPhone && (
                          <p className="text-base text-muted-foreground truncate">
                            <HighlightText text={r.ownerPhone} query={search} />
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        console.log('[DEBUG] Edit button clicked for resident:', r.id, r.unitNumber);
                        openEdit(r);
                      }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteId(r.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-5 py-4 space-y-4" style={{ backgroundColor: '#EADFBA' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Co-residents */}
                      {r.coResident1Name && (
                        <div>
                          <p className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-2">同住人</p>
                          <div className="space-y-1.5">
                            {[1, 2, 3, 4].map((i) => {
                              const name = (r as any)[`coResident${i}Name`];
                              const phone = (r as any)[`coResident${i}Phone`];
                              return name ? (
                                <div key={i} className="text-base">
                                  <p className="font-medium">
                                    <HighlightText text={name} query={search} />
                                  </p>
                                  {phone && (
                                    <p className="text-muted-foreground">
                                      <HighlightText text={phone} query={search} />
                                    </p>
                                  )}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Parkings */}
                      {(r.carParkingNumber || r.motorcycleParkingNumber || r.bicycleParkingNumber) && (
                        <div>
                          <p className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-2">車位</p>
                          <div className="space-y-1.5">
                            {r.carParkingNumber && (
                              <div className="text-base flex items-center gap-2">
                                <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="font-medium">
                                    <HighlightText text={r.carParkingNumber} query={search} />
                                  </p>
                                  {r.carPlateNumber && (
                                    <p className="text-muted-foreground">
                                      <HighlightText text={r.carPlateNumber} query={search} />
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            {r.motorcycleParkingNumber && (
                              <div className="text-base flex items-center gap-2">
                                <Bike className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div>
                                  <p className="font-medium">
                                    <HighlightText text={r.motorcycleParkingNumber} query={search} />
                                  </p>
                                  {r.motorcyclePlateNumber && (
                                    <p className="text-muted-foreground">
                                      <HighlightText text={r.motorcyclePlateNumber} query={search} />
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            {r.bicycleParkingNumber && (
                              <div className="text-base flex items-center gap-2">
                                <Bike className="w-4 h-4 text-muted-foreground shrink-0" />
                                <p className="font-medium">
                                  <HighlightText text={r.bicycleParkingNumber} query={search} />
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Emergency Contacts */}
                      {((r.emergencyContactName || r.emergencyContact2Name) || ((r as any).emergencyContacts && (r as any).emergencyContacts.length > 0)) && (
                        <div>
                          <p className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-2">緊急聯絡人</p>
                          <div className="space-y-1.5">
                            {/* New emergency contacts from emergencyContacts table */}
                            {(r as any).emergencyContacts?.map((contact: any, idx: number) => (
                              <div key={idx} className="text-base">
                                <p className="font-medium">
                                  <HighlightText text={contact.name} query={search} />
                                </p>
                                {contact.phone && (
                                  <p className="text-muted-foreground">
                                    <HighlightText text={contact.phone} query={search} />
                                  </p>
                                )}
                                {contact.relationship && (
                                  <p className="text-muted-foreground text-xs">
                                    {contact.relationship}
                                  </p>
                                )}
                              </div>
                            ))}
                            {/* Old emergency contact fields */}
                            {r.emergencyContactName && (
                              <div className="text-base">
                                <p className="font-medium">
                                  <HighlightText text={r.emergencyContactName} query={search} />
                                </p>
                                {r.emergencyContactPhone && (
                                  <p className="text-muted-foreground">
                                    <HighlightText text={r.emergencyContactPhone} query={search} />
                                  </p>
                                )}
                                {r.emergencyContactRelation && (
                                  <p className="text-muted-foreground text-xs">
                                    {r.emergencyContactRelation}
                                  </p>
                                )}
                              </div>
                            )}
                            {r.emergencyContact2Name && (
                              <div className="text-base">
                                <p className="font-medium">
                                  <HighlightText text={r.emergencyContact2Name} query={search} />
                                </p>
                                {r.emergencyContact2Phone && (
                                  <p className="text-muted-foreground">
                                    <HighlightText text={r.emergencyContact2Phone} query={search} />
                                  </p>
                                )}
                                {r.emergencyContact2Relation && (
                                  <p className="text-muted-foreground text-xs">
                                    {r.emergencyContact2Relation}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Address */}
                      {r.address && (
                        <div className="sm:col-span-2">
                          <p className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-2">地址</p>
                          <p className="text-base text-foreground">
                            <HighlightText text={r.address} query={search} />
                          </p>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div>
                        <p className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-2">其他資訊</p>
                        <div className="space-y-1.5 text-base">
                          {r.squareMeters && (
                            <p><span className="text-muted-foreground">坪數：</span>{r.squareMeters}</p>
                          )}
                          {r.moveInDate && (
                            <p><span className="text-muted-foreground">入住日期：</span>{new Date(r.moveInDate).toLocaleDateString()}</p>
                          )}
                          {r.waterMeterNumber && (
                            <p><span className="text-muted-foreground">水錶：</span>{r.waterMeterNumber}</p>
                          )}
                          {r.electricityMeterNumber && (
                            <p><span className="text-muted-foreground">電表：</span>{r.electricityMeterNumber}</p>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {r.notes && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-base font-medium text-muted-foreground uppercase tracking-wide mb-2">備註</p>
                          <p className="text-base text-foreground">{r.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "編輯住戶" : "新增住戶"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Unit Number */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-base">戶號 *</Label>
              <Input
                value={form.unitNumber}
                onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                placeholder="例：A1-2F"
                className={unitNumberError ? "border-destructive" : ""}
              />
              {unitNumberError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {unitNumberError}
                </p>
              )}
            </div>

            {/* Owner Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-muted-foreground">區權人</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-base">姓名 *</Label>
                  <Input
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    placeholder="區權人姓名"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-base">電話</Label>
                  <Input value={form.ownerPhone} onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })} placeholder="聯絡電話" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-base">地址</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="住宅地址" />
                </div>
              </div>
            </div>

            {/* Co-residents */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-muted-foreground">同住人</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, coResidents: [...form.coResidents, { name: "", phone: "" }] })} className="h-7 text-base gap-1">
                  <Plus className="w-3 h-3" />新增
                </Button>
              </div>
              <div className="space-y-2">
                {form.coResidents.map((coResident, i) => (
                  <div key={i} className="grid grid-cols-3 gap-2 items-end">
                    <Input placeholder={`同住人 ${i + 1} 姓名`} value={coResident.name} onChange={(e) => { const updated = [...form.coResidents]; updated[i].name = e.target.value; setForm({ ...form, coResidents: updated }); }} />
                    <Input placeholder={`同住人 ${i + 1} 電話`} value={coResident.phone} onChange={(e) => { const updated = [...form.coResidents]; updated[i].phone = e.target.value; setForm({ ...form, coResidents: updated }); }} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => { const updated = form.coResidents.filter((_, idx) => idx !== i); setForm({ ...form, coResidents: updated }); }} className="h-9 w-9 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Parkings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-muted-foreground">車位</h3>
              <div className="space-y-3">
                {["car", "motorcycle", "bicycle"].map((type) => {
                  const label = type === "car" ? "汽車" : type === "motorcycle" ? "機車" : "自行車";
                  const parking = form.parkings.find((p) => p.type === type);
                  return (
                    <div key={type} className={type === "bicycle" ? "grid grid-cols-2 gap-2 items-end" : "grid grid-cols-3 gap-2 items-end"}>
                      <Input
                        placeholder={`${label}車位號`}
                        value={parking?.number || ""}
                        onChange={(e) => {
                          const existing = form.parkings.find((p) => p.type === type);
                          if (existing) {
                            const updated = form.parkings.map((p) =>
                              p.type === type ? { ...p, number: e.target.value } : p
                            );
                            setForm({ ...form, parkings: updated });
                          } else if (e.target.value) {
                            setForm({ ...form, parkings: [...form.parkings, { type: type as any, number: e.target.value, plateNumber: "" }] });
                          }
                        }}
                      />
                      {type !== "bicycle" && (
                        <Input
                          placeholder={`${label}車牌`}
                          value={parking?.plateNumber || ""}
                          onChange={(e) => {
                            const existing = form.parkings.find((p) => p.type === type);
                            if (existing) {
                              const updated = form.parkings.map((p) =>
                                p.type === type ? { ...p, plateNumber: e.target.value } : p
                              );
                              setForm({ ...form, parkings: updated });
                            } else if (e.target.value) {
                              setForm({ ...form, parkings: [...form.parkings, { type: type as any, number: "", plateNumber: e.target.value }] });
                            }
                          }}
                        />
                      )}
                      {parking && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => { const updated = form.parkings.filter((p) => p.type !== type); setForm({ ...form, parkings: updated }); }} className="h-9 w-9 text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-muted-foreground">緊急聯絡人</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, emergencyContacts: [...form.emergencyContacts, { name: "", phone: "", relation: "" }] })} className="h-7 text-base gap-1">
                  <Plus className="w-3 h-3" />新增
                </Button>
              </div>
              <div className="space-y-2">
                {form.emergencyContacts.map((contact, i) => (
                  <div key={i} className="grid gap-2 items-end" style={{ gridTemplateColumns: '1fr 1.5fr 0.8fr auto' }}>
                    <Input placeholder={`姓名`} value={contact.name} onChange={(e) => { const updated = [...form.emergencyContacts]; updated[i].name = e.target.value; setForm({ ...form, emergencyContacts: updated }); }} />
                    <Input placeholder={`電話`} value={contact.phone} onChange={(e) => { const updated = [...form.emergencyContacts]; updated[i].phone = e.target.value; setForm({ ...form, emergencyContacts: updated }); }} />
                    <Input placeholder="關係" value={contact.relation} onChange={(e) => { const updated = [...form.emergencyContacts]; updated[i].relation = e.target.value; setForm({ ...form, emergencyContacts: updated }); }} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => { const updated = form.emergencyContacts.filter((_, idx) => idx !== i); setForm({ ...form, emergencyContacts: updated }); }} className="h-9 w-9 text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-base">坪數</Label>
                <Input value={form.squareMeters} onChange={(e) => setForm({ ...form, squareMeters: e.target.value })} placeholder="例：30坪" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-base">搬入日期</Label>
                <Input type="date" value={form.moveInDate} onChange={(e) => setForm({ ...form, moveInDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-base">水錶號碼</Label>
                <Input value={form.waterMeterNumber} onChange={(e) => setForm({ ...form, waterMeterNumber: e.target.value })} placeholder="水錶號碼" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-base">電表號碼</Label>
                <Input value={form.electricityMeterNumber} onChange={(e) => setForm({ ...form, electricityMeterNumber: e.target.value })} placeholder="電表號碼" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-base">備註</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="其他備註" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId !== null ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>匯入住戶資料</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              請選擇包含住戶資料的 Excel 或 CSV 檔案。
            </p>
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={async () => {
                if (!importFile) {
                  toast.error('請選擇檔案');
                  return;
                }
                setImportLoading(true);
                try {
                  const formData = new FormData();
                  formData.append('file', importFile);
                  const response = await fetch('/api/residents/import', {
                    method: 'POST',
                    body: formData,
                  });
                  const result = await response.json();
                  if (response.ok) {
                    utils.residents.list.invalidate();
                    setImportDialogOpen(false);
                    setImportFile(null);
                    toast.success(`成功匯入 ${result.successCount} 筆住戶資料${result.errorCount > 0 ? `, 失敗 ${result.errorCount} 筆` : ''}`);

                  } else {
                    toast.error(result.error || '匯入失敗');
                  }
                } catch (error) {
                  toast.error('檔案解析失敗');
                } finally {
                  setImportLoading(false);
                }
              }}
              disabled={!importFile || importLoading}
            >
              {importLoading ? '處理中...' : '匯入'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除此住戶資料嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId !== null) {
                  deleteMutation.mutate({ id: deleteId });
                }
              }}
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


