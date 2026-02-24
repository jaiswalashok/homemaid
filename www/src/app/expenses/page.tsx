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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleReceiptUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {scanning ? (language === "Hindi" ? "स्कैन हो रहा..." : "Scanning...") : (language === "Hindi" ? "रसीद स्कैन करें" : "Scan Receipt")}
          </button>
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
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all shadow-sm"
              >
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
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-800">${exp.amount?.toFixed(2)}</div>
                  {exp.items?.length > 1 && (
                    <span className="text-[10px] text-gray-400">{exp.items.length} items</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        {!loading && Object.keys(summary.byType).length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
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
      </main>
    </div>
  );
}
