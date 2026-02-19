import React, { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RefreshCw } from 'lucide-react'
import { setCredentials, logout } from '../../redux/authSlice'

// ❌ Sunday removed
const DAY_FILTERS = [
	{ key: 'odd_days', label: 'Toq', color: 'bg-blue-500' },
	{ key: 'even_days', label: 'Juft', color: 'bg-blue-500' },
	{ key: 'every_days', label: 'Har kuni', color: 'bg-blue-500' },
]

// Skeleton компоненты
const SkeletonFilter = () => (
	<div className="flex space-x-3">
		{DAY_FILTERS.map((_, index) => (
			<div
				key={index}
				className="px-6 py-3 rounded-xl bg-gray-200 animate-pulse"
				style={{ width: '80px' }}
			></div>
		))}
	</div>
)

const SkeletonTimeHeader = () => (
	<div className="flex border-b border-gray-200 bg-gray-50">
		{Array.from({ length: 13 }).map((_, index) => (
			<div
				key={index}
				className="flex-1 text-center py-3"
			>
				<div className="h-4 bg-gray-200 rounded animate-pulse mx-2"></div>
			</div>
		))}
	</div>
)

const SkeletonRoomRow = () => (
	<div className="flex min-h-20 relative border-b border-gray-200">
		<div className="absolute inset-0 flex">
			{Array.from({ length: 13 }).map((_, j) => (
				<div
					key={j}
					className="flex-1 border-l border-gray-100"
				></div>
			))}
		</div>
		<div className="absolute left-2 top-1/2 -translate-y-1/2">
			<div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
		</div>
		<div className="ml-24 flex-1 flex items-center">
			<div className="h-8 bg-gray-200 rounded animate-pulse mx-2" style={{ width: '20%' }}></div>
			<div className="h-8 bg-gray-200 rounded animate-pulse mx-2" style={{ width: '15%' }}></div>
		</div>
	</div>
)

