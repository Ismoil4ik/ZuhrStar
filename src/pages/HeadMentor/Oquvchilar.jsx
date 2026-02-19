import React, { useState, useEffect, useRef } from 'react'
import {
	Search,
	Plus,
	Eye,
	Edit,
	Trash2,
	Users,
	UserCheck,
	AlertTriangle,
	CreditCard,
	Snowflake,
	Unlock,
	Download,
	MoreHorizontal,
	X,
	ChevronDown,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../redux/authSlice'
import * as XLSX from 'xlsx'

// ── Reusable modal ───────────────────────────────────────────────────────────
const Modal = ({ onClose, children, size = 'md' }) => {
	const sizeMap = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }
	return (
		<div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center'>
			<div className='absolute inset-0 bg-black/50 backdrop-blur-[2px]' onClick={onClose} />
			<div className={`relative bg-white w-full ${sizeMap[size]} rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto`}>
				{children}
			</div>
		</div>
	)
}

const ModalHeader = ({ title, onClose }) => (
	<div className='sticky top-0 z-10 flex items-center justify-between bg-white px-5 py-4 border-b border-gray-100 rounded-t-2xl'>
		<h2 className='text-[15px] font-semibold text-gray-800'>{title}</h2>
		<button onClick={onClose} className='w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'>
			<X className='w-4 h-4' />
		</button>
	</div>
)

// ── Form field wrapper ───────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
	<div>
		<label className='block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1'>
			{label}{required && <span className='text-red-400 ml-0.5'>*</span>}
		</label>
		{children}
	</div>
)

const inputCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition'
const selectCls = 'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition appearance-none cursor-pointer'

