import React, { useState, useEffect, useRef } from 'react'
import {
	Search,
	Plus,
	Eye,
	Edit,
	Trash2,
	MoreHorizontal,
	X,
	ChevronDown,
	BookOpen,
	Clock,
	DollarSign,
	Users as UsersIcon,
	Calendar,
	TrendingUp,
} from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { logout, setCredentials } from '../../redux/authSlice'

// ── Reusable Components ──────────────────────────────────────────────────────
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

const Badge = ({ children, color = 'gray' }) => {
	const colors = {
		blue: 'bg-blue-50 text-blue-700',
		green: 'bg-emerald-50 text-emerald-700',
		orange: 'bg-orange-50 text-orange-600',
		purple: 'bg-purple-50 text-purple-700',
	}
	return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${colors[color]}`}>{children}</span>
}

const AlertBanner = ({ text, type }) => (
	<div className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm border ${type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
		{text}
	</div>
)

// ── Action Menu ──────────────────────────────────────────────────────────────
const ActionMenu = ({ kurs, onView, onEdit, onDelete, isLastRows }) => {
	const [open, setOpen] = useState(false)
	const ref = useRef(null)

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
				<div className={`absolute right-0 ${isLastRows ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-40 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50`}>
					<button onClick={() => { onView(); setOpen(false) }} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'>
						<Eye className='w-3.5 h-3.5 text-emerald-500 flex-shrink-0' /> Ko'rish
					</button>
					<button onClick={() => { onEdit(); setOpen(false) }} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'>
						<Edit className='w-3.5 h-3.5 text-blue-500 flex-shrink-0' /> Tahrirlash
					</button>
					<div className='my-1 border-t border-gray-100' />
					<button onClick={() => { onDelete(); setOpen(false) }} className='flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors'>
						<Trash2 className='w-3.5 h-3.5 flex-shrink-0' /> O'chirish
					</button>
				</div>
			)}
		</div>
	)
}

// ── Main Component ───────────────────────────────────────────────────────────
const Kurslar = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [showAddForm, setShowAddForm] = useState(false)
	const [showEditForm, setShowEditForm] = useState(false)
	const [showDetails, setShowDetails] = useState(false)
	const [selectedKurs, setSelectedKurs] = useState(null)
	const [loading, setLoading] = useState(false)
	const [kurslarData, setKurslarData] = useState([])
	const [message, setMessage] = useState({ text: '', type: '' })

	const dispatch = useDispatch()
	const { accessToken, refreshToken } = useSelector(state => state.auth)

	const API_BASE_URL = 'https://zuhr-star-production.up.railway.app/api'

	const defaultForm = { name: '', duration: '', duration_type: 'month', groups_count: 1, price: '' }
	const [createForm, setCreateForm] = useState(defaultForm)
	const [editForm, setEditForm] = useState(defaultForm)

	const refreshAccessToken = async () => {
		try {
			const res = await fetch(`${API_BASE_URL}/users/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken }),
			})
			if (res.ok) {
				const data = await res.json()
				dispatch(setCredentials({
					user: JSON.parse(localStorage.getItem('user')),
					accessToken: data.accessToken,
					refreshToken: data.refreshToken || refreshToken,
				}))
				return data.accessToken
			} else {
				dispatch(logout())
				return null
			}
		} catch (error) {
			dispatch(logout())
			return null
		}
	}

	const authFetch = async (url, options = {}) => {
		const headers = {
			...options.headers,
			'Content-Type': 'application/json',
			...(accessToken && { Authorization: `Bearer ${accessToken}` }),
		}
		let res = await fetch(url, { ...options, headers })
		if (res.status === 401) {
			const newToken = await refreshAccessToken()
			if (newToken) {
				headers['Authorization'] = `Bearer ${newToken}`
				res = await fetch(url, { ...options, headers })
			} else {
				dispatch(logout())
				return res
			}
		}
		return res
	}

	const fetchKurslar = async () => {
		try {
			setLoading(true)
			const res = await authFetch(`${API_BASE_URL}/courses`, { method: 'GET' })
			if (res.ok) {
				const data = await res.json()
				setKurslarData(Array.isArray(data) ? data : [])
			}
		} catch (error) {
			console.error('Fetch error:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (accessToken) fetchKurslar()
	}, [accessToken]) // eslint-disable-line

	const handleCreate = async () => {
		if (!createForm.name.trim() || !createForm.duration || !createForm.price.trim()) {
			setMessage({ text: "Barcha majburiy maydonlarni to'ldiring", type: 'error' })
			return
		}
		try {
			const payload = {
				...createForm,
				duration: parseInt(createForm.duration),
				groups_count: parseInt(createForm.groups_count),
			}
			const res = await authFetch(`${API_BASE_URL}/courses`, {
				method: 'POST',
				body: JSON.stringify(payload),
			})
			if (res.ok) {
				setMessage({ text: "Kurs muvaffaqiyatli qo'shildi!", type: 'success' })
				setTimeout(() => { setShowAddForm(false); setMessage({ text: '', type: '' }) }, 800)
				fetchKurslar()
				setCreateForm(defaultForm)
			} else {
				const err = await res.text()
				setMessage({ text: err || "Qo'shishda xato", type: 'error' })
			}
		} catch (error) {
			setMessage({ text: "Qo'shishda xato", type: 'error' })
		}
	}

	const handleUpdate = async () => {
		if (!editForm.name?.trim()) {
			setMessage({ text: "Barcha majburiy maydonlarni to'ldiring", type: 'error' })
			return
		}
		try {
			const payload = {
				...editForm,
				duration: parseInt(editForm.duration),
				groups_count: parseInt(editForm.groups_count),
			}
			const res = await authFetch(`${API_BASE_URL}/courses/id/${editForm._id}`, {
				method: 'PUT',
				body: JSON.stringify(payload),
			})
			if (res.ok) {
				setMessage({ text: 'Kurs muvaffaqiyatli yangilandi!', type: 'success' })
				setTimeout(() => { setShowEditForm(false); setMessage({ text: '', type: '' }) }, 800)
				fetchKurslar()
			} else {
				const err = await res.text()
				setMessage({ text: err || 'Yangilashda xato', type: 'error' })
			}
		} catch (error) {
			setMessage({ text: 'Yangilashda xato', type: 'error' })
		}
	}

	const handleDelete = async id => {
		if (window.confirm('Bu kursni ochirmoqchimisiz?')) {
			try {
				const res = await authFetch(`${API_BASE_URL}/courses/id/${id}`, { method: 'DELETE' })
				if (res.ok || res.status === 204) {
					setKurslarData(prev => prev.filter(k => k._id !== id))
				}
			} catch (error) {
				console.error('Delete error:', error)
			}
		}
	}

	const filteredKurslar = kurslarData.filter(k =>
		k.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		k.price?.toLowerCase().includes(searchTerm.toLowerCase())
	)

	// ─────────────────────────────────────────────────────────────────────────
	return (
		<div className='min-h-screen bg-gray-50 flex flex-col'>

			{/* Header */}
			<header className='bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-base sm:text-lg font-bold text-gray-800 tracking-tight'>KURSLAR</h1>
						<p className='hidden sm:block text-xs text-gray-400 mt-0.5'>Barcha kurslar ro'yxati</p>
					</div>
					<nav className='hidden md:flex items-center gap-1.5 text-xs text-gray-400'>
						<span>Bosh sahifa</span><span>/</span>
						<span className='text-gray-600 font-medium'>Kurslar</span>
					</nav>
				</div>
			</header>

			<main className='flex-1 p-3 sm:p-4 lg:p-5 space-y-4'>

				{/* Stats */}
				<div className='grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-3'>
					{[
						{ count: kurslarData.length, label: 'Jami kurslar', Icon: BookOpen, border: 'border-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
						{ count: kurslarData.filter(k => k.groups_count > 0).length, label: 'Faol kurslar', Icon: TrendingUp, border: 'border-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
						{ count: kurslarData.reduce((acc, k) => acc + (k.groups_count || 0), 0), label: 'Jami guruhlar', Icon: UsersIcon, border: 'border-purple-500', iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
						{ count: kurslarData.length, label: 'Kurs turlari', Icon: Calendar, border: 'border-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
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
						<div className='relative flex-1 min-w-[200px] md:flex-none'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none' />
							<input
								type='text' placeholder='Qidirish...' value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className='w-full md:w-56 xl:w-64 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm placeholder-gray-400'
							/>
						</div>
					</div>

					<button
						onClick={() => setShowAddForm(true)}
						className='flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors whitespace-nowrap'
					>
						<Plus className='w-4 h-4' /> Kurs qo'shish
					</button>
				</div>

				{/* Table */}
				<div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>

					{/* Head */}
					<div className='hidden xl:grid bg-gray-50 border-b border-gray-100 px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest'
						style={{ gridTemplateColumns: 'minmax(220px, 2fr) minmax(160px, 1fr) minmax(140px, 1fr) minmax(160px, 1.2fr) 130px' }}>
						<div>Kurs nomi</div>
						<div>Davomiyligi</div>
						<div>Guruhlar</div>
						<div>Narxi</div>
						<div className='text-right pr-1'>Amallar</div>
					</div>

					{/* Body */}
					<div className='divide-y divide-gray-50'>
						{loading ? (
							<>
								{[...Array(5)].map((_, i) => (
									<div key={i} className='px-4 py-3'>
										<div className='hidden xl:grid items-center gap-3'
											style={{ gridTemplateColumns: 'minmax(220px, 2fr) minmax(160px, 1fr) minmax(140px, 1fr) minmax(160px, 1.2fr) 130px' }}>
											<div className='h-4 bg-gray-200 rounded animate-pulse w-3/4' />
											<div className='h-4 bg-gray-200 rounded animate-pulse w-24' />
											<div className='h-6 bg-gray-200 rounded-md animate-pulse w-12' />
											<div className='h-4 bg-gray-200 rounded animate-pulse w-32' />
											<div className='flex justify-end'><div className='h-8 bg-gray-200 rounded-lg animate-pulse w-24' /></div>
										</div>
										<div className='xl:hidden flex items-start gap-3'>
											<div className='flex-1 space-y-3'>
												<div className='h-4 bg-gray-200 rounded animate-pulse w-3/4' />
												<div className='flex items-center gap-2'>
													<div className='h-5 bg-gray-200 rounded-md animate-pulse w-20' />
													<div className='h-5 bg-gray-200 rounded-md animate-pulse w-16' />
												</div>
											</div>
										</div>
									</div>
								))}
							</>
						) : filteredKurslar.length === 0 ? (
							<div className='flex flex-col items-center justify-center gap-2 py-16'>
								<BookOpen className='w-9 h-9 text-gray-200' />
								<span className='text-sm text-gray-400'>Hech qanday kurs topilmadi</span>
							</div>
						) : filteredKurslar.map((kurs, idx) => {
							const isLastRows = idx >= filteredKurslar.length - 3
							return (
								<div key={kurs._id} className='px-4 py-3 hover:bg-gray-50/60 transition-colors'>

									{/* Desktop row */}
									<div className='hidden xl:grid items-center gap-3'
										style={{ gridTemplateColumns: 'minmax(220px, 2fr) minmax(160px, 1fr) minmax(140px, 1fr) minmax(160px, 1.2fr) 130px' }}>
										<div className='flex items-center gap-2.5'>
											<div className='w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0'>
												<BookOpen className='w-4 h-4 text-blue-700' />
											</div>
											<div className='min-w-0'>
												<p className='text-sm font-medium text-gray-800 truncate'>{kurs.name}</p>
												<p className='text-[11px] text-gray-400 mt-0.5'>ID: {kurs._id?.slice(-6)}</p>
											</div>
										</div>
										<div className='flex items-center gap-1.5 text-sm text-gray-600'>
											<Clock className='w-3.5 h-3.5 text-gray-400' />
											{kurs.duration} {kurs.duration_type || 'oy'}
										</div>
										<div>
											<Badge color='green'>{kurs.groups_count || 0} ta</Badge>
										</div>
										<div className='flex items-center gap-1.5 text-sm font-semibold text-emerald-600'>
											<DollarSign className='w-3.5 h-3.5' />
											{kurs.price}
										</div>
										<div className='flex justify-end'>
											<ActionMenu
												kurs={kurs}
												isLastRows={isLastRows}
												onView={() => { setSelectedKurs(kurs); setShowDetails(true) }}
												onEdit={() => { setEditForm({ ...kurs }); setShowEditForm(true) }}
												onDelete={() => handleDelete(kurs._id)}
											/>
										</div>
									</div>

									{/* Mobile card */}
									<div className='xl:hidden'>
										<div className='flex items-start justify-between gap-3'>
											<div className='flex items-start gap-2.5 flex-1 min-w-0'>
												<div className='w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0'>
													<BookOpen className='w-4 h-4 text-blue-700' />
												</div>
												<div className='min-w-0 flex-1'>
													<p className='text-sm font-semibold text-gray-800 truncate'>{kurs.name}</p>
													<p className='text-xs text-gray-500 mt-0.5'>{kurs.duration} {kurs.duration_type || 'oy'}</p>
												</div>
											</div>
											<ActionMenu
												kurs={kurs}
												isLastRows={isLastRows}
												onView={() => { setSelectedKurs(kurs); setShowDetails(true) }}
												onEdit={() => { setEditForm({ ...kurs }); setShowEditForm(true) }}
												onDelete={() => handleDelete(kurs._id)}
											/>
										</div>
										<div className='flex items-center flex-wrap gap-2 mt-2 ml-11'>
											<Badge color='green'>{kurs.groups_count || 0} ta guruh</Badge>
											<span className='text-xs font-semibold text-emerald-600'>{kurs.price}</span>
										</div>
									</div>

								</div>
							)
						})}
					</div>

					{/* Footer */}
					{!loading && filteredKurslar.length > 0 && (
						<div className='px-4 py-2.5 bg-gray-50 border-t border-gray-100'>
							<span className='text-xs text-gray-400'>Jami: <span className='font-semibold text-gray-600'>{filteredKurslar.length}</span> ta kurs</span>
						</div>
					)}
				</div>
			</main>

			{/* CREATE MODAL */}
			{showAddForm && (
				<Modal onClose={() => { setShowAddForm(false); setMessage({ text: '', type: '' }) }}>
					<ModalHeader title="Kurs Qo'shish" onClose={() => { setShowAddForm(false); setMessage({ text: '', type: '' }) }} />
					<div className='px-5 py-4 space-y-3'>
						{message.text && <AlertBanner {...message} />}
						<Field label='Kurs nomi' required>
							<input type='text' placeholder='Masalan: Frontend' className={inputCls} value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
						</Field>
						<div className='grid grid-cols-2 gap-3'>
							<Field label='Davomiyligi' required>
								<input type='number' placeholder='6' className={inputCls} value={createForm.duration} onChange={e => setCreateForm(f => ({ ...f, duration: e.target.value }))} min='1' />
							</Field>
							<Field label='Turi' required>
								<div className='relative'>
									<select className={selectCls} value={createForm.duration_type} onChange={e => setCreateForm(f => ({ ...f, duration_type: e.target.value }))}>
										<option value='month'>Oy</option>
										<option value='week'>Hafta</option>
										<option value='day'>Kun</option>
									</select>
									<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none' />
								</div>
							</Field>
						</div>
						<Field label='Narxi' required>
							<input type='text' placeholder='500000' className={inputCls} value={createForm.price} onChange={e => setCreateForm(f => ({ ...f, price: e.target.value }))} />
						</Field>
						<div className='flex gap-2.5 pt-1'>
							<button onClick={() => { setCreateForm(defaultForm); setShowAddForm(false); setMessage({ text: '', type: '' }) }} className='flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors'>
								Bekor qilish
							</button>
							<button onClick={handleCreate} className='flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm'>
								Saqlash
							</button>
						</div>
					</div>
				</Modal>
			)}

			{/* EDIT MODAL */}
			{showEditForm && (
				<Modal onClose={() => { setShowEditForm(false); setMessage({ text: '', type: '' }) }}>
					<ModalHeader title='Kursni Tahrirlash' onClose={() => { setShowEditForm(false); setMessage({ text: '', type: '' }) }} />
					<div className='px-5 py-4 space-y-3'>
						{message.text && <AlertBanner {...message} />}
						<Field label='Kurs nomi' required>
							<input type='text' className={inputCls} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
						</Field>
						<div className='grid grid-cols-2 gap-3'>
							<Field label='Davomiyligi' required>
								<input type='number' className={inputCls} value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))} min='1' />
							</Field>
							<Field label='Turi'>
								<div className='relative'>
									<select className={selectCls} value={editForm.duration_type} onChange={e => setEditForm(f => ({ ...f, duration_type: e.target.value }))}>
										<option value='month'>Oy</option>
										<option value='week'>Hafta</option>
										<option value='day'>Kun</option>
									</select>
									<ChevronDown className='absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none' />
								</div>
							</Field>
						</div>
						<Field label='Narxi' required>
							<input type='text' className={inputCls} value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} />
						</Field>
						<div className='flex gap-2.5 pt-1'>
							<button onClick={() => { setShowEditForm(false); setMessage({ text: '', type: '' }) }} className='flex-1 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors'>
								Bekor qilish
							</button>
							<button onClick={handleUpdate} className='flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm'>
								Saqlash
							</button>
						</div>
					</div>
				</Modal>
			)}

			{/* DETAILS MODAL */}
			{showDetails && selectedKurs && (
				<Modal onClose={() => setShowDetails(false)} size='sm'>
					<ModalHeader title="Kurs Ma'lumotlari" onClose={() => setShowDetails(false)} />
					<div className='px-5 py-4'>
						<div className='flex items-center gap-3 mb-4'>
							<div className='w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center'>
								<BookOpen className='w-6 h-6 text-blue-700' />
							</div>
							<div>
								<p className='font-semibold text-gray-800'>{selectedKurs.name}</p>
								<p className='text-xs text-gray-500 mt-0.5'>ID: {selectedKurs._id}</p>
							</div>
						</div>
						<div className='rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50'>
							{[
								{ label: 'Davomiyligi', value: `${selectedKurs.duration} ${selectedKurs.duration_type || 'oy'}` },
								{ label: 'Guruhlar soni', value: `${selectedKurs.groups_count || 0} ta`, color: 'text-emerald-600' },
								{ label: 'Narxi', value: selectedKurs.price, color: 'text-blue-600' },
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

export default Kurslar