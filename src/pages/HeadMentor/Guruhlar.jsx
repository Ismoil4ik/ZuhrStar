import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setCredentials } from '../../redux/authSlice'
import {
	Clock,
	Code,
	Search,
	Users,
	ChevronLeft,
	Check,
	X,
	ChevronDown,
	Loader2,
	GraduationCap,
	User,
} from 'lucide-react'

const API_BASE = 'https://zuhr-star-production.up.railway.app/api'

// === Yordamchi funksiyalar ===
const gid = g => String(g?.group_id ?? g?.id ?? g?._id ?? '')
const sid = s => String(s?.student_id ?? s?.studentId ?? s?.id ?? s?._id ?? '')
const attKey = (g, s, dateStr) => `${g}:${s}:${dateStr}`

const niceStudent = s => {
	const nameParts = [s?.full_name || s?.fullName, s?.name, s?.surname].filter(Boolean)
	const name = nameParts.join(' ').trim() || "Noma'lum"
	return { ...s, name }
}

const getWeekdayConfig = group => {
	const days = group?.days || {}
	return {
		odd: !!days.odd_days,
		even: !!days.even_days,
		every: !!days.every_days,
	}
}

const isClassDay = (dayOfMonth, group) => {
	const cfg = getWeekdayConfig(group)
	if (cfg.every) return true
	const date = new Date(group.selectedYear, group.selectedMonth, dayOfMonth)
	const weekday = date.getDay()
	if (cfg.odd && [1, 3, 5].includes(weekday)) return true
	if (cfg.even && [2, 4, 6].includes(weekday)) return true
	return false
}

const daysBadge = g => {
	const cfg = getWeekdayConfig(g)
	if (cfg.every) return 'Har kuni'
	if (cfg.odd) return 'Toq kunlar (Dush, Chorsh, Jum)'
	if (cfg.even) return 'Juft kunlar (Sesh, Paysh, Shan)'
	return '—'
}

