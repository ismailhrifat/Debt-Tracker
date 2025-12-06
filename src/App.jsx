import React, { useState, useEffect, useMemo } from 'react';
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
  Archive
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "DEL"
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
// Use a fixed app ID for the artifact path as per instructions
const APP_ID = "debt-tracker-v1";

// --- Components ---

// 1. Authentication Screen
const AuthScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        case 'auth/email-already-in-use':
          msg = "This email is already registered. Please sign in.";
          break;
        case 'auth/weak-password':
          msg = "Password should be at least 6 characters.";
          break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          msg = "Invalid email or password. Please try again.";
          break;
        case 'auth/invalid-email':
          msg = "Please enter a valid email address.";
          break;
        default:
          msg = err.message.replace('Firebase: ', '');
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
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#107e7d] focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-3 w-5 h-5 text-slate-400">@</div>
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#107e7d] focus:border-transparent outline-none transition-all"
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
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#107e7d] focus:border-transparent outline-none transition-all"
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
              className="w-full bg-[#107e7d] hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-[#107e7d]/30 active:scale-95 disabled:opacity-70"
            >
              {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-[#107e7d] font-medium text-sm hover:underline"
            >
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
  // Navigation State
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'closed'
  const [subTab, setSubTab] = useState('lent'); // 'lent' or 'borrowed'
  const [showAddModal, setShowAddModal] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState(null); // Changed: Store ID instead of object
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data Fetching
  useEffect(() => {
    if (!user) return;
    
    // Correct path using artifacts/appId/users/userId/debts
    const q = query(
      collection(db, 'artifacts', APP_ID, 'users', user.uid, 'debts')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDebts(debtList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching debts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Derived Data
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
    if (confirm("Are you sure you want to logout?")) {
      signOut(auth);
    }
  };

  // Derive the selected debt object from the live debts array
  const selectedDebt = useMemo(() => {
    return debts.find(d => d.id === selectedDebtId);
  }, [debts, selectedDebtId]);

  if (selectedDebtId && selectedDebt) {
    return <DebtDetailView 
      debt={selectedDebt} 
      user={user} 
      onBack={() => setSelectedDebtId(null)} 
    />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Header with Safe Area Padding */}
      <div 
        className="bg-[#107e7d] pb-12 px-6 rounded-b-[2.5rem] shadow-xl relative z-10"
        style={{ paddingTop: 'max(3rem, env(safe-area-inset-top))' }} 
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div>
              {/* Removed Welcome Back text */}
              <p className="text-white font-semibold text-lg">{user.displayName || 'User'}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="text-teal-100 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>

        {/* Main Tabs (Active / Closed) */}
        <div className="flex p-1 bg-black/20 rounded-xl mb-6 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'active' 
                ? 'bg-white text-[#107e7d] shadow-md' 
                : 'text-teal-100 hover:text-white'
            }`}
          >
            <LayoutDashboard size={16} /> Active Debts
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'closed' 
                ? 'bg-white text-[#107e7d] shadow-md' 
                : 'text-teal-100 hover:text-white'
            }`}
          >
            <Archive size={16} /> Closed History
          </button>
        </div>

        {/* Total Balance Display */}
        <div className="text-center">
          <p className="text-teal-100 text-sm mb-1">Total {activeTab === 'active' ? 'Outstanding' : 'Settled'} ({subTab === 'lent' ? 'Receivable' : 'Payable'})</p>
          <h2 className="text-4xl font-bold text-white tracking-tight">
            ৳ {totalAmount.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Sub Tabs (Lent / Borrowed) */}
      <div className="px-6 -mt-6 relative z-20">
        <div className="bg-white rounded-xl shadow-lg p-2 flex justify-between items-center">
          <button 
            onClick={() => setSubTab('lent')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              subTab === 'lent' ? 'bg-[#058c42]/10 text-[#058c42]' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1"><ArrowUpRight size={16} /> I Lent</span>
          </button>
          <div className="w-px h-8 bg-slate-100 mx-2"></div>
          <button 
            onClick={() => setSubTab('borrowed')}
            className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors flex flex-col items-center gap-1 ${
              subTab === 'borrowed' ? 'bg-[#C83E4D]/10 text-[#C83E4D]' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center gap-1"><ArrowDownLeft size={16} /> I Borrowed</span>
          </button>
        </div>
      </div>

      {/* Debt List */}
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
              onClick={() => setSelectedDebtId(debt.id)} // Select ID instead of object
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center group"
            >
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">{debt.name}</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[150px]">{debt.description || 'No description'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg ${
                  debt.type === 'lent' ? 'text-[#058c42]' : 'text-[#C83E4D]'
                }`}>
                  ৳{debt.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400">
                  {new Date(debt.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button (Visible in both Active and Closed tabs) */}
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

      {showAddModal && (
        <AddDebtModal 
          type={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          user={user}
        />
      )}
    </div>
  );
};

// 3. Detail View
const DebtDetailView = ({ debt, user, onBack }) => {
  const [showRecordModal, setShowRecordModal] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this debt record completely?")) {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'debts', debt.id));
      onBack();
    }
  };

  const isLent = debt.type === 'lent';
  // Colors
  const mainColor = isLent ? 'text-[#058c42]' : 'text-[#C83E4D]';
  const mainBg = isLent ? 'bg-[#058c42]' : 'bg-[#C83E4D]';

  return (
    <div className="h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Detail Header with Safe Area Padding */}
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

      {/* Content */}
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
                <p className="font-bold text-slate-700 text-sm">{new Date(debt.lastUpdated).toLocaleDateString()}</p>
             </div>
           </div>

           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             <History size={18} className="text-[#107e7d]" /> Transaction History
           </h3>
           
           <div className="space-y-6 relative border-l-2 border-slate-100 ml-3 pl-6">
             {debt.records && debt.records.slice().reverse().map((record, idx) => (
               <div key={idx} className="relative">
                 <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                   record.action === 'initial' ? 'bg-[#107e7d]' :
                   record.action === 'increase' ? (isLent ? 'bg-[#058c42]' : 'bg-[#C83E4D]') :
                   'bg-slate-400' // repay
                 }`}></div>
                 
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="font-bold text-slate-800 text-sm">{record.description}</p>
                     <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                       <Calendar size={10} /> {record.date} • <CreditCard size={10} /> {record.account}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className={`font-bold text-sm ${
                        record.action === 'repay' ? 'text-[#058c42]' : 
                        record.action === 'increase' ? 'text-[#C83E4D]' : 'text-slate-600'
                     }`}>
                       {record.action === 'repay' ? '-' : '+'} ৳{parseInt(record.amount).toLocaleString()}
                     </p>
                     <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{record.action}</p>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Footer Action */}
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
    if (!formData.name || !formData.amount || (!formData.description && formData.description !== '')) return; // Basic validation
    
    setLoading(true);
    try {
      const numAmount = parseFloat(formData.amount);
      const newDebt = {
        name: formData.name,
        description: formData.description,
        type: type, // 'lent' or 'borrowed'
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

const AddRecordModal = ({ debt, onClose, user }) => {
  const [formData, setFormData] = useState({
    action: 'repay', // 'repay' or 'increase'
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
      
      // Calculate new amount considering positive/negative flow
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
        // Amount went negative, flip the debt type (Lent <-> Borrowed)
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
        type: newType, // Update type if flipped
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
              <option value="repay">Repay Debt (Decrease Amount)</option>
              <option value="increase">Increase Debt (Add Amount)</option>
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
