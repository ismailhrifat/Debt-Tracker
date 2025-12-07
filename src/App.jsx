import React, { useState, useEffect, useMemo, useRef } from 'react';

// --- CAPACITOR SETUP (IMPORTANT) ---
// FOR LOCAL ANDROID BUILD: Uncomment the line below
import { App as CapacitorApp } from '@capacitor/app';

// FOR WEB PREVIEW ONLY: Keep this mock object to prevent errors in the browser
// const CapacitorApp = {
//   addListener: async (eventName, callback) => {
//     console.log(`[Mock] Listener added for ${eventName}`);
//     return { remove: () => {} };
//   },
//   minimizeApp: async () => {
//     console.log('[Mock] App minimized');
//   },
//   removeAllListeners: async () => {}
// };
// -----------------------------------

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Trash2, 
  LogOut, 
  Wallet, 
  CheckCircle2, 
  XCircle,
  ChevronRight, 
  MoreVertical,
  Calendar,
  CreditCard,
  User,
  LayoutDashboard,
  Archive,
  Pencil
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "DEL",
  authDomain: "debt-record-c1b6b.firebaseapp.com",
  projectId: "debt-record-c1b6b",
  storageBucket: "debt-record-c1b6b.firebasestorage.app",
  messagingSenderId: "997249733226",
  appId: "1:997249733226:web:cfdee90cb832f26d543013"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = "debt-tracker-v1";

// --- Helper Functions ---

// Robustly calculate balance by replaying history
const calculateBalance = (records, startType) => {
  let balance = 0;
  // We treat 'Lent' as Positive (+), 'Borrowed' as Negative (-) for calculation
  
  records.forEach((record) => {
    const amt = parseFloat(record.amount);
    if (isNaN(amt)) return;

    if (record.action === 'initial') {
        if (startType === 'lent') balance += amt;
        else balance -= amt;
    } else if (record.action === 'increase') {
         // Increases magnitude away from 0
         if (balance >= 0) balance += amt;
         else balance -= amt;
    } else if (record.action === 'repay') {
         // Decreases magnitude towards 0 (and crosses if large enough)
         if (balance >= 0) balance -= amt;
         else balance += amt;
    }
  });
  
  return balance;
};

// --- Components ---

