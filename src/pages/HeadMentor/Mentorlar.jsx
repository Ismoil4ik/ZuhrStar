import React, { useState, useEffect, useMemo } from 'react'
import {
	Search,
	Filter,
	Plus,
	Edit,
	Eye,
	Users,
	Trash2,
	ChevronRight,
	Mail,
	Phone,
	Briefcase,
	MapPin,
	Loader2,
	X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../redux/authSlice'

const API_BASE = 'https://zuhr-star-production.up.railway.app/api'

const cx = (...a) => a.filter(Boolean).join(' ')
const Btn = ({ as: Tag = 'button', className = '', ...p }) => (
	<Tag
		{...p}
		className={cx(
			'inline-flex items-center justify-center rounded-xl transition',
			className
		)}
	/>
)

export default function Mentorlar() {
	const [mentors, setMentors] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [searchQuery, setSearchQuery] = useState('')

	const [selectedMentor, setSelectedMentor] = useState(null)
	const [isAddingNew, setIsAddingNew] = useState(false)
	const [isViewOnly, setIsViewOnly] = useState(false)
	const emptyForm = {
		fullName: '',
		phone: '',
		email: '',
		password: '',
		date_of_birth: '2025-08-06',
		gender: 'erkak',
		role: 'Mentor',
		company: '',
		position: '',
		location: '',
		skype_username: '',
		profileImage: '',
	}
	const [formData, setFormData] = useState(emptyForm)
	const [formLoading, setFormLoading] = useState(false)
	const [formError, setFormError] = useState(null)

	const [deleteModalOpen, setDeleteModalOpen] = useState(false)
	const [mentorToDelete, setMentorToDelete] = useState(null)

	const navigate = useNavigate()
	const dispatch = useDispatch()
	const token = useSelector(s => s.auth.accessToken)
	const authHeaders = {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	}

	const fetchMentors = async () => {
		if (!token) {
			setError('No authentication token found. Please log in.')
			setLoading(false)
			return
		}
		try {
			setLoading(true)
			setError(null)
			const res = await fetch(`${API_BASE}/teachers`, { headers: authHeaders })
			if (!res.ok) {
				if (res.status === 401) {
					dispatch(logout())
					navigate('/login')
				}
				throw new Error((await res.text()) || 'Xatolik')
			}
			const data = await res.json()
			const list = Array.isArray(data?.teachers) ? data.teachers : []
			const mentorsOnly = list
				.filter(t => (t.role || '').toLowerCase() === 'mentor')
				.map(t => ({
					id: t.teacher_id || t._id || t.email,
					name: t.fullName || 'N/A',
					username: t.email || 'N/A',
					phone: t.phone || 'N/A',
					role: t.role || 'Mentor',
					company: t.company || '',
					position: t.position || '',
					location: t.location || '',
					gender: t.gender || 'erkak',
					profileImage:
						t.imgURL || t.profileImage || t.profile_image || t.avatar || '',
				}))
			setMentors(mentorsOnly)
		} catch (e) {
			setError(e.message || "Ma'lumotlarni yuklashda xato")
			setMentors([])
		} finally {
			setLoading(false)
		}
	}
	useEffect(() => {
		fetchMentors()
	}, [token]) // eslint-disable-line

	const loadTeacher = async (id, view = false) => {
		if (!token)
			return setFormError('No authentication token found. Please log in.')
		try {
			setFormLoading(true)
			setFormError(null)
			setIsAddingNew(false)
			setIsViewOnly(view)
			const r = await fetch(`${API_BASE}/teachers/${id}`, {
				headers: authHeaders,
			})
			if (!r.ok) {
				if (r.status === 401) {
					dispatch(logout())
					navigate('/login')
				}
				throw new Error('Failed to fetch teacher data')
			}
			const d = await r.json()
			setFormData({
				fullName: d.fullName || '',
				phone: d.phone || '',
				email: d.email || '',
				password: '',
				date_of_birth: d.date_of_birth || '2025-08-06',
				gender: d.gender || 'erkak',
				role: d.role || 'Mentor',
				company: d.company || '',
				position: d.position || '',
				location: d.location || '',
				skype_username: d.skype_username || '',
				profileImage:
					d.imgURL || d.profileImage || d.profile_image || d.avatar || '',
			})
			setSelectedMentor(id)
		} catch (e) {
			setFormError(e.message)
		} finally {
			setFormLoading(false)
		}
	}
	const handleEdit = id => loadTeacher(id, false)
	const handleView = id => loadTeacher(id, true)
	const handleAddNew = () => {
		setIsAddingNew(true)
		setIsViewOnly(false)
		setSelectedMentor(null)
		setFormData(emptyForm)
	}
	const handleChange = e =>
		setFormData(p => ({ ...p, [e.target.name]: e.target.value }))
	const handleSubmit = async e => {
		e.preventDefault?.()
		if (!token)
			return setFormError('No authentication token found. Please log in.')
		try {
			setFormLoading(true)
			setFormError(null)
			const payload = { ...formData }
			if (!payload.password) delete payload.password
			if (payload.profileImage && !payload.imgURL)
				payload.imgURL = payload.profileImage
			delete payload.profileImage

			const url = isAddingNew
				? `${API_BASE}/teachers/register`
				: `${API_BASE}/teachers/${selectedMentor}`
			const method = isAddingNew ? 'POST' : 'PUT'
			const res = await fetch(url, {
				method,
				headers: authHeaders,
				body: JSON.stringify(payload),
			})
			if (!res.ok) {
				if (res.status === 401) {
					dispatch(logout())
					navigate('/login')
				}
				throw new Error(
					`Failed to ${
						isAddingNew ? 'create' : 'update'
					} teacher: ${await res.text()}`
				)
			}
			setSelectedMentor(null)
			setIsAddingNew(false)
			fetchMentors()
		} catch (e) {
			setFormError(e.message)
		} finally {
			setFormLoading(false)
		}
	}
	const handleCloseModal = () => {
		setSelectedMentor(null)
		setIsAddingNew(false)
		setIsViewOnly(false)
		setFormError(null)
	}

	const handleDelete = id => {
		setMentorToDelete(id)
		setDeleteModalOpen(true)
	}
	const confirmDelete = async () => {
		if (!token) {
			setError('No authentication token found. Please log in.')
			setDeleteModalOpen(false)
			return
		}
		try {
			const r = await fetch(`${API_BASE}/teachers/${mentorToDelete}`, {
				method: 'DELETE',
				headers: authHeaders,
			})
			if (!r.ok) {
				if (r.status === 401) {
					dispatch(logout())
					navigate('/login')
				}
				throw new Error(`Failed to delete mentor: ${await r.text()}`)
			}
			fetchMentors()
		} catch (e) {
			setError(e.message || 'Failed to delete mentor')
		} finally {
			setDeleteModalOpen(false)
			setMentorToDelete(null)
		}
	}

	const filteredMentors = useMemo(
		() =>
			mentors.filter(
				m =>
					m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
					m.phone.includes(searchQuery)
			),
		[mentors, searchQuery]
	)

	const handleUsers = () => navigate('/head-mentor/guruhlar')

	return (
		<div className='min-h-screen p-6'>
			<div className='bg-white px-8 py-6 mb-8 rounded-2xl shadow-sm border border-gray-100'>
				<div className='flex items-center justify-between'>
					<div>
						<h1 className='text-3xl font-bold text-gray-800'>
							Mentorlar
						</h1>
						<p className='text-gray-500 text-base mt-1'>
							Foydalanuvchilar ro'yxati (faqat Mentorlar)
						</p>
					</div>
					<div className='bg-blue-500 text-white px-4 py-2 rounded-xl shadow-sm'>
						<span className='text-sm font-semibold'>
							Jami: {filteredMentors.length} ta
						</span>
					</div>
				</div>
			</div>

			<div className='bg-white px-8 py-5 mb-8 rounded-2xl shadow-sm border border-gray-100'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
					<div className='relative w-full sm:max-w-md'>
						<Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
						<input
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							placeholder='Qidirish (ism, email, telefon)...'
							className='w-full pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white transition'
						/>
					</div>
					<div className='flex items-center gap-3'>
						<Btn className='px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 shadow-sm'>
							<Filter className='w-5 h-5 mr-2' /> Filter
						</Btn>
						<Btn
							onClick={handleAddNew}
							className='px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-sm'
						>
							<Plus className='w-5 h-5 mr-2' /> Yangi mentor
						</Btn>
					</div>
				</div>
			</div>

			{error && (
				<div className='bg-red-50 text-red-700 px-6 py-4 rounded-2xl mb-8 border border-red-200'>
					{error}
					<Btn
						onClick={fetchMentors}
						className='ml-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700'
					>
						Qayta urinish
					</Btn>
				</div>
			)}

			<div className='mb-8'>
				{loading ? (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
						{[...Array(8)].map((_, i) => (
							<div key={i} className='bg-white rounded-2xl shadow-sm border border-gray-100 px-[20px] py-[10px]'>
								{/* Avatar */}
								<div className='flex justify-center mb-6 mt-2'>
									<div className='w-20 h-20 rounded-2xl bg-gray-200 animate-pulse' />
								</div>
								{/* Name & badge */}
								<div className='flex flex-col items-center gap-2 mb-6'>
									<div className='h-5 w-32 bg-gray-200 rounded-lg animate-pulse' />
									<div className='h-4 w-16 bg-gray-100 rounded-full animate-pulse' />
								</div>
								{/* Info rows */}
								<div className='space-y-4 mb-6'>
									<div className='flex items-center gap-4'>
										<div className='w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0' />
										<div className='h-3 bg-gray-200 rounded animate-pulse flex-1' />
									</div>
									<div className='flex items-center gap-4'>
										<div className='w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0' />
										<div className='h-3 bg-gray-200 rounded animate-pulse w-3/4' />
									</div>
									<div className='flex items-center gap-4'>
										<div className='w-10 h-10 rounded-xl bg-gray-100 animate-pulse flex-shrink-0' />
										<div className='h-3 bg-gray-200 rounded animate-pulse w-2/3' />
									</div>
								</div>
								{/* Action buttons */}
								<div className='flex justify-between items-center pt-6 mt-6 border-t border-gray-100'>
									<div className='flex gap-2'>
										<div className='w-11 h-11 rounded-xl bg-gray-100 animate-pulse' />
										<div className='w-11 h-11 rounded-xl bg-gray-100 animate-pulse' />
										<div className='w-11 h-11 rounded-xl bg-gray-100 animate-pulse' />
									</div>
									<div className='w-11 h-11 rounded-xl bg-gray-100 animate-pulse' />
								</div>
							</div>
						))}
					</div>
				) : filteredMentors.length ? (
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
						{filteredMentors.map(m => (
							<div
								key={m.id}
								onClick={() => navigate(`/head-mentor/mentorlar/${m.id}`)}
								className='group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 px-[20px] py-[10px] border border-gray-100 hover:scale-[1.02] hover:border-gray-200'
								title='Mentor sahifasi'
							>
								<div className='flex justify-center mb-6'>
									<div className='relative'>
										{m.profileImage ? (
											<img
												src={m.profileImage}
												alt={m.name}
												className='w-20 h-20 rounded-2xl object-cover shadow-md border-4 border-white group-hover:border-blue-100 transition-all duration-300'
												onError={e => {
													e.currentTarget.style.display = 'none'
													const fallback = e.currentTarget.nextSibling
													if (fallback) fallback.style.display = 'flex'
												}}
											/>
										) : null}
										<div
											className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold text-[18px] flex items-center justify-center shadow-md border-4 border-white group-hover:border-blue-100 transition-all duration-300 ${
												m.profileImage ? 'hidden' : 'flex'
											}`}
										>
											{m.name
												.split(' ')
												.map(n => n[0])
												.join('')
												.toUpperCase()
												.slice(0, 2)}
										</div>
									</div>
								</div>

								<div className='text-center mb-6'>
									<div className='flex items-center justify-center gap-2 mb-2'>
										<h3 className='text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300'>
											{m.name}
										</h3>
										<ChevronRight className='w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300' />
									</div>
									<span className='inline-block px-4 py-1.5 text-sm font-semibold rounded-full bg-blue-50 text-blue-700'>
										{m.role}
									</span>
								</div>

								<div className='space-y-4 mb-6'>
									<div className='flex items-center gap-4 text-gray-600'>
										<div className='w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shadow-sm'>
											<Mail className='w-5 h-5 text-blue-500' />
										</div>
										<span className='text-sm font-medium truncate flex-1'>
											{m.username}
										</span>
									</div>

									<div className='flex items-center gap-4 text-gray-600'>
										<div className='w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shadow-sm'>
											<Phone className='w-5 h-5 text-emerald-500' />
										</div>
										<span className='text-sm font-medium'>{m.phone}</span>
									</div>

									{m.position && (
										<div className='flex items-center gap-4 text-gray-600'>
											<div className='w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shadow-sm'>
												<Briefcase className='w-5 h-5 text-indigo-500' />
											</div>
											<span className='text-sm font-medium truncate flex-1'>
												{m.position}
											</span>
										</div>
									)}

									{m.location && (
										<div className='flex items-center gap-4 text-gray-600'>
											<div className='w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shadow-sm'>
												<MapPin className='w-5 h-5 text-orange-400' />
											</div>
											<span className='text-sm font-medium truncate flex-1'>
												{m.location}
											</span>
										</div>
									)}
								</div>

								<div className='flex justify-between items-center pt-6 mt-6 border-t border-gray-100'>
									<div className='flex gap-2'>
										<Btn
											onClick={e => {
												e.stopPropagation()
												handleUsers()
											}}
											className='w-11 h-11 bg-emerald-50 hover:bg-emerald-100 rounded-xl'
											title='Foydalanuvchilar'
										>
											<Users className='w-5 h-5 text-emerald-600' />
										</Btn>
										<Btn
											onClick={e => {
												e.stopPropagation()
												handleEdit(m.id)
											}}
											className='w-11 h-11 bg-blue-50 hover:bg-blue-100 rounded-xl'
											title='Tahrirlash'
										>
											<Edit className='w-5 h-5 text-blue-600' />
										</Btn>
										<Btn
											onClick={e => {
												e.stopPropagation()
												handleView(m.id)
											}}
											className='w-11 h-11 bg-indigo-50 hover:bg-indigo-100 rounded-xl'
											title="Ko'rish"
										>
											<Eye className='w-5 h-5 text-indigo-500' />
										</Btn>
									</div>
									<Btn
										onClick={e => {
											e.stopPropagation()
											setDeleteModalOpen(true)
											setMentorToDelete(m.id)
										}}
										className='w-11 h-11 bg-red-50 hover:bg-red-100 rounded-xl'
										title="O'chirish"
									>
										<Trash2 className='w-5 h-5 text-red-500' />
									</Btn>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='text-center py-24 text-gray-400 text-lg'>
						Hech qanday mentor topilmadi
					</div>
				)}
			</div>

			{/* Edit/View Modal */}
			{(selectedMentor || isAddingNew) && (
				<div className='fixed inset-0 flex items-center justify-center bg-black/50 z-40'>
					<div className='bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full mx-6 max-h-[90vh] overflow-y-auto border border-gray-100'>
						<div className='flex justify-between items-center mb-6'>
							<h2 className='text-2xl font-bold text-gray-800'>
								{isAddingNew
									? "Yangi mentor qo'shish"
									: isViewOnly
									? 'Mentor maʼlumotlari'
									: 'Mentorni tahrirlash'}
							</h2>
							<Btn
								onClick={handleCloseModal}
								className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl'
							>
								<X className='w-6 h-6' />
							</Btn>
						</div>

						{formError && (
							<div className='bg-red-50 text-red-700 px-6 py-4 rounded-xl mb-6 border border-red-200'>
								{formError}
							</div>
						)}
						{formLoading && (
							<div className='text-center py-8'>
								<Loader2 className='w-10 h-10 animate-spin text-blue-500 mx-auto' />
								<p className='text-gray-400 mt-2'>Ma'lumotlar yuklanmoqda...</p>
							</div>
						)}

						<form
							onSubmit={handleSubmit}
							className='grid grid-cols-1 gap-6 md:grid-cols-2'
						>
							<div className='md:col-span-2'>
								<label className='block text-sm font-semibold text-gray-600 mb-2'>
									Profil rasmi (imgURL)
								</label>
								<input
									type='url'
									name='profileImage'
									value={formData.profileImage}
									onChange={handleChange}
									disabled={isViewOnly}
									placeholder='https://example.com/teacher.jpg'
									className='w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white transition'
								/>
							</div>

							{[
								{
									l: "To'liq ismi *",
									n: 'fullName',
									t: 'text',
									r: !isViewOnly,
								},
								{ l: 'Telefon raqami', n: 'phone', t: 'text' },
								{ l: 'Email *', n: 'email', t: 'email', r: true },
							].map(f => (
								<div key={f.n}>
									<label className='block text-sm font-semibold text-gray-600 mb-2'>
										{f.l}
									</label>
									<input
										type={f.t}
										name={f.n}
										value={formData[f.n]}
										onChange={handleChange}
										disabled={isViewOnly}
										required={f.r}
										className='w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white transition'
									/>
								</div>
							))}

							<div>
								<label className='block text-sm font-semibold text-gray-600 mb-2'>
									Parol {isAddingNew && '*'}
								</label>
								<input
									type='password'
									name='password'
									value={formData.password}
									onChange={handleChange}
									disabled={isViewOnly}
									required={isAddingNew}
									placeholder={
										isAddingNew ? '' : "O'zgartirmasangiz bo'sh qoldiring"
									}
									className='w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white transition'
								/>
							</div>

							<div>
								<label className='block text-sm font-semibold text-gray-600 mb-2'>
									Tug'ilgan sanasi
								</label>
								<input
									type='date'
									name='date_of_birth'
									value={formData.date_of_birth}
									onChange={handleChange}
									disabled={isViewOnly}
									className='w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white transition'
								/>
							</div>

							<div>
								<label className='block text-sm font-semibold text-gray-600 mb-2'>
									Jinsi
								</label>
								<select
									name='gender'
									value={formData.gender}
									onChange={handleChange}
									disabled={isViewOnly}
									className='w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white transition'
								>
									<option value='erkak'>Erkak</option>
									<option value='ayol'>Ayol</option>
								</select>
							</div>

							<div>
								<label className='block text-sm font-semibold text-gray-600 mb-2'>
									Rol
								</label>
								<select
									name='role'
									value={formData.role}
									onChange={handleChange}
									disabled={isViewOnly}
									className='w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white transition'
								>
									<option value='Mentor'>Mentor</option>
									<option value='Teacher'>Teacher</option>
								</select>
							</div>

							{[
								{ l: 'Kompaniya', n: 'company' },
								{ l: 'Lavozim', n: 'position' },
								{ l: 'Manzil', n: 'location' },
								{ l: 'Skype username', n: 'skype_username' },
							].map(f => (
								<div key={f.n}>
									<label className='block text-sm font-semibold text-gray-600 mb-2'>
										{f.l}
									</label>
									<input
										name={f.n}
										value={formData[f.n]}
										onChange={handleChange}
										disabled={isViewOnly}
										className='w-full p-4 rounded-xl focus:ring-2 focus:ring-blue-500 border border-gray-200 bg-gray-50 focus:outline-none focus:bg-white transition'
									/>
								</div>
							))}
						</form>

						<div className='mt-8 flex justify-end gap-4'>
							<Btn
								onClick={handleCloseModal}
								className='px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl'
							>
								{isViewOnly ? 'Yopish' : 'Bekor qilish'}
							</Btn>
							{!isViewOnly && (
								<Btn
									onClick={handleSubmit}
									disabled={formLoading}
									className='px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm disabled:opacity-60'
								>
									{formLoading
										? isAddingNew
											? 'Yaratilmoqda...'
											: 'Yangilanmoqda...'
										: isAddingNew
										? 'Yaratish'
										: 'Yangilash'}
								</Btn>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Delete Modal */}
			{deleteModalOpen && (
				<div className='fixed inset-0 flex items-center justify-center bg-black/50 z-50'>
					<div className='bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-6 border border-gray-100'>
						<div className='flex justify-between items-center mb-6'>
							<h2 className='text-2xl font-bold text-gray-800'>
								O'chirishni tasdiqlang
							</h2>
							<Btn
								onClick={() => {
									setDeleteModalOpen(false)
									setMentorToDelete(null)
								}}
								className='p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl'
							>
								<X className='w-6 h-6' />
							</Btn>
						</div>
						<p className='text-gray-600 mb-8 text-lg'>
							Rostdan ham ushbu foydalanuvchini o'chirmoqchimisiz? Bu amalni
							qaytarib bo'lmaydi.
						</p>
						<div className='flex justify-end gap-4'>
							<Btn
								onClick={() => {
									setDeleteModalOpen(false)
									setMentorToDelete(null)
								}}
								className='px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl'
							>
								Bekor qilish
							</Btn>
							<Btn
								onClick={confirmDelete}
								className='px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-sm'
							>
								Ha, o'chirish
							</Btn>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}