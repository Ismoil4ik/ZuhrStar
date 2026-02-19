import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode } from 'swiper/modules'
import 'swiper/css'

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Tooltip,
	Legend,
	Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Tooltip,
	Legend,
	Filler
)

// На десктопе (≥960px): layout даёт ml-[207px] + w-full → overflow.
// Фикс: maxWidth = 100vw - 207px только при ≥960px, иначе 100vw.
const useRootStyle = () => {
	const [style, setStyle] = useState({})

	useEffect(() => {
		const update = () => {
			if (window.innerWidth >= 960) {
				setStyle({ maxWidth: 'calc(100vw - 207px)', overflowX: 'hidden' })
			} else {
				setStyle({ maxWidth: '100vw', overflowX: 'hidden' })
			}
		}
		update()
		window.addEventListener('resize', update)
		return () => window.removeEventListener('resize', update)
	}, [])

	return style
}

const Dashboard = () => {
	const user = useSelector(state => state.auth.user)
	const accessToken = useSelector(state => state.auth.accessToken)
	const rootStyle = useRootStyle()

	const [teachers, setTeachers] = useState([])
	const [groups, setGroups] = useState([])
	const [students, setStudents] = useState([])
	const [attendance, setAttendance] = useState([])
	const [todaysGroups, setTodaysGroups] = useState([])
	const [positiveAttendance, setPositiveAttendance] = useState(0)
	const [loading, setLoading] = useState(true)

	const currentDate = useMemo(() => new Date(), [])

	const getMonthKey = d => {
		const dt = d instanceof Date ? d : new Date(d)
		const y = dt.getFullYear()
		const m = String(dt.getMonth() + 1).padStart(2, '0')
		return `${y}-${m}`
	}

	const labelFromKey = key => {
		const [y, m] = key.split('-')
		return new Date(Number(y), Number(m) - 1, 1).toLocaleString('uz-UZ', {
			month: 'long',
			year: 'numeric',
		})
	}

	useEffect(() => {
		if (attendance.length > 0) {
			const positive = attendance.filter(a => a.status === true)
			const percentage = (positive.length / attendance.length) * 100
			setPositiveAttendance(parseFloat(percentage.toFixed(1)))
		} else {
			setPositiveAttendance(0)
		}
	}, [attendance])

	useEffect(() => {
		if (groups.length > 0) {
			const today = currentDate.getDay()
			const filtered = []
			for (const g of groups) {
				if (!g?.days) continue
				if (today === 0 && g.days.every_days) filtered.push(g)
				else if (today % 2 === 1 && (g.days.odd_days || g.days.every_days)) filtered.push(g)
				else if (today % 2 === 0 && (g.days.even_days || g.days.every_days)) filtered.push(g)
			}
			setTodaysGroups(filtered)
		} else {
			setTodaysGroups([])
		}
	}, [groups, currentDate])

	useEffect(() => {
		if (!accessToken) return
		const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
		const getJsonSafe = async (res, fallback = null) => {
			if (!res.ok) return fallback
			try { return await res.json() } catch { return fallback }
		}
		const controller = new AbortController()
		;(async () => {
			try {
				setLoading(true)
				const [teachersRes, groupsRes, studentsRes, attendanceRes] = await Promise.all([
					fetch('https://zuhr-star-production.up.railway.app/api/teachers', { headers, signal: controller.signal }),
					fetch('https://zuhr-star-production.up.railway.app/api/groups', { headers, signal: controller.signal }),
					fetch('https://zuhr-star-production.up.railway.app/api/students', { headers, signal: controller.signal }),
					fetch('https://zuhr-star-production.up.railway.app/api/attendance', { headers, signal: controller.signal }),
				])
				const teachersData = (await getJsonSafe(teachersRes, { teachers: [] })) || { teachers: [] }
				const groupsData = (await getJsonSafe(groupsRes, [])) || []
				const studentsData = (await getJsonSafe(studentsRes, [])) || []
				const attendanceData = (await getJsonSafe(attendanceRes, [])) || []
				setTeachers((teachersData?.teachers || []).filter(t => t.role === 'Mentor'))
				setGroups(Array.isArray(groupsData) ? groupsData : groupsData?.groups || [])
				setStudents(Array.isArray(studentsData) ? studentsData : studentsData?.students || [])
				setAttendance(Array.isArray(attendanceData) ? attendanceData : attendanceData?.attendance || [])
			} catch (err) {
				if (err.name !== 'AbortError') console.error('Fetch error:', err)
			} finally {
				setLoading(false)
			}
		})()
		return () => controller.abort()
	}, [accessToken])

	const monthlyBuckets = useMemo(() => {
		const b = {}
		for (const s of students) {
			const dateStr = s.createdAt || s.created_at || s.registeredAt || s.registered_at || s.created_at_date
			if (!dateStr) continue
			const key = getMonthKey(dateStr)
			if (!b[key]) b[key] = 0
			b[key] += 1
		}
		return b
	}, [students])

	const yearMonthKeys = useMemo(() => {
		const y = currentDate.getFullYear()
		return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`)
	}, [currentDate])

	const monthLabels = useMemo(() => yearMonthKeys.map(k => labelFromKey(k)), [yearMonthKeys])
	const monthCounts = useMemo(() => yearMonthKeys.map(k => monthlyBuckets[k] || 0), [yearMonthKeys, monthlyBuckets])

	const monthsChartRef = useRef(null)
	const studentsBarData = useMemo(() => ({
		labels: monthLabels,
		datasets: [{
			label: 'Studentlar',
			data: monthCounts,
			fill: true,
			backgroundColor: ctx => {
				const { ctx: c, chartArea } = ctx.chart
				if (!chartArea) return 'rgba(59,130,246,0.1)'
				const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
				g.addColorStop(0, 'rgba(59,130,246,0.4)')
				g.addColorStop(0.5, 'rgba(99,102,241,0.2)')
				g.addColorStop(1, 'rgba(99,102,241,0.05)')
				return g
			},
			borderColor: 'rgb(59,130,246)',
			borderWidth: 3,
			tension: 0.4,
			pointRadius: 6,
			pointHoverRadius: 8,
			pointBackgroundColor: 'rgb(59,130,246)',
			pointBorderColor: '#fff',
			pointBorderWidth: 2,
			pointHoverBackgroundColor: 'rgb(99,102,241)',
			pointHoverBorderColor: '#fff',
			pointHoverBorderWidth: 3,
		}],
	}), [monthLabels, monthCounts])

	const studentsBarOptions = useMemo(() => ({
		responsive: true,
		maintainAspectRatio: false,
		animation: { duration: 1200, easing: 'easeInOutQuart' },
		interaction: { mode: 'index', intersect: false },
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(59,130,246,0.95)',
				titleColor: '#fff',
				bodyColor: '#fff',
				padding: 14,
				cornerRadius: 10,
				displayColors: false,
				titleFont: { size: 14, weight: 'bold' },
				bodyFont: { size: 14 },
				callbacks: {
					label: ctx => ` 👥 ${ctx.formattedValue} ta`,
					title: ctx => `📅 ${ctx[0].label}`,
				},
			},
		},
		scales: {
			x: {
				grid: { display: true, color: 'rgba(0,0,0,0.03)', drawBorder: false },
				ticks: { color: '#6B7280', font: { weight: '600', size: 11 }, padding: 10 },
				border: { display: false },
			},
			y: {
				beginAtZero: true,
				grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
				ticks: { precision: 0, callback: v => `${v}`, color: '#6B7280', font: { size: 11 }, padding: 10 },
				border: { display: false },
			},
		},
	}), [])

	const mentorStats = useMemo(() => {
		const map = new Map()
		for (const g of groups) {
			const mentorName =
				g.teacher_fullName || g.teacherName || g.teacher?.fullName ||
				`${g.teacher?.name ?? ''} ${g.teacher?.surname ?? ''}`.trim()
			if (!mentorName) continue
			if (!map.has(mentorName)) map.set(mentorName, new Set())
			const set = map.get(mentorName)
			for (const s of g.students || []) {
				const sid = s?._id || s?.student_id || s?.id
				if (sid) set.add(sid)
			}
		}
		for (const t of teachers) {
			const name = t.fullName || `${t.name || ''} ${t.surname || ''}`.trim()
			if (name && !map.has(name)) map.set(name, new Set())
		}
		const rows = Array.from(map.entries()).map(([name, set]) => ({ name, count: set.size }))
		rows.sort((a, b) => b.count - a.count)
		return rows
	}, [groups, teachers])

	const mentorLabels = useMemo(() => mentorStats.map(r => r.name), [mentorStats])
	const mentorCounts = useMemo(() => mentorStats.map(r => r.count), [mentorStats])

	const mentorsChartRef = useRef(null)
	const mentorBarData = useMemo(() => ({
		labels: mentorLabels,
		datasets: [{
			label: "Mentor bo'yicha noyob studentlar",
			data: mentorCounts,
			backgroundColor: ctx => {
				const { ctx: c, chartArea } = ctx.chart
				if (!chartArea) return 'rgba(139,92,246,0.18)'
				const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
				g.addColorStop(0, 'rgba(139,92,246,0.35)')
				g.addColorStop(1, 'rgba(139,92,246,0.10)')
				return g
			},
			borderColor: 'rgba(139,92,246,1)',
			borderWidth: 1.5,
			borderRadius: 10,
			barThickness: 28,
		}],
	}), [mentorLabels, mentorCounts])

	const mentorBarOptions = useMemo(() => ({
		responsive: true,
		maintainAspectRatio: false,
		animation: { duration: 0 },
		interaction: { mode: 'nearest', intersect: false },
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(139,92,246,0.9)',
				titleColor: '#fff',
				bodyColor: '#fff',
				padding: 12,
				callbacks: {
					title: items => `Mentor: ${items[0].label}`,
					label: ctx => ` ${ctx.formattedValue} ta`,
				},
			},
		},
		scales: {
			x: {
				grid: { color: 'rgba(0,0,0,0.08)' },
				ticks: { color: '#111827', font: { weight: '600' } },
			},
			y: {
				beginAtZero: true,
				grid: { color: 'rgba(0,0,0,0.06)' },
				ticks: { precision: 0, callback: v => `${v} ta` },
			},
		},
	}), [])

	// ─── SKELETON ────────────────────────────────────────────────────────────────
	if (loading) {
		return (
			<div className='min-h-screen p-4 lg:p-6' style={rootStyle}>
				<div className='flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6'>
					<div className='flex flex-col gap-2'>
						<div className='h-4 bg-gray-200 rounded w-32 animate-pulse' />
						<div className='h-8 bg-gray-200 rounded w-56 animate-pulse' />
					</div>
					<div className='h-8 bg-gray-200 rounded w-40 animate-pulse' />
				</div>
				<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6'>
					{[...Array(4)].map((_, i) => (
						<div key={i} className='bg-white rounded-xl p-5 min-h-[110px] shadow-sm flex flex-col gap-4'>
							<div className='flex items-center gap-2'>
								<div className='w-1.5 h-5 bg-gray-200 rounded animate-pulse' />
								<div className='h-4 bg-gray-200 rounded w-20 animate-pulse' />
							</div>
							<div className='h-7 bg-gray-200 rounded w-14 ml-3 animate-pulse' />
						</div>
					))}
				</div>
				<div className='bg-white rounded-xl p-5 shadow-sm mb-6'>
					<div className='h-5 bg-gray-200 rounded w-36 mb-4 animate-pulse' />
					<div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
						{[...Array(4)].map((_, i) => (
							<div key={i} className='h-14 bg-gray-100 rounded-xl animate-pulse' />
						))}
					</div>
				</div>
				{[...Array(2)].map((_, i) => (
					<div key={i} className='bg-white rounded-xl p-5 shadow-sm mb-6'>
						<div className='h-5 bg-gray-200 rounded w-64 mb-6 animate-pulse' />
						<div className='h-64 lg:h-80 bg-gray-100 rounded-lg animate-pulse' />
					</div>
				))}
				<div className='h-6 bg-gray-200 rounded w-48 mb-5 animate-pulse' />
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
					{[...Array(4)].map((_, i) => (
						<div key={i} className='bg-white rounded-2xl p-5 shadow-sm'>
							<div className='flex items-center gap-3 mb-5'>
								<div className='w-12 h-12 bg-gray-200 rounded-xl animate-pulse shrink-0' />
								<div className='flex flex-col gap-2 flex-1'>
									<div className='h-3 bg-gray-200 rounded w-16 animate-pulse' />
									<div className='h-5 bg-gray-200 rounded w-28 animate-pulse' />
								</div>
							</div>
							<div className='grid grid-cols-3 gap-3'>
								{[...Array(3)].map((_, j) => (
									<div key={j} className='h-24 bg-gray-100 rounded-xl animate-pulse' />
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	// ─── MAIN ─────────────────────────────────────────────────────────────────
	return (
		<div className='min-h-screen p-4 lg:p-6' style={rootStyle}>

			{/* Header */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-6 lg:mb-8'>
				<div>
					<p className='text-sm text-[#7D8592]'>Xush Kelibsiz {user?.fullName}</p>
					<h1 className='text-2xl lg:text-[32px] font-bold text-[#0A1629] leading-tight'>
						Boshqaruv paneli
					</h1>
				</div>
				<p className='py-1.5 px-3 bg-[#E6EDF5] rounded-xl text-xs sm:text-sm whitespace-nowrap shrink-0'>
					{currentDate.getDate()}-{' '}
					{currentDate.toLocaleString('uz-UZ', { month: 'long', year: 'numeric' })}
				</p>
			</div>

			{/* Stats Cards */}
			<div className='grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6'>
				{[
					{ label: 'Mentorlar',    value: teachers.length,          color: '#643DFF' },
					{ label: "O'quvchilar",  value: students.length,          color: '#14B8A6' },
					{ label: 'Guruhlar',     value: groups.length,            color: '#8B5CF6' },
					{ label: 'Davomat',      value: `${positiveAttendance}%`, color: '#F59E0B' },
				].map(({ label, value, color }) => (
					<div key={label} className='bg-white rounded-xl p-4 lg:p-5 shadow-sm flex flex-col justify-between min-h-[100px] lg:min-h-[120px]'>
						<div className='flex items-center gap-2'>
							<div className='w-1.5 h-5 rounded-r shrink-0' style={{ backgroundColor: color }} />
							<p className='text-xs lg:text-sm text-[#858D9D] font-medium truncate'>{label}</p>
						</div>
						<p className='text-xl lg:text-2xl font-bold text-gray-900 pl-3.5'>{value}</p>
					</div>
				))}
			</div>

			{/* Bugungi darslar */}
			<div className='bg-white rounded-xl p-4 lg:p-5 shadow-sm mb-6'>
				<h2 className='text-base lg:text-lg font-semibold text-[#333843] mb-4'>
					Bugungi darslar
				</h2>
				{todaysGroups.length > 0 ? (
					<Swiper
						modules={[FreeMode]}
						freeMode
						spaceBetween={12}
						breakpoints={{
							0:    { slidesPerView: 1 },
							480:  { slidesPerView: 2 },
							768:  { slidesPerView: 2 },
							1024: { slidesPerView: 3 },
							1280: { slidesPerView: 4 },
						}}
						className='w-full'
					>
						{todaysGroups.map((g, i) => (
							<SwiperSlide key={i}>
								<div className='rounded-lg border-l-4 border-[#643DFF] px-4 py-2.5 bg-[#F4F9FD]'>
									<h3 className='font-semibold text-sm text-[#0A1629]'>
										{g.start_time} - {g.end_time}
									</h3>
									<p className='text-xs text-gray-500 mt-0.5 truncate'>{g.name}</p>
								</div>
							</SwiperSlide>
						))}
					</Swiper>
				) : (
					<p className='text-sm text-[#7D8592]'>Bugun darslar yo&apos;q</p>
				)}
			</div>

			{/* Chart #1 */}
			<div className='bg-white rounded-xl p-4 lg:p-6 shadow-sm mb-6'>
				<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5'>
					<div>
						<h3 className='text-base lg:text-lg font-semibold text-[#333843]'>
							Oylar bo'yicha qabul qilingan studentlar
						</h3>
						<p className='text-xs text-[#7D8592] mt-1'>
							Joriy yil: <b>{currentDate.getFullYear()}</b>
						</p>
					</div>
					<div className='flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 rounded-xl shrink-0'>
						<svg className='w-4 h-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
							<path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
						</svg>
						<span className='text-sm font-semibold text-blue-600'>Jami: {students.length}</span>
					</div>
				</div>
				<div className='h-64 lg:h-80'>
					<Line ref={monthsChartRef} data={studentsBarData} options={studentsBarOptions} />
				</div>
			</div>

			{/* Chart #2 */}
			<div className='bg-white rounded-xl p-4 lg:p-6 shadow-sm mb-6'>
				<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4'>
					<h3 className='text-base lg:text-lg font-semibold text-[#333843]'>
						Mentorlar reytingi
					</h3>
					<span className='text-xs text-[#7D8592]'>Noyob studentlar soni</span>
				</div>
				<div className='h-64 lg:h-80'>
					<Line ref={mentorsChartRef} data={mentorBarData} options={mentorBarOptions} />
				</div>
				<div className='mt-4 flex flex-wrap gap-2'>
					{mentorStats.map(r => (
						<span key={r.name} className='text-xs bg-[#F4F9FD] px-2.5 py-1.5 rounded-md'>
							{r.name}: <b>{r.count}</b> ta
						</span>
					))}
				</div>
			</div>

			{/* Groups */}
			<h2 className='text-xl font-bold text-[#0A1629] mt-8 mb-5 ml-1'>
				Guruhlar statistikasi
			</h2>
			<div className='grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5'>
				{groups.map((group, index) => (
					<div
						key={group?._id ?? index}
						className='bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-[#643DFF]'
					>
						<div className='flex items-center justify-between mb-5'>
							<div className='flex items-center gap-3 min-w-0'>
								<div className='w-12 h-12 bg-gradient-to-br from-[#643DFF] to-[#8B5CF6] rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shrink-0'>
									{index + 1}
								</div>
								<div className='min-w-0'>
									<p className='text-xs text-[#7D8592] font-medium'>
										ID: {group._id ? group._id.slice(-6).toUpperCase() : `GR${index + 1}`}
									</p>
									<h3 className='text-base font-bold text-[#0A1629] mt-0.5 truncate'>
										{group.name || `Guruh ${index + 1}`}
									</h3>
								</div>
							</div>
							<div className='bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1.5 rounded-lg shrink-0 ml-2'>
								<p className='text-sm font-bold text-white'>{group.level || 'Yuqori'}</p>
							</div>
						</div>

						<div className='flex items-center gap-2 mb-5 pb-5 border-b border-gray-100'>
							<div className='bg-blue-50 p-1.5 rounded-lg'>
								<svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2}
										d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
								</svg>
							</div>
							<p className='text-sm text-gray-500'>
								Yaratilgan:{' '}
								<span className='font-semibold text-gray-700'>
									{group.createdAt ? new Date(group.createdAt).toLocaleDateString('uz-UZ') : 'Sep 12, 2020'}
								</span>
							</p>
						</div>

						<div className='grid grid-cols-3 gap-3'>
							<div className='bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-xl text-center'>
								<div className='w-9 h-9 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm'>
									<svg className='w-4 h-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
										<path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' />
									</svg>
								</div>
								<p className='text-xl font-bold text-blue-600'>
									{group.students?.length || group.totalStudents || '12'}
								</p>
								<p className='text-xs text-gray-500 font-medium mt-0.5'>Jami</p>
							</div>

							<div className='bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-xl text-center'>
								<div className='w-9 h-9 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm'>
									<svg className='w-4 h-4 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
										<path fillRule='evenodd'
											d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
											clipRule='evenodd' />
									</svg>
								</div>
								<p className='text-xl font-bold text-green-600'>
									{group.activeStudents || (group.students?.length ? Math.floor(group.students.length * 0.8) : '10')}
								</p>
								<p className='text-xs text-gray-500 font-medium mt-0.5'>Faol</p>
							</div>

							<div className='bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-xl text-center'>
								<div className='w-9 h-9 bg-white rounded-full flex items-center justify-center mx-auto mb-1.5 shadow-sm'>
									<svg className='w-4 h-4 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
										<path fillRule='evenodd'
											d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
											clipRule='evenodd' />
									</svg>
								</div>
								<p className='text-xl font-bold text-orange-600'>
									{group.pausedStudents || (group.students?.length ? Math.floor(group.students.length * 0.2) : '2')}
								</p>
								<p className='text-xs text-gray-500 font-medium mt-0.5'>To'xtatilgan</p>
							</div>
						</div>
					</div>
				))}

				{groups.length === 0 && (
					<div className='col-span-2 text-center py-12 text-gray-400 bg-white rounded-2xl'>
						<div className='text-5xl mb-3'>📚</div>
						<p className='font-medium'>Hozircha guruhlar mavjud emas</p>
					</div>
				)}
			</div>
		</div>
	)
}

export default Dashboard