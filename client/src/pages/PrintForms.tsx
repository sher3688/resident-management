import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { FileText, Printer, Eye, Building2, Wrench, ClipboardList, Users, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
const STATUS_LABELS: Record<string, string> = {
  pending: "待處理",
  in_progress: "處理中",
  completed: "已完成",
  cancelled: "已取消",
};
const FORM_TYPES = [
  {
    id: "resident-list",
    title: "住戶資料總表",
    desc: "列印所有住戶的基本資料，包含戶號、區權人、電話、車位等資訊",
    icon: Building2,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "resident-detail",
    title: "個人住戶資料表",
    desc: "列印單一住戶的完整資料，包含同住人、緊急連絡人等詳細資訊",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "resident-blank",
    title: "空白住戶登記表",
    desc: "列印空白的住戶登記表格，供新住戶填寫基本資料後提交",
    icon: ClipboardList,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    id: "repair-list",
    title: "報修統計總表",
    desc: "列印所有報修記錄，可依進度狀態篩選後列印",
    icon: Wrench,
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    id: "repair-single",
    title: "單筆報修單",
    desc: "選擇報修記錄列印單筆報修單，適合交付住戶或小包商確認",
    icon: FileText,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    id: "repair-blank",
    title: "空白報修申請單",
    desc: "列印空白的報修申請表格，供住戶填寫後提交",
    icon: ClipboardList,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: "move-in-notice",
    title: "入住須知",
    desc: "列印住戶入住前需知悉的各項規定與注意事項",
    icon: FileText,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];
export default function PrintFormsPage() {
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [selectedResidentId, setSelectedResidentId] = useState<string>("all");
  const [selectedRepairId, setSelectedRepairId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const printRef = useRef<HTMLDivElement>(null);
  const { data: residents = [] } = trpc.residents.list.useQuery(undefined);
  const { data: repairs = [] } = trpc.repairRequests.list.useQuery({});
  const filteredRepairs = selectedStatus === "all"
    ? repairs
    : repairs.filter((r) => r.status === selectedStatus);
  const selectedResident = selectedResidentId !== "all"
    ? residents.find((r) => String(r.id) === selectedResidentId)
    : null;
  const selectedRepair = selectedRepairId !== "all"
    ? repairs.find((r) => String(r.id) === selectedRepairId)
    : null;
  function handleExportExcel(formId?: string) {
    const workbook = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().split('T')[0];
    
    // 住戶資料總表
    if (!formId || formId === 'resident-list' || formId === 'resident-detail' || formId === 'resident-blank') {
      const residentData = residents.map((r: any) => ({
        "戶號": r.unitNumber,
        "區權人": r.ownerName,
        "電話": r.ownerPhone ?? "",
        "地址": r.address ?? "",
        "同住人1": r.coResident1Name ?? "",
        "同住人1電話": r.coResident1Phone ?? "",
        "同住人2": r.coResident2Name ?? "",
        "同住人2電話": r.coResident2Phone ?? "",
        "同住人3": r.coResident3Name ?? "",
        "同住人3電話": r.coResident3Phone ?? "",
        "同住人4": r.coResident4Name ?? "",
        "同住人4電話": r.coResident4Phone ?? "",
        "汽車車位": r.carParkingNumber ?? "",
        "汽車車牌": r.carPlateNumber ?? "",
        "機車車位": r.motorcycleParkingNumber ?? "",
        "機車車牌": r.motorcyclePlateNumber ?? "",
        "自行車位": r.bicycleParkingNumber ?? "",
        "平方公尺": r.squareMeters ?? "",
        "水表號": r.waterMeterNumber ?? "",
        "電表號": r.electricityMeterNumber ?? "",
        "入住日期": r.moveInDate ?? "",
        "緊急連絡人": r.emergencyContactName ?? "",
        "緊急連絡人電話": r.emergencyContactPhone ?? "",
        "緊急連絡人關係": r.emergencyContactRelation ?? "",
        "緊急連絡人2": r.emergencyContact2Name ?? "",
        "緊急連絡人2電話": r.emergencyContact2Phone ?? "",
        "緊急連絡人2關係": r.emergencyContact2Relation ?? "",
        "備註": r.notes ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(residentData);
      XLSX.utils.book_append_sheet(workbook, ws, "住戶資料");
    }
    
    // 報修統計表
    if (!formId || formId === 'repair-list' || formId === 'repair-single' || formId === 'repair-blank') {
      const repairData = repairs.map((r: any) => ({
        "報修編號": r.id,
        "戶號": r.unitNumber,
        "報修日期": r.repairDate ?? "",
        "報修內容": r.description ?? "",
        "狀態": STATUS_LABELS[r.status] ?? r.status,
        "完工日期": r.completionDate ?? "",
        "備註": r.notes ?? "",
        "建立時間": r.createdAt ?? "",
        "更新時間": r.updatedAt ?? "",
      }));
      const ws = XLSX.utils.json_to_sheet(repairData);
      XLSX.utils.book_append_sheet(workbook, ws, "報修統計");
    }
    
    const fileName = formId 
      ? `${FORM_TYPES.find(f => f.id === formId)?.title ?? '表單'}_${dateStr}.xlsx`
      : `住戶資料總表_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8" />
        <title>社區管理系統 - 列印表單</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Noto Sans TC', sans-serif; font-size: 11pt; color: #1a1a1a; background: white; padding: 20mm; }
          h1 { font-size: 16pt; font-weight: 700; margin-bottom: 4px; }
          h2 { font-size: 13pt; font-weight: 600; margin-bottom: 12px; border-bottom: 2px solid #b8860b; padding-bottom: 6px; color: #7a5c00; }
          h3 { font-size: 11pt; font-weight: 600; margin-bottom: 6px; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 1px solid #ddd; padding-bottom: 16px; }
          .subtitle { color: #666; font-size: 10pt; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10pt; }
          th { background: #f5f0e8; font-weight: 600; padding: 7px 10px; border: 1px solid #ccc; text-align: left; }
          td { padding: 6px 10px; border: 1px solid #ddd; vertical-align: top; }
          tr:nth-child(even) td { background: #fafaf8; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9pt; font-weight: 500; }
          .badge-pending { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
          .badge-in_progress { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
          .badge-completed { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
          .badge-cancelled { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
          .section { margin-bottom: 20px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .field-group { margin-bottom: 10px; }
          .field-label { font-size: 9pt; color: #666; margin-bottom: 2px; }
          .field-value { font-size: 10.5pt; }
          .blank-field { border-bottom: 1px solid #999; min-height: 24px; margin-bottom: 12px; }
          .blank-label { font-size: 9pt; color: #555; margin-bottom: 4px; }
          .footer { margin-top: 32px; text-align: right; font-size: 9pt; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
          @media print {
            body { padding: 15mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
        <div class="footer">列印日期：${new Date().toLocaleDateString("zh-TW")} &nbsp;｜&nbsp; 社區住戶管理系統</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }
  function renderPreviewContent() {
    if (previewType === "resident-list") {
      return (
        <div>
          <div className="header">
            <h1>住戶資料總表</h1>
            <div className="subtitle">列印日期：{new Date().toLocaleDateString("zh-TW")}　共 {residents.length} 筆</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: "6%" }}>戶號</th>
                <th style={{ width: "10%" }}>區權人</th>
                <th style={{ width: "10%" }}>電話</th>
                <th style={{ width: "15%" }}>同住人</th>
                <th style={{ width: "12%" }}>同住人電話</th>
                <th style={{ width: "8%" }}>汽車車位</th>
                <th style={{ width: "8%" }}>機車車位</th>
                <th style={{ width: "8%" }}>自行車位</th>
                <th style={{ width: "15%" }}>緊急連絡人</th>
                <th style={{ width: "12%" }}>附註</th>
              </tr>
            </thead>
            <tbody>
              {residents.map((r) => {
                const coNames = [r.coResident1Name, r.coResident2Name, r.coResident3Name, r.coResident4Name]
                  .filter(Boolean).join("、");
                const coPhones = [r.coResident1Phone, r.coResident2Phone, r.coResident3Phone, r.coResident4Phone]
                  .filter(Boolean).join("、");
                return (
                  <tr key={r.id}>
                    <td>{r.unitNumber}</td>
                    <td>{r.ownerName}</td>
                    <td>{r.ownerPhone ?? ""}</td>
                    <td>{coNames}</td>
                    <td>{coPhones}</td>
                    <td>{r.carParkingNumber ?? ""}</td>
                    <td>{r.motorcycleParkingNumber ?? ""}</td>
                    <td>{r.bicycleParkingNumber ?? ""}</td>
                    <td>
                      {[r.emergencyContactName, r.emergencyContact2Name]
                        .filter(Boolean)
                        .map((name, idx) => {
                          const relation = idx === 0 ? r.emergencyContactRelation : r.emergencyContact2Relation;
                          const phone = idx === 0 ? r.emergencyContactPhone : r.emergencyContact2Phone;
                          return `${name}${relation ? `（${relation}）` : ""} ${phone ?? ""}`;
                        })
                        .join("、")}
                    </td>
                    <td>{r.notes ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    if (previewType === "resident-detail") {
      const r = selectedResident;
      if (!r) {
        return (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>
            請先選擇住戶
          </div>
        );
      }
      const coResidents = [1, 2, 3, 4]
        .map((i) => ({ name: (r as any)[`coResident${i}Name`], phone: (r as any)[`coResident${i}Phone`] }))
        .filter((c) => c.name);
      const emergencyContacts = [
        r.emergencyContactName ? { name: r.emergencyContactName, phone: r.emergencyContactPhone, relation: r.emergencyContactRelation, address: r.emergencyContactAddress } : null,
        r.emergencyContact2Name ? { name: r.emergencyContact2Name, phone: r.emergencyContact2Phone, relation: r.emergencyContact2Relation, address: r.emergencyContact2Address } : null,
      ].filter(Boolean) as any[];
      return (
        <div>
          <div className="header">
            <h1>住戶資料表</h1>
            <div className="subtitle">列印日期：{new Date().toLocaleDateString("zh-TW")}</div>
          </div>
          <div className="section">
            <h2>基本資料</h2>
            <div className="grid-2">
              <div className="field-group">
                <div className="field-label">戶號</div>
                <div className="field-value"></div>
              </div>
              <div className="field-group">
                <div className="field-label">區權人姓名</div>
                <div className="field-value">{r.ownerName}</div>
              </div>
              <div className="field-group">
                <div className="field-label">區權人電話</div>
                <div className="field-value">{r.ownerPhone ?? "—"}</div>
              </div>
            </div>
          </div>
          {coResidents.length > 0 && (
            <div className="section">
              <h2>同住人資料</h2>
              <table>
                <thead>
                  <tr><th>姓名</th><th>電話</th></tr>
                </thead>
                <tbody>
                  {coResidents.map((c, i) => (
                    <tr key={i}><td>{c.name}</td><td>{c.phone ?? "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="section">
            <h2>車位資料</h2>
            <div className="grid-2">
              <div className="field-group">
                <div className="field-label">汽車車位號碼</div>
                <div className="field-value">{r.carParkingNumber ?? "—"}</div>
              </div>
              <div className="field-group">
                <div className="field-label">機車車位號碼</div>
                <div className="field-value">{r.motorcycleParkingNumber ?? "—"}</div>
              </div>
              <div className="field-group">
                <div className="field-label">自行車位號碼</div>
                <div className="field-value">{r.bicycleParkingNumber ?? "—"}</div>
              </div>
            </div>
          </div>
          {emergencyContacts.length > 0 && (
            <div className="section">
              <h2>緊急連絡人</h2>
              <table>
                <thead>
                  <tr><th>姓名</th><th>關係</th><th>電話</th><th>住址</th></tr>
                </thead>
                <tbody>
                  {emergencyContacts.map((ec, i) => (
                    <tr key={i}>
                      <td>{ec.name}</td>
                      <td>{ec.relation ?? "—"}</td>
                      <td>{ec.phone ?? "—"}</td>
                      <td>{ec.address ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {r.notes && (
            <div className="section">
              <h2>備註</h2>
              <p style={{ fontSize: "10.5pt" }}>{r.notes}</p>
            </div>
          )}
        </div>
      );
    }
    if (previewType === "repair-list") {
      return (
        <div>
          <div className="header">
            <h1>報修統計總表</h1>
            <div className="subtitle">
              列印日期：{new Date().toLocaleDateString("zh-TW")}　
              {selectedStatus !== "all" ? `篩選：${STATUS_LABELS[selectedStatus]}　` : ""}
              共 {filteredRepairs.length} 筆
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: "10%" }}>報修日期</th>
                <th style={{ width: "8%" }}>戶號</th>
                <th style={{ width: "10%" }}>報修人</th>
                <th style={{ width: "12%" }}>修繕位置</th>
                <th style={{ width: "30%" }}>狀況描述</th>
                <th style={{ width: "10%" }}>進度</th>
                <th style={{ width: "20%" }}>處理備註</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.map((r) => (
                <tr key={r.id}>
                  <td>{String(r.repairDate)}</td>
                  <td></td>
                  <td>—</td>
                  <td>—</td>
                  <td>{r.description}</td>
                  <td>
                    <span className={`badge badge-${r.status || 'pending'}`}>
                      {r.status ? STATUS_LABELS[r.status] : 'pending'}
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (previewType === "resident-blank") {
      return (
        <div>
          <div className="header">
            <h1>住戶登記表</h1>
            <div className="subtitle">請填寫完整後交至管理室</div>
          </div>
          <div className="section">
            <h2>基本資料</h2>
            <div className="grid-2">
              <div><div className="blank-label">戶號</div><div className="blank-field"></div></div>
              <div><div className="blank-label">區權人姓名</div><div className="blank-field"></div></div>
              <div><div className="blank-label">區權人電話</div><div className="blank-field"></div></div>
            </div>
          </div>
          <div className="section">
            <h2>同住人資料</h2>
            {[1,2,3,4].map(i => (
              <div key={i} className="grid-2" style={{marginBottom:'10px'}}>
                <div><div className="blank-label">同住人{i}姓名</div><div className="blank-field"></div></div>
                <div><div className="blank-label">同住人{i}電話</div><div className="blank-field"></div></div>
              </div>
            ))}
          </div>
          <div className="section">
            <h2>車位號碼</h2>
            <div className="grid-2">
              <div><div className="blank-label">汽車車位</div><div className="blank-field"></div></div>
              <div><div className="blank-label">機車車位</div><div className="blank-field"></div></div>
              <div><div className="blank-label">自行車位</div><div className="blank-field"></div></div>
            </div>
          </div>
          <div className="section">
            <h2>緊急連絡人</h2>
            <div className="grid-2">
              <div><div className="blank-label">姓名</div><div className="blank-field"></div></div>
              <div><div className="blank-label">關係</div><div className="blank-field"></div></div>
              <div><div className="blank-label">電話</div><div className="blank-field"></div></div>
            </div>
          </div>
          <div className="section">
            <div className="blank-label">備註</div>
            <div className="blank-field" style={{minHeight:'50px'}}></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',marginTop:'32px'}}>
            <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #999',paddingTop:'6px',fontSize:'9pt',color:'#666'}}>登記人簽名</div></div>
            <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #999',paddingTop:'6px',fontSize:'9pt',color:'#666'}}>管理員簽名</div></div>
          </div>
        </div>
      );
    }
    if (previewType === "repair-single") {
      const r = selectedRepair;
      if (!r) {
        return <div style={{textAlign:'center',padding:'40px',color:'#888'}}>請先選擇報修記錄</div>;
      }
      return (
        <div>
          <div className="header">
            <h1>報修單</h1>
            <div className="subtitle">列印日期：{new Date().toLocaleDateString('zh-TW')}</div>
          </div>
          <div className="section">
            <h2>報修資訊</h2>
            <div className="grid-2">
              <div className="field-group"><div className="field-label">報修日期</div><div className="field-value">{String(r.repairDate)}</div></div>
              <div className="field-group"><div className="field-label">戶號</div><div className="field-value"></div></div>
            </div>
            <div className="field-group" style={{marginTop:'10px'}}>
              <div className="field-label">狀況描述</div>
              <div className="field-value" style={{padding:'8px',border:'1px solid #ddd',borderRadius:'4px',minHeight:'60px'}}>{r.description}</div>
            </div>
          </div>
          <div className="section">
            <h2>處理情況</h2>
            <div className="grid-2">
              <div className="field-group"><div className="field-label">進度狀態</div><div className="field-value"><span className={`badge badge-${r.status || 'pending'}`}>{r.status ? STATUS_LABELS[r.status] : 'pending'}</span></div></div>
            </div>

          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',marginTop:'32px'}}>
            <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #999',paddingTop:'6px',fontSize:'9pt',color:'#666'}}>住戶簽名確認</div></div>
            <div style={{textAlign:'center'}}><div style={{borderTop:'1px solid #999',paddingTop:'6px',fontSize:'9pt',color:'#666'}}>管理員簽名</div></div>
          </div>
        </div>
      );
    }
    if (previewType === "repair-blank") {
      return (
        <div>
          <div className="header">
            <h1>報修申請單</h1>
            <div className="subtitle">請填寫完整後交至管理室</div>
          </div>
          <div className="section">
            <div className="grid-2">
              <div>
                <div className="blank-label">申請日期</div>
                <div className="blank-field"></div>
              </div>
              <div>
                <div className="blank-label">戶號</div>
                <div className="blank-field"></div>
              </div>
              <div>
                <div className="blank-label">申請人姓名</div>
                <div className="blank-field"></div>
              </div>
              <div>
                <div className="blank-label">聯絡電話</div>
                <div className="blank-field"></div>
              </div>
            </div>
            <div>
              <div className="blank-label">修繕位置</div>
              <div className="blank-field"></div>
            </div>
            <div style={{ marginTop: "12px" }}>
              <div className="blank-label">問題描述（請詳細說明）</div>
              <div className="blank-field" style={{ minHeight: "80px" }}></div>
            </div>
          </div>
          <div className="section" style={{ marginTop: "24px" }}>
            <h2>管理室填寫欄</h2>
            <div className="grid-2">
              <div>
                <div className="blank-label">受理日期</div>
                <div className="blank-field"></div>
              </div>
              <div>
                <div className="blank-label">處理人員</div>
                <div className="blank-field"></div>
              </div>
              <div>
                <div className="blank-label">完成日期</div>
                <div className="blank-field"></div>
              </div>
              <div>
                <div className="blank-label">進度狀態</div>
                <div className="blank-field"></div>
              </div>
            </div>
            <div>
              <div className="blank-label">處理備註</div>
              <div className="blank-field" style={{ minHeight: "60px" }}></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginTop: "32px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #999", paddingTop: "6px", fontSize: "9pt", color: "#666" }}>申請人簽名</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ borderTop: "1px solid #999", paddingTop: "6px", fontSize: "9pt", color: "#666" }}>管理員簽名</div>
            </div>
          </div>
        </div>
      );
    }










    if (previewType === "move-in-notice") {
      return (
        <div>
          <div className="header">
            <h1>住戶入住須知</h1>
            <div className="subtitle">美樹大悅社區住戶入住須知</div>
          </div>

          <div className="section" style={{ textAlign: "center", padding: "40px" }}>
            <div style={{ marginBottom: "24px" }}>
              <FileText style={{ width: "64px", height: "64px", color: "#2563eb", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: "18pt", fontWeight: "700", marginBottom: "8px" }}>入住須知文件</h2>
              <p style={{ fontSize: "10.5pt", color: "#666", marginBottom: "16px" }}>請聯繫管理員上傳入住須知文件</p>
            </div>

            <p style={{ fontSize: "10pt", color: "#999" }}>
              目前系統尚未設定入住須知文件，管理員可透過後台資源庫上傳相關文件。
            </p>
          </div>
        </div>
      );
    }
    return null;
  }
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          列印表單
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          選擇所需表格，預覽後點擊列印即可輸出為 PDF
        </p>
      </div>
      {/* Form cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FORM_TYPES.map((form) => (
          <div
            key={form.id}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg ${form.bg} flex items-center justify-center shrink-0`}>
                <form.icon className={`w-5 h-5 ${form.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm">{form.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{form.desc}</p>
              </div>
            </div>
            {/* Options for specific forms */}
            {form.id === "resident-detail" && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">選擇住戶</Label>
                <Select value={selectedResidentId} onValueChange={setSelectedResidentId}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="選擇住戶…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">— 請選擇住戶 —</SelectItem>
                    {residents.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                         - {r.ownerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.id === "repair-single" && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">選擇報修記錄</Label>
                <Select value={selectedRepairId} onValueChange={setSelectedRepairId}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue placeholder="選擇報修記錄…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">— 請選擇報修記錄 —</SelectItem>
                    {repairs.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {String(r.repairDate)} - {r.description.slice(0, 15)}{r.description.length > 15 ? '...' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.id === "repair-list" && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">篩選進度狀態</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="pending">待處理</SelectItem>
                    <SelectItem value="in_progress">處理中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs flex-1"
                onClick={() => setPreviewType(form.id)}
              >
                <Eye className="w-3.5 h-3.5" />
                預覽
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs flex-1"
                onClick={() => handleExportExcel(form.id)}
              >
                <Download className="w-3.5 h-3.5" />
                匯出 Excel
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* Preview Dialog */}
      <Dialog open={previewType !== null} onOpenChange={(o) => { if (!o) setPreviewType(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-serif text-lg">
                {FORM_TYPES.find((f) => f.id === previewType)?.title ?? "表單預覽"}
              </DialogTitle>
              <Button onClick={handlePrint} className="gap-2 mr-6">
                <Printer className="w-4 h-4" />
                列印 / 儲存 PDF
              </Button>
            </div>
          </DialogHeader>
          {/* Print content */}
          <div
            ref={printRef}
            className="bg-white border border-border rounded-lg p-8 text-sm font-sans"
            style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
          >
            {renderPreviewContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