// 1. Authentication Screen
const AuthScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let backListener = null;
    const setupListener = async () => {
      backListener = await CapacitorApp.addListener('backButton', () => {
        CapacitorApp.minimizeApp();
      });
    };
    setupListener();
    return () => { if (backListener) backListener.remove(); };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      let msg = "An unexpected error occurred.";
      switch (err.code) {
        case 'auth/email-already-in-use': msg = "Email already registered."; break;
        case 'auth/weak-password': msg = "Password too weak."; break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password': msg = "Invalid credentials."; break;
        case 'auth/invalid-email': msg = "Invalid email."; break;
        default: msg = err.message.replace('Firebase: ', '');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#107e7d] p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Debt Manager</h1>
          <p className="text-teal-100">Keep track of your finances</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#107e7d] outline-none"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute left-3 top-3 w-5 h-5 text-slate-400">@</div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#107e7d] outline-none"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-3 font-bold w-5 h-5 text-slate-400 text-center">***</div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#107e7d] outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            {error && <div className="text-[#C83E4D] text-sm bg-[#C83E4D]/10 p-3 rounded-lg">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#107e7d] hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-70"
            >
              {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsRegistering(!isRegistering)} className="text-[#107e7d] font-medium text-sm hover:underline">
              {isRegistering ? 'Already have an account? Sign In' : 'New here? Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Main Dashboard
const Dashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('active'); 
  const [subTab, setSubTab] = useState('lent'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false); 
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState(null); 
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safe Back Button Logic
  const showAddModalRef = useRef(showAddModal);
  const selectedDebtIdRef = useRef(selectedDebtId);
  const showExitConfirmRef = useRef(showExitConfirm);

  useEffect(() => { showAddModalRef.current = showAddModal; }, [showAddModal]);
  useEffect(() => { selectedDebtIdRef.current = selectedDebtId; }, [selectedDebtId]);
  useEffect(() => { showExitConfirmRef.current = showExitConfirm; }, [showExitConfirm]);

  useEffect(() => {
    let backListener = null;
    const setupListener = async () => {
      backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (showExitConfirmRef.current) {
          setShowExitConfirm(false);
        } else if (showAddModalRef.current) {
          setShowAddModal(false);
        } else if (selectedDebtIdRef.current) {
          setSelectedDebtId(null);
        } else {
          setShowExitConfirm(true);
        }
      });
    };
    setupListener();
    return () => { if (backListener) backListener.remove(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'debts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDebts(debtList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching debts:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Helper to get the latest transaction date
  const getDisplayDate = (debt) => {
    if (!debt.records || debt.records.length === 0) {
      return new Date(debt.lastUpdated).toLocaleDateString();
    }
    // Find the record with the latest date string
    const latestRecord = debt.records.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    }, debt.records[0]);
    
    return new Date(latestRecord.date).toLocaleDateString();
  };

  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      const isStatusMatch = activeTab === 'active' ? debt.amount > 0 : debt.amount === 0;
      const isTypeMatch = subTab === 'lent' ? debt.type === 'lent' : debt.type === 'borrowed';
      return isStatusMatch && isTypeMatch;
    }).sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
  }, [debts, activeTab, subTab]);

  const totalAmount = useMemo(() => {
    return filteredDebts.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredDebts]);

  const handleSignOut = () => {
    if (confirm("Are you sure you want to logout?")) signOut(auth);
  };

  const selectedDebt = useMemo(() => debts.find(d => d.id === selectedDebtId), [debts, selectedDebtId]);

  if (selectedDebtId && selectedDebt) {
    return <DebtDetailView debt={selectedDebt} user={user} onBack={() => setSelectedDebtId(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div 
        className="bg-[#107e7d] pb-12 px-6 rounded-b-[2.5rem] shadow-xl relative z-10"
        style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div><p className="text-white font-semibold text-lg">{user.displayName || 'User'}</p></div>
          </div>
          <button onClick={handleSignOut} className="text-teal-100 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>

        <div className="flex p-1 bg-black/20 rounded-xl mb-6 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'active' ? 'bg-white text-[#107e7d] shadow-md' : 'text-teal-100 hover:text-white'}`}
          >
            <LayoutDashboard size={16} /> Active Debts
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'closed' ? 'bg-white text-[#107e7d] shadow-md' : 'text-teal-100 hover:text-white'}`}
          >
            <Archive size={16} /> Closed History
          </button>
        </div>

        <div className="text-center">
          <p className="text-teal-100 text-sm mb-1">Total {activeTab === 'active' ? 'Outstanding' : 'Settled'} ({subTab === 'lent' ? 'Receivable' : 'Payable'})</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">৳ {totalAmount.toLocaleString()}</h2>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-2 flex justify-between items-center">
          <button 
            onClick={() => setSubTab('lent')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors flex flex-col items-center gap-1 ${subTab === 'lent' ? 'bg-[#058c42]/10 text-[#058c42]' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <span className="flex items-center gap-1"><ArrowUpRight size={16} /> I Lent</span>
          </button>
          <div className="w-px h-8 bg-slate-100 mx-2"></div>
          <button 
            onClick={() => setSubTab('borrowed')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors flex flex-col items-center gap-1 ${subTab === 'borrowed' ? 'bg-[#C83E4D]/10 text-[#C83E4D]' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <span className="flex items-center gap-1"><ArrowDownLeft size={16} /> I Borrowed</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-4">
        {loading ? (
          <div className="flex justify-center pt-10 text-slate-400">Loading...</div>
        ) : filteredDebts.length === 0 ? (
          <div className="text-center pt-12 opacity-50">
            <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <History size={40} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No records found</p>
            <p className="text-xs text-slate-400 mt-1">Add a new debt to get started</p>
          </div>
        ) : (
          filteredDebts.map(debt => (
            <div 
              key={debt.id}
              onClick={() => setSelectedDebtId(debt.id)}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center group"
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">{debt.name}</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[150px]">{debt.description || 'No description'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${debt.type === 'lent' ? 'text-[#058c42]' : 'text-[#C83E4D]'}`}>
                  ৳{debt.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">
                  {getDisplayDate(debt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-3">
          {fabOpen && (
            <>
              <button 
                onClick={() => { setSubTab('lent'); setShowAddModal('lent'); setFabOpen(false); }}
                className="bg-[#058c42] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium hover:opacity-90 transition-colors animate-in slide-in-from-bottom-5 fade-in duration-200"
              >
                <ArrowUpRight size={18} /> I Lent
              </button>
              <button 
                onClick={() => { setSubTab('borrowed'); setShowAddModal('borrowed'); setFabOpen(false); }}
                className="bg-[#C83E4D] text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 font-medium hover:opacity-90 transition-colors animate-in slide-in-from-bottom-5 fade-in duration-200 delay-75"
              >
                <ArrowDownLeft size={18} /> I Borrowed
              </button>
            </>
          )}
          <button 
            onClick={() => setFabOpen(!fabOpen)}
            className={`w-14 h-14 rounded-full shadow-xl shadow-[#107e7d]/30 flex items-center justify-center text-white transition-all duration-300 ${fabOpen ? 'bg-slate-700 rotate-45' : 'bg-[#107e7d] hover:opacity-90'}`}
          >
            <Plus size={28} />
          </button>
        </div>

      {showAddModal && <AddDebtModal type={showAddModal} onClose={() => setShowAddModal(false)} user={user} />}
      
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Exit App?</h3>
              <p className="text-slate-500 mb-6">Are you sure you want to exit the application?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={() => CapacitorApp.minimizeApp()} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 shadow-lg transition-colors">Exit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Detail View
const DebtDetailView = ({ debt, user, onBack }) => {
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null); // State for editing

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this debt record completely?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'debts', debt.id));
      onBack();
    }
  };

  const handleEdit = (record, index) => {
    // Reverse index logic: UI shows reversed list, but we need the original index from the records array
    // However, the map below uses slice().reverse().map((record, idx) => ...)
    // So 'record' object is correct. We need to find its true index in the original array.
    // Since records are unique objects in memory for this render, indexOf works, 
    // OR we can pass the real index if we iterate differently.
    // Simplest: `debt.records.indexOf(record)`
    const realIndex = debt.records.indexOf(record);
    setEditingRecord({ ...record, index: realIndex });
  };

  const isLent = debt.type === 'lent';
  const mainColor = isLent ? 'text-[#058c42]' : 'text-[#C83E4D]';
  const mainBg = isLent ? 'bg-[#058c42]' : 'bg-[#C83E4D]';

  return (
    <div className="h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Detail Header */}
      <div 
        className={`${mainBg} pb-8 px-6 rounded-b-[2.5rem] shadow-lg text-white relative z-10 shrink-0`}
        style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }}
      >
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="p-2 bg-white/20 rounded-full hover:bg-white/30 backdrop-blur-md transition-colors">
            <ChevronRight className="rotate-180 w-6 h-6" />
          </button>
          <h2 className="font-semibold text-lg">Details</h2>
          <button onClick={handleDelete} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-md transition-colors text-white">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-1">{debt.name}</h1>
          <p className="opacity-90 text-sm">{isLent ? 'Receivable Amount' : 'Payable Amount'}</p>
          <div className="mt-4 text-4xl font-bold tracking-tight">
            ৳ {debt.amount.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-4 overflow-y-auto pb-32 pt-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
           <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <div className={`font-bold ${debt.amount === 0 ? 'text-slate-500' : mainColor} flex items-center gap-1`}>
                  {debt.amount === 0 ? <CheckCircle2 size={16}/> : <History size={16}/>}
                  {debt.amount === 0 ? 'Closed' : 'Active'}
                </div>
             </div>
             <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Last Updated</p>
                <p className="font-bold text-slate-700 text-sm">
                   {/* Use the helper from Dashboard logic or just fallback to lastUpdated timestamp if simpler here */}
                   {new Date(debt.lastUpdated).toLocaleDateString()}
                </p>
             </div>
           </div>

           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             <History size={18} className="text-[#107e7d]" /> Transaction History
           </h3>
           
           <div className="space-y-6 relative border-l-2 border-slate-100 ml-3 pl-6">
             {debt.records && debt.records.slice().reverse().map((record, idx) => (
               <div key={idx} className="relative group">
                 <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                   record.action === 'initial' ? 'bg-[#107e7d]' :
                   record.action === 'increase' ? (isLent ? 'bg-[#058c42]' : 'bg-[#C83E4D]') :
                   'bg-slate-400'
                 }`}></div>
                 
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="font-bold text-slate-800 text-sm">{record.description}</p>
                     <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                       <Calendar size={10} /> {record.date} • <CreditCard size={10} /> {record.account}
                     </p>
                   </div>
                   <div className="text-right">
                     <div className="flex items-center gap-2 justify-end">
                       <div>
                         <p className={`font-bold text-sm ${
                            record.action === 'repay' ? 'text-[#058c42]' : 
                            record.action === 'increase' ? 'text-[#C83E4D]' : 'text-slate-600'
                         }`}>
                           {record.action === 'repay' ? '-' : '+'} ৳{parseInt(record.amount).toLocaleString()}
                         </p>
                         <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{record.action}</p>
                       </div>
                       {/* Edit Button */}
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                          className="p-1.5 text-slate-300 hover:text-[#107e7d] hover:bg-slate-50 rounded-full transition-colors"
                       >
                         <Pencil size={14} />
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {debt.amount > 0 && (
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white border-t border-slate-100 shadow-lg-up z-20">
           <button 
             onClick={() => setShowRecordModal(true)}
             className="w-full bg-[#107e7d] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#107e7d]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
           >
             <Plus size={20} /> Add Record / Update
           </button>
        </div>
      )}

      {showRecordModal && (
        <AddRecordModal 
          debt={debt} 
          onClose={() => setShowRecordModal(false)}
          user={user}
        />
      )}
      
      {editingRecord && (
        <EditRecordModal
          debt={debt}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          user={user}
        />
      )}
    </div>
  );
};

// 4. Modals
const AddDebtModal = ({ type, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    account: 'Cash',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || (!formData.description && formData.description !== '')) return;
    
    setLoading(true);
    try {
      const numAmount = parseFloat(formData.amount);
      const newDebt = {
        name: formData.name,
        description: formData.description,
        type: type,
        amount: numAmount,
        originalAmount: numAmount,
        status: 'active',
        lastUpdated: new Date().toISOString(),
        records: [{
          action: 'initial',
          amount: numAmount,
          description: formData.description || 'Initial Debt',
          account: formData.account,
          date: formData.date,
          timestamp: new Date().toISOString()
        }]
      };

      await addDoc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'debts'), newDebt);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Error saving debt");
    } finally {
      setLoading(false);
    }
  };

  const isLent = type === 'lent';
  const headerBg = isLent ? 'bg-[#058c42]' : 'bg-[#C83E4D]';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        <div className={`p-4 flex justify-between items-center ${headerBg} text-white`}>
          <h3 className="font-bold text-lg flex items-center gap-2">
            {isLent ? <ArrowUpRight /> : <ArrowDownLeft />} 
            Add {isLent ? 'Lent' : 'Borrowed'} Debt
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><XCircle /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Name</label>
            <input 
              required
              type="text" 
              placeholder="Who is this?"
              className="w-full text-lg border-b-2 border-slate-200 py-2 focus:border-[#107e7d] outline-none bg-transparent"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount</label>
            <div className="flex items-center">
              <span className="text-2xl text-slate-400 mr-2">৳</span>
              <input 
                required
                type="number" 
                inputMode="numeric"
                placeholder="0"
                className="w-full text-3xl font-bold border-b-2 border-slate-200 py-2 focus:border-[#107e7d] outline-none bg-transparent"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Description {formData.description ? '' : '*'}</label>
            <input 
              type="text" 
              placeholder="What was it for?"
              required={!formData.description}
              className="w-full border-b-2 border-slate-200 py-2 focus:border-[#107e7d] outline-none bg-transparent text-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Account</label>
               <select 
                 className="w-full mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#107e7d]"
                 value={formData.account}
                 onChange={e => setFormData({...formData, account: e.target.value})}
               >
                 {["Cash", "bKash", "Nagad", "Bank", "Others"].map(opt => (
                   <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date</label>
               <input 
                 type="date" 
                 className="w-full mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#107e7d]"
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
             </div>
          </div>

          <button 
            disabled={loading}
            className={`w-full mt-4 py-3 rounded-xl text-white font-bold shadow-lg transition-all active:scale-[0.98] ${
              loading ? 'bg-slate-400' : (isLent ? 'bg-[#058c42] hover:opacity-90' : 'bg-[#C83E4D] hover:opacity-90')
            }`}
          >
            {loading ? 'Saving...' : 'Create Debt Record'}
          </button>
        </form>
      </div>
    </div>
  );
};

// New Edit Modal Component
const EditRecordModal = ({ debt, record, onClose, user }) => {
  const [formData, setFormData] = useState({
    description: record.description,
    account: record.account,
    amount: record.amount,
    date: record.date,
  });
  const [loading, setLoading] = useState(false);

  // Reused logic to calculate state and update firestore
  const calculateAndUpdate = async (updatedRecords) => {
      // Determine start type
      const currentAmount = debt.amount;
      const currentType = debt.type;
      const balLent = calculateBalance(debt.records, 'lent');
      const matchLent = (balLent >= 0 && currentType === 'lent' && Math.abs(balLent) === currentAmount) || 
                        (balLent < 0 && currentType === 'borrowed' && Math.abs(balLent) === currentAmount);
      const determinedStartType = matchLent ? 'lent' : 'borrowed';

      // Replay history
      const newBalance = calculateBalance(updatedRecords, determinedStartType);
      
      const newAmount = Math.abs(newBalance);
      const newType = newBalance >= 0 ? 'lent' : 'borrowed';
      const newStatus = newAmount === 0 ? 'closed' : 'active';

      // Update Firestore
      const debtRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'debts', debt.id);
      
      await updateDoc(debtRef, {
        amount: newAmount,
        type: newType,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        records: updatedRecords
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedRecords = [...debt.records];
      updatedRecords[record.index] = {
        ...updatedRecords[record.index],
        description: formData.description,
        account: formData.account,
        amount: parseFloat(formData.amount),
        date: formData.date,
      };

      await calculateAndUpdate(updatedRecords);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update record. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to remove this specific transaction?")) return;
    setLoading(true);
    try {
      // Filter out the record at the specific index
      const updatedRecords = debt.records.filter((_, idx) => idx !== record.index);
      await calculateAndUpdate(updatedRecords);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to delete record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-4 flex justify-between items-center bg-[#107e7d] text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Pencil size={18} /> Edit Record
          </h3>
          <div className="flex items-center gap-1">
            <button 
                onClick={handleDelete} 
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white mr-1"
                title="Delete Transaction"
            >
                <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><XCircle /></button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-lg border border-yellow-100">
            <strong>Note:</strong> Changing the amount will automatically recalculate the total remaining debt.
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount</label>
            <div className="flex items-center">
              <span className="text-2xl text-slate-400 mr-2">৳</span>
              <input 
                required
                type="number" 
                inputMode="numeric"
                className="w-full text-3xl font-bold border-b-2 border-slate-200 py-2 focus:border-[#107e7d] outline-none bg-transparent"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Description</label>
            <input 
              type="text" 
              required
              className="w-full border-b-2 border-slate-200 py-2 focus:border-[#107e7d] outline-none bg-transparent text-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Account</label>
               <select 
                 className="w-full mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#107e7d]"
                 value={formData.account}
                 onChange={e => setFormData({...formData, account: e.target.value})}
               >
                 {["Cash", "bKash", "Nagad", "Bank", "Others"].map(opt => (
                   <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date</label>
               <input 
                 type="date" 
                 className="w-full mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#107e7d]"
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
             </div>
          </div>

          <button 
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-[#107e7d] hover:opacity-90 text-white font-bold shadow-lg shadow-[#107e7d]/30 transition-all active:scale-[0.98]"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

const AddRecordModal = ({ debt, onClose, user }) => {
  const [formData, setFormData] = useState({
    action: 'repay',
    description: '',
    account: 'Cash',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    setLoading(true);

    try {
      const numAmount = parseFloat(formData.amount);
      let calculatedAmount = debt.amount;
      if (formData.action === 'repay') {
        calculatedAmount = debt.amount - numAmount;
      } else {
        calculatedAmount = debt.amount + numAmount;
      }

      let newAmount = Math.abs(calculatedAmount);
      let newType = debt.type;
      let newStatus = 'active';

      if (calculatedAmount < 0) {
        newType = debt.type === 'lent' ? 'borrowed' : 'lent';
      } else if (calculatedAmount === 0) {
        newStatus = 'closed';
      }
      
      const newRecord = {
        action: formData.action,
        amount: numAmount,
        description: formData.description || (formData.action === 'repay' ? 'Repayment' : 'Additional Debt'),
        account: formData.account,
        date: formData.date,
        timestamp: new Date().toISOString()
      };

      const debtRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'debts', debt.id);
      
      await updateDoc(debtRef, {
        amount: newAmount,
        type: newType,
        status: newStatus,
        lastUpdated: new Date().toISOString(),
        records: [...debt.records, newRecord]
      });

      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-4 flex justify-between items-center bg-[#107e7d] text-white">
          <h3 className="font-bold text-lg">Update Record</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><XCircle /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Action</label>
            <select 
              className="w-full mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#107e7d] font-semibold"
              value={formData.action}
              onChange={e => setFormData({...formData, action: e.target.value})}
            >
              <option value="repay">Repay Debt</option>
              <option value="increase">Increase Debt</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amount</label>
            <div className="flex items-center">
              <span className="text-2xl text-slate-400 mr-2">৳</span>
              <input 
                required
                type="number" 
                inputMode="numeric"
                placeholder="0"
                className="w-full text-3xl font-bold border-b-2 border-slate-200 py-2 focus:border-[#107e7d] outline-none bg-transparent"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Description {formData.description ? '' : '*'}</label>
            <input 
              type="text" 
              placeholder="Reason for update..."
              required={!formData.description}
              className="w-full border-b-2 border-slate-200 py-2 focus:border-[#107e7d] outline-none bg-transparent text-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Account</label>
               <select 
                 className="w-full mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#107e7d]"
                 value={formData.account}
                 onChange={e => setFormData({...formData, account: e.target.value})}
               >
                 {["Cash", "bKash", "Nagad", "Bank", "Others"].map(opt => (
                   <option key={opt} value={opt}>{opt}</option>
                 ))}
               </select>
             </div>
             <div>
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Date</label>
               <input 
                 type="date" 
                 className="w-full mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-[#107e7d]"
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
             </div>
          </div>

          <button 
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-[#107e7d] hover:opacity-90 text-white font-bold shadow-lg shadow-[#107e7d]/30 transition-all active:scale-[0.98]"
          >
            {loading ? 'Updating...' : 'Save Record'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Main App Component
const DebtTrackerApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#107e7d]"></div>
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <AuthScreen />;
};

export default DebtTrackerApp;