// ── Alert banner ─────────────────────────────────────────────────────────────
const AlertBanner = ({ text, type }) => (
	<div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border ${type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
		{text}
	</div>
)

// ── Avatar initials ──────────────────────────────────────────────────────────
const Avatar = ({ name, surname, size = 'sm' }) => {
	const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
	return (
		<div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center font-semibold text-white flex-shrink-0 select-none`}>
			{(name?.[0] || '').toUpperCase()}{(surname?.[0] || '').toUpperCase()}
		</div>
	)
}

// ── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ children, color = 'gray' }) => {
	const colors = {
		blue: 'bg-blue-50 text-blue-700', orange: 'bg-orange-50 text-orange-600',
		emerald: 'bg-emerald-50 text-emerald-700', slate: 'bg-slate-100 text-slate-500',
		red: 'bg-red-50 text-red-600', gray: 'bg-gray-100 text-gray-600',
	}
	return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${colors[color]}`}>{children}</span>
}

// ── Per-row action dropdown ──────────────────────────────────────────────────
const ActionMenu = ({ student, onView, onEdit, onFreeze, onUnfreeze, onDelete, isLastRows }) => {
	const [open, setOpen] = useState(false)
	const ref = useRef(null)
	const isFrozen = student.status === 'muzlagan'

	useEffect(() => {
		const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
		document.addEventListener('mousedown', h)
		return () => document.removeEventListener('mousedown', h)
	}, [])

	return (
		<div ref={ref} className='relative inline-block'>
			<button
				onClick={() => setOpen(v => !v)}
				className='flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 transition-all'
			>
				<MoreHorizontal className='w-3.5 h-3.5' />
				<span className='hidden sm:inline'>Amallar</span>
				<ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
			</button>

			{open && (
				<div className={`absolute right-0 ${isLastRows ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50`}>
					<button onClick={() => { onView(); setOpen(false) }} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'>
						<Eye className='w-3.5 h-3.5 text-emerald-500 flex-shrink-0' /> Ko'rish
					</button>
					{!isFrozen && (
						<button onClick={() => { onEdit(); setOpen(false) }} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'>
							<Edit className='w-3.5 h-3.5 text-blue-500 flex-shrink-0' /> Tahrirlash
						</button>
					)}
					{isFrozen ? (
						<button onClick={() => { onUnfreeze(); setOpen(false) }} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'>
							<Unlock className='w-3.5 h-3.5 text-indigo-500 flex-shrink-0' /> Aktivlashtirish
						</button>
					) : (
						<button onClick={() => { onFreeze(); setOpen(false) }} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'>
							<Snowflake className='w-3.5 h-3.5 text-sky-400 flex-shrink-0' /> Muzlatish
						</button>
					)}
					<div className='my-1 border-t border-gray-100' />
					<button onClick={() => { onDelete(); setOpen(false) }} disabled={isFrozen} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'>
						<Trash2 className='w-3.5 h-3.5 flex-shrink-0' /> O'chirish
					</button>
				</div>
			)}
		</div>
	)
}

// ── Main ─────────────────────────────────────────────────────────────────────
const Oquvchilar = () => {
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const token = useSelector(state => state.auth.accessToken)

	const [students, setStudents] = useState([])
	const [groups, setGroups] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [showImportExport, setShowImportExport] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedStudents, setSelectedStudents] = useState(new Set())
	const [showCreate, setShowCreate] = useState(false)
	const [showUpdate, setShowUpdate] = useState(false)
	const [showDetails, setShowDetails] = useState(false)
	const [selectedStudent, setSelectedStudent] = useState(null)
	const [updateMessage, setUpdateMessage] = useState({ text: '', type: '' })

	const importExportRef = useRef(null)

	const DEFAULT_IMG = 'https://tse3.mm.bing.net/th/id/OIP.5B1_LC815QuZADs1Xf8HdgHaHa?cb=thvnextc1&rs=1&pid=ImgDetMain&o=7&rm=3'

	const defaultCreate = {
		name: '', surname: '', student_phone: '', parents_phone: '',
		birth_date: '', gender: '', note: '', group_attached: true,
		password: '', group_id: '', imgURL: DEFAULT_IMG,
	}

	const [createForm, setCreateForm] = useState(defaultCreate)
	const [form, setForm] = useState({
		name: '', surname: '', student_phone: '', parents_phone: '',
		birth_date: '', gender: '', note: '', group_attached: true,
		password: '', id: '', group_id: '', student_id: '',
	})

	const API_BASE = 'https://zuhr-star-production.up.railway.app/api'

	useEffect(() => {
		const h = e => { if (importExportRef.current && !importExportRef.current.contains(e.target)) setShowImportExport(false) }
		document.addEventListener('mousedown', h)
		return () => document.removeEventListener('mousedown', h)
	}, [])

	const authGuard = res => { if (res.status === 401) { dispatch(logout()); navigate('/login') } }

	const readErrorMessage = async res => {
		try { const j = await res.clone().json(); if (j?.message || j?.error) return j.message || j.error } catch { /* noop */ }
		try { return await res.text() } catch { return '' }
	}

	const fetchStudents = async () => {
		if (!token) { dispatch(logout()); navigate('/login'); return }
		try {
			setLoading(true); setError('')
			const res = await fetch(`${API_BASE}/students`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
			if (!res.ok) { authGuard(res); throw new Error(`HTTP ${res.status}`) }
			const data = await res.json()
			setStudents(Array.isArray(data) ? data : [])
		} catch (err) { setError(err.message || "Yuklashda xato") }
		finally { setLoading(false) }
	}

	const fetchGroups = async () => {
		if (!token) return
		try {
			const res = await fetch(`${API_BASE}/groups`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
			if (!res.ok) { authGuard(res); return }
			const data = await res.json()
			setGroups(Array.isArray(data) ? data : [])
		} catch { /* noop */ }
	}

	useEffect(() => { fetchStudents(); fetchGroups() }, [token]) // eslint-disable-line

	const totalStudents = students.length
	const activeStudents = students.filter(s => s.active).length
	const noGroupStudents = students.filter(s => (s.groups?.length || 0) === 0).length
	const debtors = students.filter(s => s.paid === false).length

	const handleSelectAll = e => setSelectedStudents(e.target.checked ? new Set(students.map(s => s._id)) : new Set())
	const handleSelectStudent = id => {
		const next = new Set(selectedStudents)
		next.has(id) ? next.delete(id) : next.add(id)
		setSelectedStudents(next)
	}

	const filteredStudents = students.filter(s =>
		s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		s.surname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		s.student_phone?.includes(searchTerm)
	)

	const phoneRegex = /^\+998\d{9}$/

	const handleDelete = async id => {
		if (!token) { dispatch(logout()); navigate('/login'); return }
		try {
			const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
			if (!res.ok) { authGuard(res); throw new Error(`HTTP ${res.status}`) }
			setStudents(prev => prev.filter(s => s._id !== id && s.student_id !== id))
			setSelectedStudents(prev => { const ns = new Set(prev); ns.delete(id); return ns })
		} catch (err) { setError(err.message || "O'chirishda xato") }
	}

	const handleEdit = student => {
		if (!student._id) return
		setForm({
			name: student.name || '', surname: student.surname || '',
			student_phone: student.student_phone || '', parents_phone: student.parents_phone || '',
			birth_date: (student.birth_date || '').slice(0, 10), gender: student.gender || '',
			note: student.note || '', group_attached: student.group_attached ?? true,
			password: '', id: student._id, student_id: student.student_id || '',
			group_id: student.groups?.length ? String(student.groups[0]) : '',
		})
		setUpdateMessage({ text: '', type: '' })
		setShowUpdate(true)
	}

	const handleMuzlatish = async id => {
		try {
			const res = await fetch(`${API_BASE}/students/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'muzlagan' }) })
			if (!res.ok) { authGuard(res); throw new Error(await readErrorMessage(res)) }
			setStudents(prev => prev.map(s => (s.student_id === id || s._id === id) ? { ...s, status: 'muzlagan' } : s))
		} catch (e) { setError(e.message) }
	}

	const deleteMuzlatish = async id => {
		try {
			const res = await fetch(`${API_BASE}/students/${id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) })
			if (!res.ok) { authGuard(res); throw new Error(await readErrorMessage(res)) }
			setStudents(prev => prev.map(s => (s.student_id === id || s._id === id) ? { ...s, status: 'active' } : s))
		} catch (e) { setError(e.message) }
	}

	const handleCreate = async () => {
		const { name, surname, student_phone, birth_date, gender, password, parents_phone, note, group_attached, group_id, imgURL } = createForm
		if (!name?.trim() || !surname?.trim() || !student_phone?.trim() || !birth_date?.trim() || !gender?.trim() || !password?.trim()) {
			setUpdateMessage({ text: "Barcha majburiy maydonlarni to'ldiring", type: 'error' }); return
		}
		if (!phoneRegex.test(student_phone)) { setUpdateMessage({ text: "+998 bilan boshlanib, 9 raqam bo'lishi kerak", type: 'error' }); return }
		try {
			const payload = {
				name: name.trim(), surname: surname.trim(), student_phone: student_phone.trim(),
				parents_phone: parents_phone?.trim() || undefined, birth_date: birth_date.trim(),
				gender: gender.trim(), note: note?.trim() || undefined, group_attached: !!group_attached,
				groups: group_id ? [String(group_id)] : [], password: password.trim(),
				paid: false, status: 'active', imgURL: imgURL?.trim() || DEFAULT_IMG,
				balance: '0', coinbalance: '0', teachers: [],
			}
			const res = await fetch(`${API_BASE}/students`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			if (!res.ok) { authGuard(res); throw new Error(await readErrorMessage(res)) }
			setUpdateMessage({ text: "Muvaffaqiyatli qo'shildi!", type: 'success' })
			setTimeout(() => { setShowCreate(false); setUpdateMessage({ text: '', type: '' }) }, 800)
			fetchStudents(); setCreateForm(defaultCreate)
		} catch (err) { setUpdateMessage({ text: err.message || "Qo'shishda xato", type: 'error' }) }
	}

	const handleUpdate = async () => {
		const { student_id, name, surname, student_phone, birth_date, gender, parents_phone, note, password, group_attached, group_id } = form
		if (!student_id?.trim() || !name?.trim() || !surname?.trim() || !student_phone?.trim() || !birth_date?.trim() || !gender?.trim()) {
			setUpdateMessage({ text: "Barcha majburiy maydonlarni to'ldiring", type: 'error' }); return
		}
		if (!phoneRegex.test(student_phone)) { setUpdateMessage({ text: "+998 bilan boshlanib, 9 raqam bo'lishi kerak", type: 'error' }); return }
		try {
			const payload = {
				name: name.trim(), surname: surname.trim(), student_phone: student_phone.trim(),
				parents_phone: parents_phone?.trim() || undefined, birth_date: birth_date.trim(),
				gender: gender.trim(), note: note?.trim() || undefined, group_attached: !!group_attached,
			}
			if (password?.trim()) payload.password = password.trim()
			if (group_id) payload.groups = [String(group_id)]
			const res = await fetch(`${API_BASE}/students/${student_id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			if (!res.ok) { authGuard(res); throw new Error(await readErrorMessage(res)) }
			setUpdateMessage({ text: "Muvaffaqiyatli yangilandi!", type: 'success' })
			setTimeout(() => { setShowUpdate(false); setUpdateMessage({ text: '', type: '' }) }, 800)
			fetchStudents()
		} catch (err) { setUpdateMessage({ text: err.message || 'Yangilashda xato', type: 'error' }) }
	}

	const handleExportExcel = () => {
		try {
			const ws = XLSX.utils.json_to_sheet(filteredStudents.map((s, i) => ({
				'№': i + 1, Ism: s.name || '', Familiya: s.surname || '', Telefon: s.student_phone || '',
				'Ota-ona': s.parents_phone || '', "Tug'ilgan": s.birth_date || '', Jins: s.gender || '',
				Guruh: (s.groups?.length || 0) > 0 ? 'Guruhda' : 'Guruhsiz', Balans: s.balance || '0',
				Holat: s.active ? 'Faol' : 'Nofaol', Eslatma: s.note || '',
			})))
			const wb = XLSX.utils.book_new()
			XLSX.utils.book_append_sheet(wb, ws, "O'quvchilar")
			XLSX.writeFile(wb, `oquvchilar_${new Date().toISOString().slice(0, 10)}.xlsx`)
			setUpdateMessage({ text: 'Excel yuklab olindi!', type: 'success' })
		} catch { setUpdateMessage({ text: 'Export xatosi', type: 'error' }) }
		setTimeout(() => setUpdateMessage({ text: '', type: '' }), 3000)
		setShowImportExport(false)
	}

	// ─────────────────────────────────────────────────────────────────────
	return (
		<div className='min-h-screen bg-gray-50 flex flex-col'>

			{/* Page header */}
			<header className='bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-base sm:text-lg font-bold text-gray-800 tracking-tight'>O'QUVCHILAR</h1>
						<p className='hidden sm:block text-xs text-gray-400 mt-0.5'>Barcha talabalar ro'yxati</p>
					</div>
					<nav className='hidden md:flex items-center gap-1.5 text-xs text-gray-400'>
						<span>Bosh sahifa</span><span>/</span>
						<span className='text-gray-600 font-medium'>O'quvchilar</span>
					</nav>
				</div>
			</header>

			<main className='flex-1 p-3 sm:p-4 lg:p-5 space-y-4'>

				{/* Stats */}
				<div className='grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3'>
					{[
						{ count: totalStudents, label: "O'quvchilar", Icon: Users, border: 'border-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
						{ count: activeStudents, label: 'Faol', Icon: UserCheck, border: 'border-cyan-500', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-500' },
						{ count: noGroupStudents, label: 'Guruhsiz', Icon: AlertTriangle, border: 'border-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
						{ count: debtors, label: 'Qarzdor', Icon: CreditCard, border: 'border-red-500', iconBg: 'bg-red-50', iconColor: 'text-red-500' },
					].map(({ count, label, Icon, border, iconBg, iconColor }) => (
						<div key={label} className={`bg-white rounded-xl border-l-4 ${border} shadow-sm p-4 sm:p-5`}>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-2xl sm:text-3xl font-bold text-gray-800'>{count}</p>
									<p className='text-[11px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mt-0.5 leading-tight'>{label}</p>
								</div>
								<div className={`${iconBg} rounded-xl w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center flex-shrink-0`}>
									<Icon className={`w-5 h-5 ${iconColor}`} />
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Toolbar */}
				<div className='flex flex-col md:flex-row gap-2 md:items-center md:justify-between'>
					<div className='flex items-center gap-2 flex-wrap'>
						{/* Search */}
						<div className='relative flex-1 min-w-[200px] md:flex-none'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none' />
							<input
								type='text' placeholder='Qidirish...' value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className='w-full md:w-56 xl:w-64 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm placeholder-gray-400'
							/>
						</div>

						{/* Import/Export */}
						<div ref={importExportRef} className='relative'>
							<button
								onClick={() => setShowImportExport(v => !v)}
								className='flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all'
							>
								<Download className='w-3.5 h-3.5' />
								<span className='hidden sm:inline text-xs font-medium'>Import/Export</span>
								<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showImportExport ? 'rotate-180' : ''}`} />
							</button>
							{showImportExport && (
								<div className='absolute top-full left-0 mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-20'>
									<button onClick={handleExportExcel} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'>
										<Download className='w-3.5 h-3.5 text-emerald-500' /> Export Excel
									</button>
								</div>
							)}
						</div>
					</div>

					<button
						onClick={() => setShowCreate(true)}
						className='flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors whitespace-nowrap'
					>
						<Plus className='w-4 h-4' /> O'quvchi qo'shish
					</button>
				</div>

				{/* Error banner */}
				{error && (
					<div className='flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm'>
						<span>{error}</span>
						<button onClick={fetchStudents} className='flex-shrink-0 px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors'>
							Qayta urinish
						</button>
					</div>
				)}

				{/* Table */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>

					{/* Head — desktop */}
					<div className='hidden xl:grid bg-gray-50 border-b border-gray-100 px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest'
						style={{ gridTemplateColumns: '50px minmax(240px, 2.5fr) minmax(170px, 1.3fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(120px, 0.9fr) 130px' }}>
						<div className='flex items-center'>
							<input type='checkbox' className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
								checked={selectedStudents.size === students.length && students.length > 0} onChange={handleSelectAll} />
						</div>
						<div>To'liq ismi</div>
						<div>Telefon raqami</div>
						<div>Guruh</div>
						<div>Balans</div>
						<div>Holat</div>
						<div className='text-right pr-1'>Amallar</div>
					</div>

					{/* Body */}
					<div className='divide-y divide-gray-50'>
						{loading ? (
							<>
								{/* Skeleton loader */}
								{[...Array(5)].map((_, i) => (
									<div key={i} className='px-4 py-3'>
										{/* Desktop skeleton */}
										<div className='hidden xl:grid items-center gap-3'
											style={{ gridTemplateColumns: '50px minmax(240px, 2.5fr) minmax(170px, 1.3fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(120px, 0.9fr) 130px' }}>
											{/* Checkbox */}
											<div className='flex items-center'>
												<div className='w-4 h-4 bg-gray-200 rounded animate-pulse' />
											</div>
											{/* Name */}
											<div className='flex items-center gap-2.5'>
												<div className='w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0' />
												<div className='flex-1 space-y-2'>
													<div className='h-4 bg-gray-200 rounded animate-pulse w-3/4' />
													<div className='h-3 bg-gray-200 rounded animate-pulse w-1/4' />
												</div>
											</div>
											{/* Phone */}
											<div className='h-4 bg-gray-200 rounded animate-pulse w-32' />
											{/* Group */}
											<div className='h-6 bg-gray-200 rounded-md animate-pulse w-20' />
											{/* Balance */}
											<div className='h-4 bg-gray-200 rounded animate-pulse w-24' />
											{/* Status */}
											<div className='h-6 bg-gray-200 rounded-md animate-pulse w-16' />
											{/* Actions */}
											<div className='flex justify-end'>
												<div className='h-8 bg-gray-200 rounded-lg animate-pulse w-24' />
											</div>
										</div>

										{/* Mobile skeleton */}
										<div className='xl:hidden flex items-start gap-3'>
											<div className='w-4 h-4 bg-gray-200 rounded animate-pulse mt-1 flex-shrink-0' />
											<div className='w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0' />
											<div className='flex-1 space-y-3'>
												<div className='flex items-start justify-between gap-2'>
													<div className='flex-1 space-y-2'>
														<div className='h-4 bg-gray-200 rounded animate-pulse w-3/4' />
														<div className='h-3 bg-gray-200 rounded animate-pulse w-1/2' />
													</div>
													<div className='h-8 bg-gray-200 rounded-lg animate-pulse w-20 flex-shrink-0' />
												</div>
												<div className='flex items-center gap-2'>
													<div className='h-5 bg-gray-200 rounded-md animate-pulse w-16' />
													<div className='h-5 bg-gray-200 rounded-md animate-pulse w-12' />
													<div className='h-4 bg-gray-200 rounded animate-pulse w-16' />
												</div>
											</div>
										</div>
									</div>
								))}
							</>
						) : filteredStudents.length === 0 ? (
							<div className='flex flex-col items-center justify-center gap-2 py-16'>
								<Users className='w-9 h-9 text-gray-200' />
								<span className='text-sm text-gray-400'>Hech qanday o'quvchi topilmadi</span>
							</div>
						) : filteredStudents.map((student, idx) => {
							const isFrozen = student.status === 'muzlagan'
							const balNeg = student.balance?.includes('-')
							const isLastRows = idx >= filteredStudents.length - 3 // Last 3 rows open upward

							return (
								<div key={student._id || idx} className={`px-4 py-3 transition-colors ${isFrozen ? 'bg-slate-50/80' : 'hover:bg-gray-50/60'}`}>

									{/* Desktop row */}
									<div className='hidden xl:grid items-center gap-3'
										style={{ gridTemplateColumns: '50px minmax(240px, 2.5fr) minmax(170px, 1.3fr) minmax(140px, 1fr) minmax(140px, 1fr) minmax(120px, 0.9fr) 130px' }}>
										<div className='flex items-center'>
											<input type='checkbox' className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer'
												checked={selectedStudents.has(student._id)} onChange={() => handleSelectStudent(student._id)} />
										</div>
										<div className='flex items-center gap-2.5 min-w-0'>
											<Avatar name={student.name} surname={student.surname} />
											<div className='min-w-0 flex-1'>
												<p className={`text-sm font-medium truncate ${isFrozen ? 'text-gray-400' : 'text-gray-800'}`}>
													{student.name} {student.surname}
												</p>
												<p className='text-[11px] text-gray-400 mt-0.5'>#{idx + 1}</p>
											</div>
										</div>
										<div className='text-sm text-gray-600 truncate'>{student.student_phone || '—'}</div>
										<div className='flex items-center'>
											{(student.groups?.length || 0) > 0
												? <Badge color='blue'>Guruhda</Badge>
												: <Badge color='orange'>Guruhsiz</Badge>}
										</div>
										<div className={`text-sm font-semibold truncate ${balNeg ? 'text-red-500' : 'text-emerald-600'}`}>
											{student.balance || '0 UZS'}
										</div>
										<div className='flex items-center'>
											{isFrozen
												? <Badge color='slate'><Snowflake className='w-2.5 h-2.5' />Muzlagan</Badge>
												: <Badge color='emerald'>Faol</Badge>}
										</div>
										<div className='flex justify-end'>
											<ActionMenu
												student={student}
												isLastRows={isLastRows}
												onView={() => { setSelectedStudent(student); setShowDetails(true) }}
												onEdit={() => handleEdit(student)}
												onFreeze={() => handleMuzlatish(student.student_id)}
												onUnfreeze={() => deleteMuzlatish(student.student_id)}
												onDelete={() => handleDelete(student.student_id)}
											/>
										</div>
									</div>

									{/* Mobile card */}
									<div className='xl:hidden flex items-start gap-3'>
										<input type='checkbox' className='mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0'
											checked={selectedStudents.has(student._id)} onChange={() => handleSelectStudent(student._id)} />
										<Avatar name={student.name} surname={student.surname} size='md' />
										<div className='flex-1 min-w-0'>
											<div className='flex items-start justify-between gap-2'>
												<div className='min-w-0'>
													<p className={`text-sm font-semibold truncate ${isFrozen ? 'text-gray-400' : 'text-gray-800'}`}>
														{student.name} {student.surname}
													</p>
													<p className='text-xs text-gray-500 mt-0.5'>{student.student_phone || '—'}</p>
												</div>
												<ActionMenu
													student={student}
													isLastRows={isLastRows}
													onView={() => { setSelectedStudent(student); setShowDetails(true) }}
													onEdit={() => handleEdit(student)}
													onFreeze={() => handleMuzlatish(student.student_id)}
													onUnfreeze={() => deleteMuzlatish(student.student_id)}
													onDelete={() => handleDelete(student.student_id)}
												/>
											</div>
											<div className='flex items-center flex-wrap gap-1.5 mt-2'>
												{(student.groups?.length || 0) > 0 ? <Badge color='blue'>Guruhda</Badge> : <Badge color='orange'>Guruhsiz</Badge>}
												{isFrozen ? <Badge color='slate'><Snowflake className='w-2.5 h-2.5' />Muzlagan</Badge> : <Badge color='emerald'>Faol</Badge>}
												<span className={`text-xs font-semibold ${balNeg ? 'text-red-500' : 'text-emerald-600'}`}>{student.balance || '0 UZS'}</span>
											</div>
										</div>
									</div>

								</div>
							)
						})}
					</div>

					{/* Footer */}
					{!loading && filteredStudents.length > 0 && (
						<div className='flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100'>
							<span className='text-xs text-gray-400'>Jami: <span className='font-semibold text-gray-600'>{filteredStudents.length}</span> ta</span>
							{selectedStudents.size > 0 && <span className='text-xs text-blue-600 font-medium'>{selectedStudents.size} ta tanlandi</span>}
						</div>
					)}
				</div>
			</main>

			{/* ── CREATE MODAL ─────────────────────────────────────────────────── */}
			{showCreate && (
				<Modal onClose={() => { setShowCreate(false); setUpdateMessage({ text: '', type: '' }) }}>
					<ModalHeader title="O'quvchi Qo'shish" onClose={() => { setShowCreate(false); setUpdateMessage({ text: '', type: '' }) }} />
					<div className='px-5 py-4 space-y-3'>
						{updateMessage.text && <AlertBanner {...updateMessage} />}
						<div className='grid grid-cols-2 gap-3'>
							<Field label='Ism' required>
								<input type='text' placeholder='Ism' className={inputCls} value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
							</Field>
							<Field label='Familiya' required>
								<input type='text' placeholder='Familiya' className={inputCls} value={createForm.surname} onChange={e => setCreateForm(f => ({ ...f, surname: e.target.value }))} />
							</Field>
						</div>
						<Field label='Telefon' required>
							<input type='text' placeholder='+998901234567' className={inputCls} value={createForm.student_phone} onChange={e => setCreateForm(f => ({ ...f, student_phone: e.target.value }))} />
						</Field>
						<Field label='Ota-ona telefoni'>
							<input type='text' placeholder='+998901234567' className={inputCls} value={createForm.parents_phone} onChange={e => setCreateForm(f => ({ ...f, parents_phone: e.target.value }))} />
						</Field>
						<div className='grid grid-cols-2 gap-3'>
							<Field label="Tug'ilgan sana" required>
								<input type='date' className={inputCls} value={createForm.birth_date} onChange={e => setCreateForm(f => ({ ...f, birth_date: e.target.value }))} />
							</Field>
							<Field label='Jins' required>
								<div className='relative'>
									<select className={selectCls} value={createForm.gender} onChange={e => setCreateForm(f => ({ ...f, gender: e.target.value }))}>
										<option value=''>Tanlang</option>
										<option value='Erkak'>Erkak</option>
										<option value='Ayol'>Ayol</option>
									</select>
									<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none' />
								</div>
							</Field>
						</div>
						<Field label='Guruh'>
							<div className='relative'>
								<select className={selectCls} value={createForm.group_id} onChange={e => setCreateForm(f => ({ ...f, group_id: e.target.value }))}>
									<option value=''>Guruh tanlang</option>
									{groups.map(g => <option key={g._id} value={g.group_id}>{g.name}</option>)}
								</select>
								<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none' />
							</div>
						</Field>
						<Field label='Eslatma'>
							<input type='text' placeholder='Ixtiyoriy...' className={inputCls} value={createForm.note} onChange={e => setCreateForm(f => ({ ...f, note: e.target.value }))} />
						</Field>
						<Field label='Rasm URL'>
							<input type='text' placeholder='https://...' className={inputCls} value={createForm.imgURL} onChange={e => setCreateForm(f => ({ ...f, imgURL: e.target.value }))} />
						</Field>
						<Field label='Parol' required>
							<input type='password' placeholder='Kamida 6 belgi' className={inputCls} value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
						</Field>
						<div className='flex gap-2.5 pt-1'>
							<button onClick={() => { setCreateForm(defaultCreate); setShowCreate(false); setUpdateMessage({ text: '', type: '' }) }} className='flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors'>
								Bekor qilish
							</button>
							<button onClick={handleCreate} className='flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm'>
								Saqlash
							</button>
						</div>
					</div>
				</Modal>
			)}

			{/* ── UPDATE MODAL ─────────────────────────────────────────────────── */}
			{showUpdate && (
				<Modal onClose={() => { setShowUpdate(false); setUpdateMessage({ text: '', type: '' }) }}>
					<ModalHeader title='Tahrirlash' onClose={() => { setShowUpdate(false); setUpdateMessage({ text: '', type: '' }) }} />
					<div className='px-5 py-4 space-y-3'>
						{updateMessage.text && <AlertBanner {...updateMessage} />}
						<div className='grid grid-cols-2 gap-3'>
							<Field label='Ism' required>
								<input type='text' placeholder='Ism' className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
							</Field>
							<Field label='Familiya' required>
								<input type='text' placeholder='Familiya' className={inputCls} value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} />
							</Field>
						</div>
						<Field label='Telefon' required>
							<input type='text' placeholder='+998901234567' className={inputCls} value={form.student_phone} onChange={e => setForm(f => ({ ...f, student_phone: e.target.value }))} />
						</Field>
						<Field label='Ota-ona telefoni'>
							<input type='text' placeholder='+998901234567' className={inputCls} value={form.parents_phone} onChange={e => setForm(f => ({ ...f, parents_phone: e.target.value }))} />
						</Field>
						<div className='grid grid-cols-2 gap-3'>
							<Field label="Tug'ilgan sana" required>
								<input type='date' className={inputCls} value={form.birth_date} onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
							</Field>
							<Field label='Guruh'>
								<div className='relative'>
									<select className={selectCls} value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}>
										<option value=''>Guruh tanlang</option>
										{groups.map(g => <option key={g._id} value={g.group_id}>{g.name}</option>)}
									</select>
									<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none' />
								</div>
							</Field>
						</div>
						<Field label='Eslatma'>
							<input type='text' placeholder='Ixtiyoriy...' className={inputCls} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
						</Field>
						<Field label='Yangi parol'>
							<input type='password' placeholder="O'zgartirmasangiz bo'sh qoldiring" className={inputCls} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
						</Field>
						<div className='flex gap-2.5 pt-1'>
							<button onClick={() => { setShowUpdate(false); setUpdateMessage({ text: '', type: '' }) }} className='flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors'>
								Bekor qilish
							</button>
							<button onClick={handleUpdate} className='flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm'>
								Saqlash
							</button>
						</div>
					</div>
				</Modal>
			)}

			{/* ── DETAILS MODAL ────────────────────────────────────────────────── */}
			{showDetails && selectedStudent && (
				<Modal onClose={() => setShowDetails(false)} size='sm'>
					<ModalHeader title="Ma'lumotlar" onClose={() => setShowDetails(false)} />
					<div className='px-5 py-4'>
						<div className='flex items-center gap-3 mb-4'>
							<Avatar name={selectedStudent.name} surname={selectedStudent.surname} size='lg' />
							<div>
								<p className='font-semibold text-gray-800'>{selectedStudent.name} {selectedStudent.surname}</p>
								<p className='text-xs text-gray-500 mt-0.5'>{selectedStudent.student_phone || '—'}</p>
							</div>
						</div>
						<div className='rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50'>
							{[
								{ label: 'Ota-ona', value: selectedStudent.parents_phone || '—' },
								{ label: "Tug'ilgan", value: (selectedStudent.birth_date || '').slice(0, 10) || '—' },
								{ label: 'Jins', value: selectedStudent.gender || '—' },
								{ label: 'Guruh', value: (selectedStudent.groups?.length || 0) > 0 ? 'Guruhda' : 'Guruhsiz', color: (selectedStudent.groups?.length || 0) > 0 ? 'text-blue-600' : 'text-orange-500' },
								{ label: 'Balans', value: selectedStudent.balance || '0 UZS', color: selectedStudent.balance?.includes('-') ? 'text-red-500' : 'text-emerald-600' },
								{ label: 'Holat', value: selectedStudent.status, color: selectedStudent.status === 'active' ? 'text-emerald-600' : 'text-slate-500' },
								...(selectedStudent.note ? [{ label: 'Eslatma', value: selectedStudent.note }] : []),
							].map(({ label, value, color }, i) => (
								<div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
									<span className='text-xs text-gray-500 font-medium'>{label}</span>
									<span className={`text-xs font-semibold ${color || 'text-gray-700'}`}>{value}</span>
								</div>
							))}
						</div>
						<button onClick={() => setShowDetails(false)} className='w-full mt-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors'>
							Yopish
						</button>
					</div>
				</Modal>
			)}

		</div>
	)
}

export default Oquvchilar