"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus,
  Loader2,
  Trash2,
  Receipt,
  Camera,
  Mic,
  MicOff,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { ensureAuth } from "@/lib/firebase";
import {
  Expense,
  getAllExpenses,
  addExpense,
  deleteExpense,
  getExpenseSummary,
} from "@/lib/expenses";
import { parseReceiptImage } from "@/lib/gemini-commands";
import NavBar from "@/components/NavBar";
import toast from "react-hot-toast";

export default function ExpensesPage() {
  const { language } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [listening, setListening] = useState(false);
  const [showScanMenu, setShowScanMenu] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Manual add form
  const [vendor, setVendor] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Other");
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const loadExpenses = useCallback(async () => {
    try {
      await ensureAuth();
      const data = await getAllExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Close scan menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showScanMenu && !(e.target as Element).closest('.scan-menu-container')) {
        setShowScanMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showScanMenu]);

  const summary = getExpenseSummary(expenses);

  // Receipt scanning
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const receipt = await parseReceiptImage(base64, file.type);
        if (receipt && receipt.amount) {
          await addExpense({
            vendor: receipt.vendor || "",
            vendorFullName: receipt.vendorFullName || receipt.vendor || "",
            type: receipt.type || "Other",
            amount: receipt.amount,
            emoji: receipt.emoji || "🧾",
            discount: receipt.discount || 0,
            displayDate: receipt.displayDate || "",
            date: receipt.date || new Date().toISOString().split("T")[0],
            address: receipt.address || "",
            paymentMethod: receipt.paymentMethod || "Unknown",
            items: receipt.items || [],
            source: "receipt",
          });
          toast.success(`Receipt scanned: $${receipt.amount} at ${receipt.vendor}`);
          await loadExpenses();
        } else {
          toast.error("Couldn't read receipt. Try a clearer photo.");
        }
        setScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Failed to scan receipt");
      setScanning(false);
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Manual add
  const handleManualAdd = async () => {
    if (!vendor.trim() || !amount) return;
    try {
      const today = new Date();
      const day = today.getDate();
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
      await addExpense({
        vendor: vendor.trim(),
        vendorFullName: vendor.trim(),
        type,
        amount: parseFloat(amount),
        emoji: type === "Grocery" ? "🛒" : type === "Restaurant" ? "🍽️" : type === "Shopping" ? "🛍️" : "💰",
        discount: 0,
        displayDate: `${day}${suffix} ${months[today.getMonth()]}`,
        date: today.toISOString().split("T")[0],
        address: "",
        paymentMethod,
        items: [{ name: vendor.trim(), price: parseFloat(amount) }],
        source: "manual",
      });
      toast.success("Expense added!");
      setVendor("");
      setAmount("");
      setShowAddForm(false);
      await loadExpenses();
    } catch (err: any) {
      toast.error(err.message || "Failed to add expense");
    }
  };

  // Voice input
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech not supported"); return; }
    const recognition = new SR();
    recognition.lang = language === "Hindi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const t = event.results[0][0].transcript;
      setVendor(t);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      await loadExpenses();
      toast.success("Expense deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f5]">
      <NavBar />

      {/* Summary Cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-400 uppercase">{language === "Hindi" ? "कुल" : "Total"}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">${summary.total.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-400 uppercase">{language === "Hindi" ? "लेनदेन" : "Transactions"}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{summary.count}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-400 uppercase">{language === "Hindi" ? "श्रेणियाँ" : "Categories"}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{Object.keys(summary.byType).length}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 relative">
          {/* Hidden file inputs */}
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleReceiptUpload} className="hidden" />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
          
          {/* Scan Receipt Button with Dropdown */}
          <div className="relative scan-menu-container">
            <button
              onClick={() => setShowScanMenu(!showScanMenu)}
              disabled={scanning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {scanning ? (language === "Hindi" ? "स्कैन हो रहा..." : "Scanning...") : (language === "Hindi" ? "रसीद स्कैन करें" : "Scan Receipt")}
            </button>
            
            {/* Dropdown Menu */}
            {showScanMenu && !scanning && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => {
                    cameraInputRef.current?.click();
                    setShowScanMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-orange-500" />
                  <span>{language === "Hindi" ? "कैमरा से फोटो लें" : "Take Photo"}</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowScanMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                >
                  <Receipt className="w-4 h-4 text-orange-500" />
                  <span>{language === "Hindi" ? "गैलरी से चुनें" : "Choose from Gallery"}</span>
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {language === "Hindi" ? "मैन्युअल जोड़ें" : "Add Manual"}
          </button>
        </div>

        {/* Manual Add Form */}
        {showAddForm && (
          <div className="mt-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder={language === "Hindi" ? "दुकान / विवरण" : "Vendor / Description"}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button
                onClick={listening ? () => { recognitionRef.current?.stop(); setListening(false); } : startListening}
                className={`p-2 rounded-lg ${listening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                step="0.01"
                className="w-28 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                <option>Grocery</option>
                <option>Restaurant</option>
                <option>Shopping</option>
                <option>Transport</option>
                <option>Entertainment</option>
                <option>Utilities</option>
                <option>Healthcare</option>
                <option>Other</option>
              </select>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm">
                <option>Cash</option>
                <option>Card</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
              </select>
              <button
                onClick={handleManualAdd}
                disabled={!vendor.trim() || !amount}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {language === "Hindi" ? "जोड़ें" : "Add"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Expenses List */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            <p className="text-gray-400 mt-4 text-sm">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Receipt className="w-16 h-16 text-gray-200 mb-4" />
            <p className="text-gray-400">{language === "Hindi" ? "कोई खर्च नहीं" : "No expenses yet"}</p>
            <p className="text-gray-300 text-sm mt-1">{language === "Hindi" ? "रसीद स्कैन करें या मैन्युअल जोड़ें" : "Scan a receipt or add manually"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all shadow-sm overflow-hidden"
              >
                {/* Main expense row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-lg flex-shrink-0">
                    {exp.emoji || "💰"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {exp.vendorFullName || exp.vendor}
                      </span>
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                        {exp.type}
                      </span>
                      {exp.source === "telegram" && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 text-[10px] font-medium rounded">
                          Telegram
                        </span>
                      )}
                      {exp.source === "receipt" && (
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-500 text-[10px] font-medium rounded">
                          Scanned
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3 h-3 text-gray-300" />
                      <span className="text-xs text-gray-400">{exp.displayDate || exp.date}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{exp.paymentMethod}</span>
                      {exp.address && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-400 truncate max-w-[150px]">{exp.address}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-800">${exp.amount?.toFixed(2)}</div>
                    {exp.items && exp.items.length > 0 && (
                      <button
                        onClick={() => setExpandedExpense(expandedExpense === exp.id ? null : exp.id)}
                        className="text-[10px] text-orange-500 hover:text-orange-600 flex items-center gap-1 mt-0.5"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        {exp.items.length} {language === "Hindi" ? "वस्तुएं" : "items"}
                        {expandedExpense === exp.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded items breakdown */}
                {expandedExpense === exp.id && exp.items && exp.items.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600">
                        {language === "Hindi" ? "वस्तु विवरण" : "Item Breakdown"}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {exp.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-white rounded-lg">
                          <span className="text-xs text-gray-700">{item.name}</span>
                          <span className="text-xs font-semibold text-gray-800">${item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {exp.discount > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                        <span className="text-green-600 font-medium">
                          {language === "Hindi" ? "छूट" : "Discount"}
                        </span>
                        <span className="text-green-600 font-semibold">-${exp.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-semibold">
                        {language === "Hindi" ? "कुल" : "Total"}
                      </span>
                      <span className="text-gray-800 font-bold">${exp.amount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Analytics Section */}
        {!loading && expenses.length > 0 && (
          <div className="mt-8 space-y-4">
            {/* Category breakdown */}
            {Object.keys(summary.byType).length > 0 && (
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {language === "Hindi" ? "श्रेणी अनुसार" : "By Category"}
                </h3>
                <div className="space-y-2">
                  {Object.entries(summary.byType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, amt]) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-24 truncate">{cat}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                            style={{ width: `${(amt / summary.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-16 text-right">${amt.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Item-level analytics */}
            {(() => {
              const itemStats: Record<string, { count: number; total: number }> = {};
              expenses.forEach(exp => {
                exp.items?.forEach(item => {
                  const name = item.name.trim();
                  if (!itemStats[name]) {
                    itemStats[name] = { count: 0, total: 0 };
                  }
                  itemStats[name].count++;
                  itemStats[name].total += item.price;
                });
              });
              const topItems = Object.entries(itemStats)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 10);
              
              return topItems.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      {language === "Hindi" ? "शीर्ष खरीदी गई वस्तुएं" : "Top Purchased Items"}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {topItems.map(([item, stats], idx) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-400 w-4">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-700 truncate">{item}</div>
                          <div className="text-[10px] text-gray-400">
                            {stats.count} {language === "Hindi" ? "बार" : stats.count === 1 ? "time" : "times"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-800">${stats.total.toFixed(2)}</div>
                          <div className="text-[10px] text-gray-400">${(stats.total / stats.count).toFixed(2)} avg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