const toLocalDateStr = d => {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const Guruhlar = () => {
	const dispatch = useDispatch()
	const accessToken = useSelector(state => state.auth.accessToken)
	const refreshToken = useSelector(state => state.auth.refreshToken)

	const [groups, setGroups] = useState([])
	const [selectedGroup, setSelectedGroup] = useState(null)
	const [students, setStudents] = useState([])
	const [attendance, setAttendance] = useState({})
	const [showOptions, setShowOptions] = useState(null)
	const [selectedMonth, setSelectedMonth] = useState(null)
	const [search, setSearch] = useState('')
	const [isLoading, setIsLoading] = useState({ boot: true, attendance: false })

	const months = useMemo(() => {
		const now = new Date()
		const result = []
		for (let i = -3; i <= 3; i++) {
			const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
			result.push({
				label: d.toLocaleDateString('en-US', { month: 'long', year: '2-digit' }),
				month: d.getMonth(),
				year: d.getFullYear(),
				isCurrent: d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(),
			})
		}
		return result
	}, [])

	useEffect(() => {
		const current = months.find(m => m.isCurrent)
		if (current) setSelectedMonth(current)
	}, [months])

	const monthDays = useMemo(() => {
		if (!selectedMonth) return []
		const y = selectedMonth.year
		const m = selectedMonth.month
		const daysInMonth = new Date(y, m + 1, 0).getDate()
		return Array.from({ length: daysInMonth }, (_, i) => {
			const day = i + 1
			const d = new Date(y, m, day)
			const isoLocal = toLocalDateStr(d)
			const now = new Date()
			const isToday = day === now.getDate() && m === now.getMonth() && y === now.getFullYear()
			const dateLabel = `${String(day).padStart(2, '0')}.${String(m + 1).padStart(2, '0')}`
			const dayName = d.toLocaleDateString('uz-UZ', { weekday: 'short' })
			return { day, date: d, dateStr: isoLocal, isToday, dateLabel, dayName }
		})
	}, [selectedMonth])

	const classDays = useMemo(() => {
		if (!selectedGroup) return monthDays
		return monthDays.filter(d =>
			isClassDay(d.day, {
				...selectedGroup,
				selectedYear: selectedMonth?.year,
				selectedMonth: selectedMonth?.month,
			})
		)
	}, [monthDays, selectedGroup, selectedMonth])

	const refreshAccessToken = useCallback(async () => {
		if (!refreshToken) return null
		try {
			const res = await fetch(`${API_BASE}/users/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken }),
			})
			if (!res.ok) throw new Error('Token refresh failed')
			const data = await res.json()
			dispatch(setCredentials(data))
			return data.accessToken
		} catch (err) {
			console.error('refreshAccessToken error:', err)
			return null
		}
	}, [refreshToken, dispatch])

	const authFetch = useCallback(
		async (url, opts = {}) => {
			const attempt = async token => {
				const headers = {
					Authorization: token ? `Bearer ${token}` : undefined,
					'Content-Type': 'application/json',
					...(opts.headers || {}),
				}
				const res = await fetch(url, { ...opts, headers })
				if (res.status === 401) throw new Error('401')
				if (!res.ok) {
					const text = await res.text()
					throw new Error(text || `HTTP ${res.status}`)
				}
				const ct = res.headers.get('content-type') || ''
				if (ct.includes('application/json')) return await res.json()
				return null
			}
			try {
				return await attempt(accessToken)
			} catch (e) {
				if (String(e.message).includes('401')) {
					const newToken = await refreshAccessToken()
					if (!newToken) throw e
					return await attempt(newToken)
				}
				throw e
			}
		},
		[accessToken, refreshAccessToken]
	)

	useEffect(() => {
		if (!accessToken) return
		const load = async () => {
			setIsLoading(prev => ({ ...prev, boot: true }))
			try {
				const gRes = await authFetch(`${API_BASE}/groups`)
				const groupList = Array.isArray(gRes) ? gRes : gRes?.groups || []
				setGroups(groupList)
			} catch (err) {
				console.error('Guruhlar yuklashda xato:', err)
			} finally {
				setIsLoading(prev => ({ ...prev, boot: false }))
			}
		}
		load()
	}, [accessToken, authFetch])

	const handleGroupClick = async group => {
		setSelectedGroup(group)
		setStudents([])
		try {
			const studentsInGroup = (group.students || []).map(niceStudent)
			setStudents(studentsInGroup)
		} catch (err) {
			console.error(err)
		}
	}

	const loadAttendance = useCallback(async () => {
		if (!selectedGroup || !selectedMonth) return
		setIsLoading(prev => ({ ...prev, attendance: true }))
		try {
			const startDate = new Date(selectedMonth.year, selectedMonth.month, 1)
			const endDate = new Date(selectedMonth.year, selectedMonth.month + 1, 0)
			const start = toLocalDateStr(startDate)
			const end = toLocalDateStr(endDate)
			const groupParam = selectedGroup.group_id ?? selectedGroup.id ?? gid(selectedGroup)
			const res = await authFetch(`${API_BASE}/attendance?group_id=${groupParam}&start=${start}&end=${end}`)
			const data = Array.isArray(res) ? res : res?.attendance || []
			const map = {}
			data.forEach(r => {
				let dateStr = r.date || r.dateStr || ''
				if (dateStr.includes('T')) dateStr = dateStr.split('T')[0]
				if (!dateStr) return
				const key = attKey(gid(selectedGroup), sid(r), dateStr)
				map[key] = r.status === 'present' || r.status === true ? 'present' : 'absent'
			})
			setAttendance(map)
		} catch (err) {
			console.error('Davomat yuklashda xato:', err)
		} finally {
			setIsLoading(prev => ({ ...prev, attendance: false }))
		}
	}, [selectedGroup, selectedMonth, authFetch])

	useEffect(() => {
		if (selectedGroup) loadAttendance()
	}, [selectedGroup, selectedMonth, loadAttendance])

	const canMarkAttendance = dateStr => {
		if (!selectedGroup) return { allowed: false, message: 'Guruh tanlanmagan.' }
		const now = new Date()
		const parts = dateStr.split('-').map(Number)
		if (parts.length !== 3) return { allowed: false, message: "Noto'g'ri sana formatı." }
		const [year, month, day] = parts
		const selectedDate = new Date(year, month - 1, day)
		const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		todayStart.setHours(0, 0, 0, 0)
		const selectedStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
		selectedStart.setHours(0, 0, 0, 0)
		if (selectedStart.getTime() < todayStart.getTime()) return { allowed: false, message: "O'tgan kunlar uchun davomat belgilab bo'lmaydi!" }
		if (selectedStart.getTime() > todayStart.getTime()) return { allowed: false, message: "Kelajak kunlar uchun davomat belgilab bo'lmaydi!" }
		const startTime = selectedGroup?.start_time || '00:00'
		const endTime = selectedGroup?.end_time || '23:59'
		const parseTime = t => {
			const p = String(t).split(':').map(n => Number(n))
			const h = Number.isFinite(p[0]) ? p[0] : 0
			const mm = Number.isFinite(p[1]) ? p[1] : 0
			return { h: Math.max(0, Math.min(23, h)), m: Math.max(0, Math.min(59, mm)) }
		}
		const s = parseTime(startTime)
		const e = parseTime(endTime)
		const currentMinutes = now.getHours() * 60 + now.getMinutes()
		const classStartMinutes = s.h * 60 + s.m
		const classEndMinutes = e.h * 60 + e.m
		const formatTime = timeStr => {
			const parts = String(timeStr).split(':')
			const hh = parts[0] ? String(parts[0]).padStart(2, '0') : '00'
			const mm = parts[1] ? String(parts[1]).padStart(2, '0') : '00'
			return `${hh}:${mm}`
		}
		if (currentMinutes < classStartMinutes) return { allowed: false, message: `Dars hali boshlanmagan! Dars vaqti: ${formatTime(startTime)} - ${formatTime(endTime)}` }
		if (currentMinutes > classEndMinutes) return { allowed: false, message: `Dars tugagan! Dars vaqti: ${formatTime(startTime)} - ${formatTime(endTime)}` }
		return { allowed: true }
	}

	const markAttendance = async (studentIdRaw, dateStr, status) => {
		const timeCheck = canMarkAttendance(dateStr)
		if (!timeCheck.allowed) { alert(timeCheck.message); return }
		const studentId = String(studentIdRaw)
		const key = attKey(gid(selectedGroup), studentId, dateStr)
		const prev = attendance[key]
		setAttendance(prevMap => ({ ...prevMap, [key]: status }))
		try {
			const groupVal = selectedGroup.group_id ?? selectedGroup.id ?? gid(selectedGroup)
			const groupNumeric = Number(groupVal)
			const studentNumeric = Number(studentId)
			const payload = {
				group_id: !Number.isNaN(groupNumeric) ? groupNumeric : groupVal,
				student_id: !Number.isNaN(studentNumeric) ? studentNumeric : studentId,
				groupId: gid(selectedGroup),
				studentId: studentId,
				date: dateStr,
				status: status === 'present',
			}
			await authFetch(`${API_BASE}/attendance`, { method: 'POST', body: JSON.stringify(payload) })
			setShowOptions(null)
		} catch (err) {
			console.error('Davomat belgilashda xato:', err)
			setAttendance(prevMap => ({ ...prevMap, [key]: prev }))
			let errMsg = err?.message ?? String(err)
			try { const parsed = JSON.parse(errMsg); if (parsed?.message) errMsg = parsed.message } catch {}
			alert('Xatolik: ' + errMsg)
		}
	}

	const getStatusCls = s =>
		s === 'present'
			? 'bg-emerald-400 text-white'
			: s === 'absent'
			? 'bg-red-400 text-white'
			: 'bg-gray-100 border border-gray-200 hover:border-gray-300'

	const filteredGroups = groups.filter(g =>
		(g.name || '').toLowerCase().includes(search.toLowerCase())
	)



	// === GURUHLAR RO'YXATI ===
	if (!selectedGroup) {
		return (
			<div className='min-h-screen bg-gray-50 flex flex-col'>
				{/* Header */}
				<header className='bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex-shrink-0'>
					<div className='flex items-center justify-between'>
						<div>
							<h1 className='text-base sm:text-lg font-bold text-gray-800 tracking-tight'>GURUHLAR</h1>
							<p className='hidden sm:block text-xs text-gray-400 mt-0.5'>Barcha guruhlar va ularning ma'lumotlari</p>
						</div>
						<div className='relative'>
							<Search className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none' />
							<input
								type='text'
								value={search}
								onChange={e => setSearch(e.target.value)}
								className='pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm placeholder-gray-400 w-48'
								placeholder='Guruh qidirish...'
							/>
						</div>
					</div>
				</header>

				<main className='flex-1 p-3 sm:p-4 lg:p-5'>
					{/* Stats */}
					<div className='grid grid-cols-2 gap-3 mb-4'>
						<div className='bg-white rounded-xl border-l-4 border-blue-500 shadow-sm p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-2xl font-bold text-gray-800'>{groups.length}</p>
									<p className='text-[11px] text-gray-500 font-medium uppercase tracking-wide mt-0.5'>Jami guruhlar</p>
								</div>
								<div className='bg-blue-50 rounded-xl w-10 h-10 flex items-center justify-center'>
									<Users className='w-5 h-5 text-blue-500' />
								</div>
							</div>
						</div>
						<div className='bg-white rounded-xl border-l-4 border-emerald-500 shadow-sm p-4'>
							<div className='flex items-center justify-between'>
								<div>
									<p className='text-2xl font-bold text-gray-800'>{filteredGroups.length}</p>
									<p className='text-[11px] text-gray-500 font-medium uppercase tracking-wide mt-0.5'>Filtrlangan</p>
								</div>
								<div className='bg-emerald-50 rounded-xl w-10 h-10 flex items-center justify-center'>
									<GraduationCap className='w-5 h-5 text-emerald-500' />
								</div>
							</div>
						</div>
					</div>

					{/* Cards */}
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{isLoading.boot ? [...Array(6)].map((_, i) => (
							<div key={i} className='bg-white rounded-xl shadow-sm border border-gray-100 p-5'>
								<div className='flex justify-between items-start mb-4'>
									<div className='space-y-2'>
										<div className='h-4 bg-gray-200 rounded animate-pulse w-32' />
										<div className='h-3 bg-gray-200 rounded animate-pulse w-20' />
									</div>
									<div className='w-8 h-8 bg-gray-200 rounded-lg animate-pulse' />
								</div>
								<div className='space-y-2 mb-4'>
									<div className='h-3 bg-gray-200 rounded animate-pulse w-28' />
									<div className='h-3 bg-gray-200 rounded animate-pulse w-36' />
									<div className='h-3 bg-gray-200 rounded animate-pulse w-20' />
								</div>
								<div className='pt-3 border-t border-gray-50'>
									<div className='h-5 bg-gray-200 rounded-md animate-pulse w-40' />
								</div>
							</div>
						)) : filteredGroups.map(group => (
							<div
								key={gid(group)}
								onClick={() => handleGroupClick(group)}
								className='bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
							>
								<div className='p-5'>
									<div className='flex justify-between items-start mb-4'>
										<div>
											<h3 className='font-bold text-sm text-gray-800'>{group.name}</h3>
											<p className='text-blue-500 text-xs mt-0.5'>{group.course}</p>
										</div>
										<div className='bg-blue-50 p-2 rounded-lg'>
											<Code className='w-4 h-4 text-blue-500' />
										</div>
									</div>

									<div className='space-y-2 text-xs text-gray-600 mb-4'>
										<div className='flex items-center gap-2'>
											<Clock className='w-3.5 h-3.5 text-blue-400 flex-shrink-0' />
											<span>{group.start_time} - {group.end_time}</span>
										</div>
										<div className='flex items-center gap-2'>
											<User className='w-3.5 h-3.5 text-blue-400 flex-shrink-0' />
											<span className='truncate'>{group.teacher_fullName || '—'}</span>
										</div>
										<div className='flex items-center gap-2'>
											<Users className='w-3.5 h-3.5 text-blue-400 flex-shrink-0' />
											<span>{group.students?.length || 0} o'quvchi</span>
										</div>
									</div>

									<div className='pt-3 border-t border-gray-50'>
										<span className='inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700'>
											{daysBadge(group)}
										</span>
									</div>
								</div>
							</div>
						))}

						
					</div>
				</main>
			</div>
		)
	}

	// === DAVOMAT JADVALI ===
	return (
		<div className='h-screen bg-gray-50 flex flex-col overflow-hidden'>
			{/* Header */}
			<div className='bg-white border-b border-gray-200 shadow-sm flex-shrink-0'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between'>
					<div className='flex items-center gap-3'>
						<button
							onClick={() => setSelectedGroup(null)}
							className='p-1.5 hover:bg-gray-100 rounded-lg transition-colors'
						>
							<ChevronLeft className='w-5 h-5 text-gray-500' />
						</button>
						<GraduationCap className='w-5 h-5 text-blue-500' />
						<div>
							<h1 className='text-sm font-bold text-gray-800 tracking-tight'>DAVOMAT JADVALI</h1>
							<p className='text-xs text-gray-400'>{selectedGroup.name}</p>
						</div>
					</div>

					<div className='relative'>
						<select
							value={gid(selectedGroup)}
							onChange={e => {
								const g = groups.find(x => gid(x) === e.target.value)
								if (g) handleGroupClick(g)
							}}
							className='appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm'
						>
							{groups.map(g => (
								<option key={gid(g)} value={gid(g)}>{g.name}</option>
							))}
						</select>
						<ChevronDown className='absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none' />
					</div>
				</div>
			</div>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col overflow-hidden w-full'>
				{/* Stats */}
				<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 flex-shrink-0'>
					{[
						{ label: "Yo'nalish", value: selectedGroup.course || '—', sub: selectedGroup.name, border: 'border-blue-500', bg: 'bg-blue-50', color: 'text-blue-600' },
						{ label: 'Darslar soni', value: classDays.length, border: 'border-indigo-500', bg: 'bg-indigo-50', color: 'text-indigo-600' },
						{ label: 'Dars vaqti', value: selectedGroup.start_time?.substring(0, 5) || '—', border: 'border-emerald-500', bg: 'bg-emerald-50', color: 'text-emerald-600' },
						{ label: 'Dars kunlari', value: daysBadge(selectedGroup), border: 'border-orange-500', bg: 'bg-orange-50', color: 'text-orange-500', small: true },
					].map(({ label, value, sub, border, bg, color, small }) => (
						<div key={label} className={`bg-white rounded-xl border-l-4 ${border} shadow-sm p-3`}>
							<p className='text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1'>{label}</p>
							<p className={`${small ? 'text-xs' : 'text-xl'} font-bold ${color} leading-tight`}>{value}</p>
							{sub && <p className='text-[10px] text-gray-400 mt-0.5 truncate'>{sub}</p>}
						</div>
					))}
				</div>

				{/* Oylar */}
				<div className='flex gap-2 mb-4 overflow-x-auto pb-1 flex-shrink-0'>
					{months.map((m, i) => (
						<button
							key={i}
							onClick={() => setSelectedMonth(m)}
							className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
								selectedMonth?.label === m.label
									? 'bg-blue-600 text-white shadow-sm'
									: 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-600'
							}`}
						>
							{m.label}
						</button>
					))}
				</div>

				{/* Jadval */}
				{isLoading.attendance ? (
					<div className='bg-white rounded-xl border border-gray-100 shadow-sm flex-1 min-h-0 overflow-hidden'>
						<div className='overflow-auto h-full p-4'>
							{/* Skeleton header */}
							<div className='flex gap-2 mb-3'>
								<div className='w-48 h-8 bg-gray-200 rounded-lg animate-pulse flex-shrink-0' />
								{[...Array(10)].map((_, i) => (
									<div key={i} className='w-14 h-8 bg-gray-200 rounded-lg animate-pulse flex-shrink-0' />
								))}
							</div>
							{/* Skeleton rows */}
							{[...Array(6)].map((_, i) => (
								<div key={i} className='flex gap-2 mb-2'>
									<div className='w-48 h-10 bg-gray-100 rounded-lg animate-pulse flex-shrink-0' />
									{[...Array(10)].map((_, j) => (
										<div key={j} className='w-14 h-10 bg-gray-100 rounded-lg animate-pulse flex-shrink-0' />
									))}
								</div>
							))}
						</div>
					</div>
				) : (
					<div className='bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex-1 min-h-0'>
						<div className='overflow-auto h-full'>
							<table className='w-full'>
								<thead className='sticky top-0 z-20 bg-white'>
									<tr className='border-b border-gray-100 bg-gray-50'>
										<th className='sticky left-0 bg-gray-50 z-30 text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-widest border-r border-gray-100 min-w-[280px]'>
											O'quvchilar ro'yxati
										</th>
										{classDays.map(d => (
											<th key={d.dateStr} className={`px-2 py-3 text-center min-w-[60px] ${d.isToday ? 'bg-blue-50' : ''}`}>
												<div className={`text-xs font-semibold ${d.isToday ? 'text-blue-600' : 'text-gray-600'}`}>{d.dateLabel}</div>
												<div className={`text-[10px] mt-0.5 uppercase ${d.isToday ? 'text-blue-400' : 'text-gray-400'}`}>{d.dayName}</div>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{students.map((s, i) => {
										const student = niceStudent(s)
										return (
											<tr key={sid(student)} className='border-b border-gray-50 hover:bg-gray-50/60 transition-colors'>
												<td className='sticky left-0 bg-white z-10 px-4 py-2.5 border-r border-gray-100'>
													<div className='flex items-center gap-2.5'>
														<span className='w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs flex items-center justify-center font-semibold flex-shrink-0'>
															{i + 1}
														</span>
														<span className='text-sm font-medium text-gray-800'>{student.name}</span>
													</div>
												</td>

												{classDays.map(d => {
													const key = attKey(gid(selectedGroup), sid(student), d.dateStr)
													const status = attendance[key]
													return (
														<td key={d.dateStr} className={`px-2 py-2 text-center relative ${d.isToday ? 'bg-blue-50/40' : ''}`}>
															<button
																onClick={() => setShowOptions(showOptions === key ? null : key)}
																className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${getStatusCls(status)}`}
															>
																{status === 'present' && <Check className='w-4 h-4' />}
																{status === 'absent' && <X className='w-4 h-4' />}
															</button>

															{showOptions === key && (
																<div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20'>
																	<div className='bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex gap-2'>
																		<button
																			onClick={() => markAttendance(sid(student), d.dateStr, 'present')}
																			className='w-9 h-9 bg-emerald-400 text-white rounded-lg flex items-center justify-center hover:bg-emerald-500 transition-colors'
																		>
																			<Check className='w-4 h-4' />
																		</button>
																		<button
																			onClick={() => markAttendance(sid(student), d.dateStr, 'absent')}
																			className='w-9 h-9 bg-red-400 text-white rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors'
																		>
																			<X className='w-4 h-4' />
																		</button>
																	</div>
																	<div className='absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white' />
																</div>
															)}
														</td>
													)
												})}
											</tr>
										)
									})}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>

			{showOptions && (
				<div className='fixed inset-0 z-10' onClick={() => setShowOptions(null)} />
			)}
		</div>
	)
}

export default Guruhlar