const JadvalniKorish = () => {
	const dispatch = useDispatch()
	const accessToken = useSelector(state => state.auth.accessToken)
	const refreshToken = useSelector(state => state.auth.refreshToken)
	const user = useSelector(state => state.auth.user)

	const [selectedFilter, setSelectedFilter] = useState('odd_days')
	const [groups, setGroups] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState(null)
	const [hoveredGroup, setHoveredGroup] = useState(null)
	const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [isMobile, setIsMobile] = useState(false)

	const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`)

	// === Static 12 rooms ===
	const ROOMS = Array.from({ length: 12 }, (_, i) => ({
		id: i + 1,
		name: `Хона ${i + 1}`,
		color: i % 2 === 0 ? 'bg-blue-50' : 'bg-green-50',
	}))

	// === Check screen size ===
	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768)
		}

		checkScreenSize()
		window.addEventListener('resize', checkScreenSize)
		return () => window.removeEventListener('resize', checkScreenSize)
	}, [])

	// === Refresh Token ===
	const refreshAccessToken = useCallback(async () => {
		if (!refreshToken) {
			dispatch(logout())
			return null
		}
		setIsRefreshing(true)
		try {
			const response = await fetch(
				'https://zuhr-star-production.up.railway.app/api/users/refresh',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ refreshToken }),
				}
			)
			if (!response.ok) throw new Error('Ошибка обновления токена')
			const data = await response.json()
			dispatch(
				setCredentials({
					user,
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
				})
			)
			return data.accessToken
		} catch (err) {
			setError(err.message)
			dispatch(logout())
			return null
		} finally {
			setIsRefreshing(false)
		}
	}, [refreshToken, dispatch, user])

	// === Fetch Groups ===
	const fetchGroups = useCallback(async () => {
		try {
			setLoading(true)
			const token = accessToken
			if (!token) throw new Error('Нет accessToken')

			let response = await fetch(
				'https://zuhr-star-production.up.railway.app/api/groups/',
				{
					method: 'GET',
					headers: { Authorization: `Bearer ${token}` },
				}
			)

			if (response.status === 401) {
				const newToken = await refreshAccessToken()
				if (!newToken) throw new Error('Не удалось обновить accessToken')
				response = await fetch(
					'https://zuhr-star-production.up.railway.app/api/groups/',
					{
						method: 'GET',
						headers: { Authorization: `Bearer ${newToken}` },
					}
				)
			}

			const data = await response.json()
			setGroups(Array.isArray(data) ? data : [])
		} catch (err) {
			setError(err.message)
		} finally {
			setLoading(false)
		}
	}, [accessToken, refreshAccessToken])

	useEffect(() => {
		fetchGroups()
	}, [accessToken, refreshToken])

	const handleFilterSelect = filterKey => setSelectedFilter(filterKey)
	const handleRefresh = () => fetchGroups()

	// === Sunday removed ===
	function isGroupActiveForFilter(group) {
		if (!group || group.status !== 'active') return false
		const days = group.days || {}
		if (selectedFilter === 'every_days') return days.every_days
		if (selectedFilter === 'odd_days') return days.odd_days
		if (selectedFilter === 'even_days') return days.even_days
		return false
	}

	const filteredGroups = groups.filter(isGroupActiveForFilter)

	function getTimeSlotPosition(time) {
		if (!time) return -100
		const [hour, minute] = time.split(':').map(Number)
		const totalMinutes = hour * 60 + minute
		const startMinutes = 8 * 60
		const endMinutes = 21 * 60
		if (totalMinutes < startMinutes || totalMinutes >= endMinutes) return -100
		return ((totalMinutes - startMinutes) / (13 * 60)) * 100
	}

	// === Random colors for groups ===
	const COLORS = [
		'bg-blue-500',
		'bg-green-500',
		'bg-purple-500',
		'bg-pink-500',
		'bg-yellow-500',
		'bg-indigo-500',
		'bg-red-500',
		'bg-teal-500',
		'bg-orange-500',
		'bg-cyan-500',
	]

	const getGroupBlock = (group, index) => {
		const startPosition = getTimeSlotPosition(group.start_time)
		const endPosition = getTimeSlotPosition(group.end_time)
		return {
			startTime: group.start_time,
			endTime: group.end_time,
			subject: group.course || group.name,
			startPosition,
			width: Math.max(endPosition - startPosition, 6.25),
			color: COLORS[index % COLORS.length],
			group,
		}
	}

	// === Check if two groups overlap ===
	const doGroupsOverlap = (group1, group2) => {
		const start1 = group1.start_time
		const end1 = group1.end_time
		const start2 = group2.start_time
		const end2 = group2.end_time

		return start1 < end2 && end1 > start2
	}

	// === Assign rooms to groups ===
	const assignRoomsToGroups = () => {
		const roomAssignments = Array.from({ length: 12 }, () => [])

		filteredGroups.forEach(group => {
			let assigned = false

			// Try to find a room without overlap
			for (let roomIndex = 0; roomIndex < 12; roomIndex++) {
				const roomGroups = roomAssignments[roomIndex]
				const hasOverlap = roomGroups.some(existingGroup =>
					doGroupsOverlap(group, existingGroup)
				)

				if (!hasOverlap) {
					roomAssignments[roomIndex].push(group)
					assigned = true
					break
				}
			}

			// If no room found, add to first room (shouldn't happen with 12 rooms)
			if (!assigned) {
				roomAssignments[0].push(group)
			}
		})

		return roomAssignments
	}

	const roomAssignments = assignRoomsToGroups()

	const handleMouseEnter = (event, group) => {
		setHoveredGroup(group)
		setTooltipPosition({ x: event.clientX, y: event.clientY })
	}

	const handleMouseLeave = () => setHoveredGroup(null)

	const handleMouseMove = event => {
		if (hoveredGroup) {
			setTooltipPosition({ x: event.clientX, y: event.clientY })
		}
	}

	// === Sunday removed ===
	const getDaysList = days => {
		if (!days) return 'Белгиланмаган'
		const activeDays = []
		if (days.odd_days) activeDays.push('Тоқ кунлар')
		if (days.even_days) activeDays.push('Жуфт кунлар')
		if (days.every_days) activeDays.push('Ҳар куни')
		return activeDays.join(', ')
	}

	// Mobile view компонент
	const MobileGroupCard = ({ group }) => (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
			<div className="flex justify-between items-start mb-2">
				<h3 className="font-semibold text-gray-800 text-sm">{group.name}</h3>
				<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
					{group.start_time} - {group.end_time}
				</span>
			</div>
			<div className="space-y-1 text-xs text-gray-600">
				<p>Курс: {group.course || 'Белгиланмаган'}</p>
				<p>Ўқитувчи: {group.teacher_fullName || '—'}</p>
				<p>Кунлар: {getDaysList(group.days)}</p>
				<p>Талабалар: {group.students?.length || 0} та</p>
			</div>
		</div>
	)

	return (
		<div className="min-h-screen bg-gray-50 p-2 md:p-4" onMouseMove={handleMouseMove}>
			<div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm">
				{/* Header */}
				<div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
					<h1 className="text-lg md:text-xl font-medium text-gray-700">
						Dashboard HeadMentor
					</h1>
					<button
						onClick={handleRefresh}
						className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
						disabled={isRefreshing}
					>
						<RefreshCw
							className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`}
						/>
					</button>
				</div>

				{/* DAY FILTERS (No Sunday) */}
				<div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
					{loading ? (
						<SkeletonFilter />
					) : (
						<div className="flex flex-wrap gap-2 md:gap-3">
							{DAY_FILTERS.map(filter => (
								<button
									key={filter.key}
									onClick={() => handleFilterSelect(filter.key)}
									className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-all duration-200 text-sm md:text-base ${
										selectedFilter === filter.key
											? `${filter.color} text-white shadow-lg`
											: 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
									}`}
								>
									{filter.label}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Mobile View */}
				{isMobile ? (
					<div className="p-4">
						{loading ? (
							// Mobile Skeleton
							<div className="space-y-3">
								{Array.from({ length: 6 }).map((_, index) => (
									<div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
										<div className="flex justify-between mb-2">
											<div className="h-4 bg-gray-200 rounded animate-pulse w-1/3"></div>
											<div className="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
										</div>
										<div className="space-y-2">
											<div className="h-3 bg-gray-200 rounded animate-pulse"></div>
											<div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
											<div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
										</div>
									</div>
								))}
							</div>
						) : error ? (
							<div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
								{error}
							</div>
						) : filteredGroups.length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								Ҳозирча гуруҳлар мавжуд эмас
							</div>
						) : (
							<div className="space-y-3">
								{filteredGroups.map((group, index) => (
									<MobileGroupCard key={group._id || index} group={group} />
								))}
							</div>
						)}
					</div>
				) : (
					/* Desktop View */
					<>
						{/* Time Header */}
						{loading ? (
							<SkeletonTimeHeader />
						) : (
							<div className="flex border-b border-gray-200 bg-gray-50">
								{timeSlots.map(time => (
									<div
										key={time}
										className="flex-1 text-center py-3 text-sm font-medium text-gray-600 border-l border-gray-200"
									>
										{time}
									</div>
								))}
							</div>
						)}

						{/* Groups */}
						{loading ? (
							// Desktop Skeleton
							<div className="divide-y divide-gray-200">
								{Array.from({ length: 8 }).map((_, index) => (
									<SkeletonRoomRow key={index} />
								))}
							</div>
						) : error ? (
							<div className="p-8 text-center text-red-500 bg-red-50 rounded-lg m-4">
								{error}
							</div>
						) : filteredGroups.length === 0 ? (
							<div className="p-8 text-center text-gray-500">
								Ҳозирча гуруҳлар мавжуд эмас
							</div>
						) : (
							<div className="divide-y divide-gray-200">
								{ROOMS.map((room, roomIndex) => {
									const roomGroups = roomAssignments[roomIndex]

									return (
										<div
											key={room.id}
											className="flex min-h-20 relative hover:bg-gray-50 transition-colors"
										>
											{/* Grid */}
											<div className="absolute inset-0 flex">
												{timeSlots.map((_, j) => (
													<div
														key={j}
														className="flex-1 border-l border-gray-100"
													></div>
												))}
											</div>

											{/* Multiple Groups in one room */}
											{roomGroups.map((group, groupIndex) => {
												const block = getGroupBlock(group, groupIndex)
												return (
													<div
														key={`${room.id}-${groupIndex}`}
														className={`absolute ${block.color} text-white text-xs px-2 py-1 rounded-lg font-medium cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md`}
														style={{
															left: `${block.startPosition}%`,
															width: `${block.width}%`,
															height: '36px',
															top: '12px',
														}}
														onMouseEnter={e => handleMouseEnter(e, block.group)}
														onMouseLeave={handleMouseLeave}
													>
														<div className="truncate">
															{block.subject} ({block.startTime}-{block.endTime})
														</div>
													</div>
												)
											})}

											{/* Room Label */}
											<div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-sm bg-white px-2 py-1 rounded shadow-sm">
												{room.name}
											</div>
										</div>
									)
								})}
							</div>
						)}
					</>
				)}
			</div>

			{/* Tooltip (только для десктопа) */}
			{!isMobile && hoveredGroup && (
				<div
					className="fixed z-50 bg-gray-800 text-white text-sm rounded-lg shadow-xl p-4 max-w-xs pointer-events-none"
					style={{
						left: tooltipPosition.x + 10,
						top: tooltipPosition.y - 10,
						transform: 'translateY(-100%)',
					}}
				>
					<div className="space-y-2">
						<div className="font-semibold text-blue-300 border-b border-gray-600 pb-2">
							{hoveredGroup.name}
						</div>
						<div className="text-xs space-y-1">
							<p>Курс: {hoveredGroup.course || 'Белгиланмаган'}</p>
							<p>Ўқитувчи: {hoveredGroup.teacher_fullName || '—'}</p>
							<p>Кунлар: {getDaysList(hoveredGroup.days)}</p>
							<p>Талабалар сони: {hoveredGroup.students?.length || 0}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default JadvalniKorish